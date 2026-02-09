"""LLM Trainer wrapping HuggingFace Trainer with V2 callback bridge.

Key design decisions:
- Wraps HF Trainer (NOT our custom jenga_ai.training.trainer)
- JengaTrainerCallback bridges HF callback events → V2 TrainingCallback hooks
- DistillationTrainer overrides compute_loss() to use KnowledgeDistiller
- save() persists model + tokenizer + config YAML + metadata JSON
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

import torch
import torch.nn.functional as F
from transformers import Trainer as HFTrainer, TrainerCallback, TrainingArguments

from ..training.callbacks import TrainingCallback as JengaCallback
from ..training.regularization import KnowledgeDistiller
from .config import LLMConfig
from .data import LLMDataProcessor
from .model_factory import count_parameters, load_model_and_tokenizer, load_teacher_model

logger = logging.getLogger(__name__)


class JengaTrainerCallback(TrainerCallback):
    """Bridge HuggingFace Trainer callbacks → Jenga V2 TrainingCallback objects."""

    def __init__(self, callbacks: list[JengaCallback]) -> None:
        self.callbacks = callbacks

    def on_train_begin(self, args, state, control, **kwargs):
        for cb in self.callbacks:
            cb.on_train_begin()

    def on_epoch_begin(self, args, state, control, **kwargs):
        epoch = int(state.epoch) if state.epoch is not None else 0
        for cb in self.callbacks:
            cb.on_epoch_begin(epoch)

    def on_log(self, args, state, control, logs=None, **kwargs):
        step = state.global_step
        loss = logs.get("loss", 0.0) if logs else 0.0
        for cb in self.callbacks:
            cb.on_step(step, loss)

    def on_epoch_end(self, args, state, control, metrics=None, **kwargs):
        epoch = int(state.epoch) if state.epoch is not None else 0
        metrics = metrics or {}
        for cb in self.callbacks:
            cb.on_epoch_end(epoch, metrics)
        # Check early stopping
        for cb in self.callbacks:
            if cb.should_stop():
                control.should_training_stop = True
                logger.info("Early stopping triggered by V2 callback")
                break

    def on_train_end(self, args, state, control, **kwargs):
        for cb in self.callbacks:
            cb.on_train_end()


class DistillationTrainer(HFTrainer):
    """HF Trainer with knowledge distillation loss.

    Overrides compute_loss to blend student CE loss with KL divergence
    from teacher soft targets via KnowledgeDistiller.
    """

    def __init__(self, distiller: KnowledgeDistiller, **kwargs):
        super().__init__(**kwargs)
        self.distiller = distiller

    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        # Forward pass through student
        labels = inputs.pop("labels", None)
        outputs = model(**inputs)
        student_logits = outputs.logits

        if labels is not None:
            # Build teacher inputs (same as student but without labels)
            teacher_inputs = {k: v for k, v in inputs.items()}

            # Get teacher logits
            teacher_logits = self.distiller.get_teacher_logits(teacher_inputs)

            # Align sequence lengths if needed (teacher may have different tokenization)
            min_len = min(student_logits.size(1), teacher_logits.size(1))
            s_logits = student_logits[:, :min_len, :]
            t_logits = teacher_logits[:, :min_len, :]
            trunc_labels = labels[:, :min_len]

            # Shift for causal LM: predict next token
            shift_s = s_logits[:, :-1, :].contiguous()
            shift_t = t_logits[:, :-1, :].contiguous()
            shift_labels = trunc_labels[:, 1:].contiguous()

            # Hard target loss (standard CE, ignoring -100)
            hard_loss = F.cross_entropy(
                shift_s.view(-1, shift_s.size(-1)),
                shift_labels.view(-1),
                ignore_index=-100,
            )

            # Soft target loss (KL divergence with temperature scaling)
            T = self.distiller.temperature
            soft_student = F.log_softmax(shift_s / T, dim=-1)
            soft_teacher = F.softmax(shift_t / T, dim=-1)
            distill_loss = F.kl_div(
                soft_student.view(-1, soft_student.size(-1)),
                soft_teacher.view(-1, soft_teacher.size(-1)),
                reduction="batchmean",
            ) * (T ** 2)

            alpha = self.distiller.alpha
            loss = alpha * distill_loss + (1 - alpha) * hard_loss
        else:
            # No labels — just forward loss from model
            loss = outputs.loss

        return (loss, outputs) if return_outputs else loss


class LLMTrainer:
    """High-level LLM fine-tuning trainer.

    Orchestrates model loading, data processing, HF Trainer creation,
    training, and saving.

    Usage:
        config = LLMConfig.from_yaml("config.yaml")
        trainer = LLMTrainer(config)
        metrics = trainer.train(train_dataset, eval_dataset)
        trainer.save("./output")
    """

    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self.model = None
        self.tokenizer = None
        self._hf_trainer: Optional[HFTrainer] = None

    def train(
        self,
        train_dataset,
        eval_dataset=None,
        callbacks: Optional[list[JengaCallback]] = None,
    ) -> dict[str, float]:
        """Run the full training pipeline.

        Args:
            train_dataset: Tokenized training dataset.
            eval_dataset: Tokenized eval dataset (optional).
            callbacks: V2 TrainingCallback instances to bridge.

        Returns:
            Training metrics dict.
        """
        # 1. Load model + tokenizer
        self.model, self.tokenizer = load_model_and_tokenizer(self.config)

        # 2. Data collator
        data_processor = LLMDataProcessor(self.config, self.tokenizer)
        data_collator = data_processor.get_data_collator()

        # 3. Build HF TrainingArguments
        hf_args = TrainingArguments(**self.config.training.to_hf_training_args())

        # 4. Bridge callbacks
        hf_callbacks = []
        if callbacks:
            hf_callbacks.append(JengaTrainerCallback(callbacks))

        # 5. Create trainer (distillation or standard)
        if self.config.distillation.enabled:
            teacher = load_teacher_model(self.config.distillation)
            distiller = KnowledgeDistiller(
                teacher_model=teacher,
                temperature=self.config.distillation.temperature,
                alpha=self.config.distillation.alpha,
            )
            self._hf_trainer = DistillationTrainer(
                distiller=distiller,
                model=self.model,
                args=hf_args,
                train_dataset=train_dataset,
                eval_dataset=eval_dataset,
                data_collator=data_collator,
                callbacks=hf_callbacks,
            )
            logger.info("Using DistillationTrainer with teacher '%s'", self.config.distillation.teacher_model)
        else:
            self._hf_trainer = HFTrainer(
                model=self.model,
                args=hf_args,
                train_dataset=train_dataset,
                eval_dataset=eval_dataset,
                data_collator=data_collator,
                callbacks=hf_callbacks,
            )

        # 6. Train
        logger.info("Starting LLM training: %s", self.config.model_name)
        result = self._hf_trainer.train()
        metrics = result.metrics
        logger.info("Training complete. Metrics: %s", metrics)

        return metrics

    def evaluate(self, eval_dataset=None) -> dict[str, float]:
        """Run evaluation.

        Args:
            eval_dataset: Dataset to evaluate on (uses trainer's eval set if None).

        Returns:
            Evaluation metrics dict.
        """
        if self._hf_trainer is None:
            raise RuntimeError("Must call train() before evaluate()")
        metrics = self._hf_trainer.evaluate(eval_dataset=eval_dataset)
        logger.info("Evaluation metrics: %s", metrics)
        return metrics

    def save(self, output_dir: str) -> None:
        """Save model, tokenizer, config, and metadata.

        Args:
            output_dir: Directory to save to.
        """
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Must call train() before save()")

        save_path = Path(output_dir)
        save_path.mkdir(parents=True, exist_ok=True)

        # Save model (LoRA adapters if PEFT, full weights otherwise)
        self.model.save_pretrained(save_path)
        self.tokenizer.save_pretrained(save_path)

        # Save config
        self.config.to_yaml(save_path / "llm_config.yaml")

        # Save metadata
        params = count_parameters(self.model)
        metadata = {
            "model_name": self.config.model_name,
            "task_type": self.config.task_type.value,
            "lora_enabled": self.config.lora.enabled,
            "quantization_enabled": self.config.quantization.enabled,
            "distillation_enabled": self.config.distillation.enabled,
            "parameters": params,
        }
        with open(save_path / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        logger.info("LLM model saved to %s", save_path)

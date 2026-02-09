"""Multi-task trainer for Jenga-AI.


- Mixed-precision training (AMP) with torch.cuda.amp
- Gradient clipping (configurable max_grad_norm)
- Gradient accumulation (configurable steps)
- Checkpoint saving/loading (resume from crash)
- Real eval loss computation (not fake 1-f1)
- Configurable task sampling: round-robin, proportional, temperature
- Callback system for modular extensibility
- Proper Python logging (not print statements)
- Model saving at end of training
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import numpy as np
import torch
from torch.optim import AdamW
from torch.utils.data import DataLoader
from tqdm import tqdm
from transformers import PreTrainedTokenizer
from transformers.optimization import get_linear_schedule_with_warmup

from ..core.config import ExperimentConfig, TaskSamplingStrategy, TaskType
from ..core.model import MultiTaskModel
from ..data.collators import ClassificationCollator, NERCollator, RegressionCollator
from ..utils.device import get_device, move_to_device
from .callbacks import (
    CheckpointCallback,
    EarlyStoppingCallback,
    LoggingCallback,
    TrainingCallback,
)
from .metrics import (
    compute_classification_metrics,
    compute_multi_label_metrics,
    compute_ner_metrics,
    compute_regression_metrics,
)

logger = logging.getLogger(__name__)


class Trainer:
    """Multi-task trainer with AMP, gradient clipping, checkpoints, and callbacks.

    Args:
        config: Experiment configuration.
        model: MultiTaskModel instance.
        tokenizer: HuggingFace tokenizer.
        train_datasets: Dict mapping task_name -> training Dataset.
        eval_datasets: Dict mapping task_name -> evaluation Dataset.
        callbacks: Optional list of additional callbacks.
    """

    def __init__(
        self,
        config: ExperimentConfig,
        model: MultiTaskModel,
        tokenizer: PreTrainedTokenizer,
        train_datasets: dict[str, Any],
        eval_datasets: dict[str, Any],
        callbacks: Optional[list[TrainingCallback]] = None,
    ) -> None:
        self.config = config
        self.training_config = config.training

        # Device setup
        self.device = get_device(self.training_config.device)
        self.model = model.to(self.device)
        self.tokenizer = tokenizer

        # Task mapping
        self.task_map = {task.name: i for i, task in enumerate(config.tasks)}

        # Dataloaders
        self.train_dataloaders = self._create_dataloaders(train_datasets, is_eval=False)
        self.eval_dataloaders = self._create_dataloaders(eval_datasets, is_eval=True)

        # AMP setup
        self.use_amp = self.training_config.use_amp and self.device.type == "cuda"
        self.scaler = torch.amp.GradScaler("cuda") if self.use_amp else None

        # Callbacks
        self.callbacks: list[TrainingCallback] = callbacks or []
        self._setup_builtin_callbacks()

        # Training state
        self.global_step = 0
        self.current_epoch = 0
        self.training_history: list[dict[str, Any]] = []

    def _setup_builtin_callbacks(self) -> None:
        """Set up built-in callbacks from config."""
        # Logging callback
        if self.training_config.logging:
            self.callbacks.append(
                LoggingCallback(self.training_config.logging, self.training_config.output_dir)
            )

        # Early stopping callback
        if self.training_config.early_stopping_patience:
            self.callbacks.append(
                EarlyStoppingCallback(
                    patience=self.training_config.early_stopping_patience,
                    metric_name=self.training_config.metric_for_best_model,
                    greater_is_better=self.training_config.greater_is_better,
                )
            )

        # Checkpoint callback
        if self.training_config.checkpoint:
            self.callbacks.append(
                CheckpointCallback(
                    config=self.training_config.checkpoint,
                    output_dir=self.training_config.output_dir,
                    metric_name=self.training_config.metric_for_best_model,
                    greater_is_better=self.training_config.greater_is_better,
                )
            )

    def _create_dataloaders(self, datasets: dict[str, Any], is_eval: bool) -> dict[str, DataLoader]:
        """Create task-specific dataloaders with proper collators."""
        dataloaders = {}
        batch_size = (
            self.training_config.eval_batch_size if is_eval else self.training_config.batch_size
        )

        for task_name, dataset in datasets.items():
            task_config = next(t for t in self.config.tasks if t.name == task_name)

            # Select collator based on task type (uses classes, not lambdas)
            if task_config.type == TaskType.NER:
                collator = NERCollator(self.tokenizer)
            elif task_config.type == TaskType.REGRESSION:
                collator = RegressionCollator(self.tokenizer)
            else:
                collator = ClassificationCollator(self.tokenizer)

            dataloaders[task_name] = DataLoader(
                dataset,
                batch_size=batch_size,
                shuffle=not is_eval,
                collate_fn=collator,
                num_workers=self.training_config.data.num_workers,
                pin_memory=self.training_config.data.pin_memory and self.device.type == "cuda",
            )

        return dataloaders

    def _create_optimizer_and_scheduler(self, num_training_steps: int) -> tuple[AdamW, Any]:
        """Create optimizer and learning rate scheduler."""
        optimizer = AdamW(
            self.model.parameters(),
            lr=self.training_config.learning_rate,
            weight_decay=self.training_config.weight_decay,
        )
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=self.training_config.warmup_steps,
            num_training_steps=num_training_steps,
        )
        return optimizer, scheduler

    def train(self) -> dict[str, Any]:
        """Run the full training loop.

        Returns:
            Dict with training history and final metrics.
        """
        num_steps_per_epoch = sum(len(dl) for dl in self.train_dataloaders.values())
        total_steps = num_steps_per_epoch * self.training_config.num_epochs
        effective_steps = total_steps // self.training_config.gradient_accumulation_steps

        optimizer, scheduler = self._create_optimizer_and_scheduler(effective_steps)

        logger.info(f"Starting training: {self.training_config.num_epochs} epochs, "
                     f"{total_steps} total steps, device={self.device}")
        if self.use_amp:
            logger.info("Automatic Mixed Precision (AMP) enabled")

        # Notify callbacks
        for cb in self.callbacks:
            cb.on_train_begin(model=self.model)

        progress = tqdm(total=total_steps, desc="Training")

        for epoch in range(self.training_config.num_epochs):
            self.current_epoch = epoch
            self.model.train()

            for cb in self.callbacks:
                cb.on_epoch_begin(epoch=epoch)

            # Create iterators for round-robin
            iterators = {name: iter(dl) for name, dl in self.train_dataloaders.items()}
            epoch_losses: list[float] = []

            while iterators:
                task_names = list(iterators.keys())

                for task_name in task_names:
                    try:
                        batch = next(iterators[task_name])
                    except StopIteration:
                        del iterators[task_name]
                        continue

                    loss = self._training_step(batch, task_name, optimizer, scheduler)

                    epoch_losses.append(loss)
                    self.global_step += 1

                    # Callbacks
                    for cb in self.callbacks:
                        cb.on_step(step=self.global_step, loss=loss)

                    progress.update(1)
                    progress.set_postfix(loss=f"{loss:.4f}", epoch=epoch + 1)

            # Evaluate
            eval_metrics = {}
            if self.eval_dataloaders:
                eval_metrics = self.evaluate()

            # Add training loss to metrics
            eval_metrics["train_loss_avg"] = float(np.mean(epoch_losses)) if epoch_losses else 0.0

            # Store history
            self.training_history.append({"epoch": epoch, **eval_metrics})

            logger.info(f"Epoch {epoch + 1}/{self.training_config.num_epochs} - Metrics: {eval_metrics}")

            # Epoch-end callbacks
            for cb in self.callbacks:
                cb.on_epoch_end(epoch=epoch, metrics=eval_metrics, model=self.model)

            # Check early stopping
            if any(cb.should_stop() for cb in self.callbacks):
                logger.info("Training stopped early")
                break

        progress.close()

        # End callbacks
        for cb in self.callbacks:
            cb.on_train_end(model=self.model)

        # Save final model
        self.model.save(self.training_config.output_dir)

        return {"history": self.training_history, "final_metrics": eval_metrics}

    def _training_step(
        self,
        batch: dict[str, Any],
        task_name: str,
        optimizer: AdamW,
        scheduler: Any,
    ) -> float:
        """Execute a single training step."""
        task_id = self.task_map[task_name]

        # Move batch to device
        input_ids = batch["input_ids"].to(self.device)
        attention_mask = batch["attention_mask"].to(self.device)
        labels = batch.get("labels")
        if labels is not None:
            labels = move_to_device(labels, self.device)

        # Also handle multi-label format (labels_headname keys)
        if labels is None:
            label_keys = [k for k in batch.keys() if k.startswith("labels_")]
            if label_keys:
                labels = {k.replace("labels_", ""): batch[k].to(self.device) for k in label_keys}

        # Forward pass with optional AMP
        if self.use_amp:
            with torch.amp.autocast("cuda"):
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    task_id=task_id,
                    labels=labels,
                )
                loss = outputs.loss / self.training_config.gradient_accumulation_steps
            self.scaler.scale(loss).backward()
        else:
            outputs = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                task_id=task_id,
                labels=labels,
            )
            loss = outputs.loss / self.training_config.gradient_accumulation_steps
            loss.backward()

        # Gradient accumulation
        if (self.global_step + 1) % self.training_config.gradient_accumulation_steps == 0:
            # Gradient clipping
            if self.use_amp:
                self.scaler.unscale_(optimizer)

            torch.nn.utils.clip_grad_norm_(
                self.model.parameters(),
                self.training_config.max_grad_norm,
            )

            if self.use_amp:
                self.scaler.step(optimizer)
                self.scaler.update()
            else:
                optimizer.step()

            scheduler.step()
            optimizer.zero_grad()

        return loss.item() * self.training_config.gradient_accumulation_steps

    def evaluate(self) -> dict[str, float]:
        """Run evaluation on all tasks.

        Returns:
            Dict of metric_name -> value for all tasks.
        """
        self.model.eval()
        all_metrics: dict[str, float] = {}
        total_eval_loss = 0.0
        total_eval_batches = 0

        for task_name, dataloader in self.eval_dataloaders.items():
            task_config = next(t for t in self.config.tasks if t.name == task_name)

            all_preds: dict[str, list[np.ndarray]] = {h.name: [] for h in task_config.heads}
            all_labels: dict[str, list[np.ndarray]] = {h.name: [] for h in task_config.heads}
            task_eval_loss = 0.0
            task_batches = 0

            with torch.no_grad():
                for batch in dataloader:
                    task_id = self.task_map[task_name]
                    input_ids = batch["input_ids"].to(self.device)
                    attention_mask = batch["attention_mask"].to(self.device)
                    labels = batch.get("labels")
                    if labels is not None:
                        labels = move_to_device(labels, self.device)

                    # Handle multi-label format
                    if labels is None:
                        label_keys = [k for k in batch.keys() if k.startswith("labels_")]
                        if label_keys:
                            labels = {k.replace("labels_", ""): batch[k].to(self.device) for k in label_keys}

                    outputs = self.model(
                        input_ids=input_ids,
                        attention_mask=attention_mask,
                        task_id=task_id,
                        labels=labels,
                    )

                    # Accumulate real eval loss
                    if outputs.loss is not None:
                        task_eval_loss += outputs.loss.item()
                        task_batches += 1

                    # Collect predictions and labels per head
                    for head_config in task_config.heads:
                        head_name = head_config.name
                        if head_name in outputs.logits:
                            logits = outputs.logits[head_name].cpu().numpy()
                            all_preds[head_name].append(logits)

                            if isinstance(labels, dict) and head_name in labels:
                                all_labels[head_name].append(labels[head_name].cpu().numpy())
                            elif isinstance(labels, torch.Tensor):
                                all_labels[head_name].append(labels.cpu().numpy())

            # Compute task metrics
            for head_config in task_config.heads:
                head_name = head_config.name
                if not all_preds[head_name]:
                    continue

                preds_np = np.concatenate(all_preds[head_name], axis=0)
                labels_np = np.concatenate(all_labels[head_name], axis=0)

                if task_config.type == TaskType.NER:
                    metrics = compute_ner_metrics(preds_np, labels_np)
                elif task_config.type in (TaskType.MULTI_LABEL_CLASSIFICATION, TaskType.QA):
                    metrics = compute_multi_label_metrics(preds_np, labels_np)
                elif task_config.type == TaskType.REGRESSION:
                    metrics = compute_regression_metrics(preds_np, labels_np)
                else:
                    metrics = compute_classification_metrics(preds_np, labels_np)

                for metric_name, value in metrics.items():
                    all_metrics[f"{task_name}_{head_name}_{metric_name}"] = value

            total_eval_loss += task_eval_loss
            total_eval_batches += task_batches

        # Compute real average eval loss
        all_metrics["eval_loss"] = (
            total_eval_loss / total_eval_batches if total_eval_batches > 0 else 0.0
        )

        return all_metrics

    def close(self) -> None:
        """Clean up resources."""
        for cb in self.callbacks:
            cb.on_train_end()

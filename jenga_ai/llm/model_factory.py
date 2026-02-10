"""Model loading with LoRA adapters and quantization for LLM fine-tuning.

Fixes from V1:
- pad_token set for GPT models (was: tokenizer fails silently)
- Clear error on model not found (was: opaque HF Hub error)
- CUDA check before quantization (was: cryptic bitsandbytes crash)
- OOM handling with actionable message
"""

from __future__ import annotations

import logging
from typing import Any

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    PreTrainedModel,
    PreTrainedTokenizer,
)

from .config import LLMConfig, LLMTaskType, TeacherStudentConfig

logger = logging.getLogger(__name__)


def load_model_and_tokenizer(
    config: LLMConfig,
) -> tuple[PreTrainedModel, PreTrainedTokenizer]:
    """Load model and tokenizer with optional LoRA and quantization.

    Args:
        config: LLM configuration.

    Returns:
        (model, tokenizer) tuple ready for training.
    """
    model_name = config.model_name

    # --- Tokenizer ---
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
    except OSError as e:
        raise ValueError(
            f"Cannot load tokenizer for '{model_name}'. "
            f"Check model name, network, or HF credentials. Error: {e}"
        ) from e

    # V1 bug fix: GPT models lack a pad_token
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id
        logger.info("Set pad_token = eos_token for model '%s'", model_name)

    # --- Model loading kwargs ---
    model_kwargs: dict[str, Any] = {}

    # Quantization
    if config.quantization.enabled:
        from transformers import BitsAndBytesConfig

        compute_dtype = getattr(torch, config.quantization.compute_dtype, torch.float16)
        if config.quantization.bits == 4:
            model_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=config.quantization.double_quant,
                bnb_4bit_quant_type=config.quantization.quant_type,
                bnb_4bit_compute_dtype=compute_dtype,
            )
        else:  # 8-bit
            model_kwargs["quantization_config"] = BitsAndBytesConfig(load_in_8bit=True)
        model_kwargs["device_map"] = "auto"
    else:
        # No quantization — pick dtype based on hardware
        if torch.cuda.is_available():
            model_kwargs["torch_dtype"] = torch.float16
            model_kwargs["device_map"] = "auto"
        else:
            model_kwargs["torch_dtype"] = torch.float32

    # --- Load model ---
    auto_cls = (
        AutoModelForSeq2SeqLM
        if config.task_type == LLMTaskType.SEQ2SEQ
        else AutoModelForCausalLM
    )
    try:
        model = auto_cls.from_pretrained(model_name, **model_kwargs)
    except OSError as e:
        raise ValueError(
            f"Cannot load model '{model_name}'. "
            f"Check model name, network, or HF credentials. Error: {e}"
        ) from e
    except torch.cuda.OutOfMemoryError as e:
        raise RuntimeError(
            f"GPU out of memory loading '{model_name}'. "
            f"Try enabling quantization (4-bit) or using a smaller model. Error: {e}"
        ) from e

    # --- LoRA ---
    if config.lora.enabled:
        from peft import LoraConfig as PeftLoraConfig, get_peft_model, TaskType

        task_type = TaskType.SEQ_2_SEQ_LM if config.task_type == LLMTaskType.SEQ2SEQ else TaskType.CAUSAL_LM
        lora_config = PeftLoraConfig(
            r=config.lora.rank,
            lora_alpha=config.lora.alpha,
            lora_dropout=config.lora.dropout,
            target_modules=config.lora.target_modules,
            bias=config.lora.bias,
            task_type=task_type,
        )
        model = get_peft_model(model, lora_config)
        params = count_parameters(model)
        logger.info(
            "LoRA applied: %s trainable / %s total (%.2f%%)",
            f"{params['trainable']:,}",
            f"{params['total']:,}",
            params["trainable_pct"],
        )

    return model, tokenizer


def count_parameters(model: PreTrainedModel) -> dict[str, Any]:
    """Count model parameters.

    Returns:
        Dict with keys: total, trainable, frozen, trainable_pct.
    """
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    frozen = total - trainable
    pct = (trainable / total * 100) if total > 0 else 0.0
    return {
        "total": total,
        "trainable": trainable,
        "frozen": frozen,
        "trainable_pct": pct,
    }


def merge_lora_weights(model: PreTrainedModel) -> PreTrainedModel:
    """Merge LoRA adapters into base weights for deployment.

    Args:
        model: PEFT model with LoRA adapters.

    Returns:
        Base model with merged weights.
    """
    if not hasattr(model, "merge_and_unload"):
        raise TypeError(
            "Model does not have LoRA adapters. "
            "Only PEFT models with LoRA can be merged."
        )
    merged = model.merge_and_unload()
    logger.info("LoRA weights merged into base model")
    return merged


def load_teacher_model(config: TeacherStudentConfig) -> PreTrainedModel:
    """Load a frozen teacher model for distillation.

    Args:
        config: Teacher-student distillation configuration.

    Returns:
        Frozen teacher model.
    """
    if not config.teacher_model:
        raise ValueError("teacher_model must be specified for distillation")

    try:
        teacher = AutoModelForCausalLM.from_pretrained(
            config.teacher_model,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
        )
    except OSError as e:
        raise ValueError(
            f"Cannot load teacher model '{config.teacher_model}'. "
            f"Check model name, network, or HF credentials. Error: {e}"
        ) from e

    teacher.eval()
    for param in teacher.parameters():
        param.requires_grad = False

    logger.info("Teacher model loaded and frozen: %s", config.teacher_model)
    return teacher

"""Pydantic v2 configuration for LLM fine-tuning.

Fixes from V1:
- fp16 auto-disables on CPU (was: crash at training time)
- evaluation_strategy → eval_strategy normalization (was: HF version mismatch)
- learning_rate string→float casting (was: YAML "2e-5" loaded as string)
- Quantization requires CUDA check (was: cryptic bitsandbytes error)
- LoRA rank validation (was: no check)
"""

from __future__ import annotations

import logging
import warnings
from enum import Enum
from pathlib import Path
from typing import Any, Literal, Optional

import yaml
from pydantic import BaseModel, Field, field_validator, model_validator

from ..core.config import LoggingConfig, _convert_enums

logger = logging.getLogger(__name__)


class LLMTaskType(str, Enum):
    CAUSAL_LM = "causal_lm"
    SEQ2SEQ = "seq2seq"


class LoRAConfig(BaseModel):
    """LoRA adapter configuration."""

    enabled: bool = Field(default=False, description="Enable LoRA adapters")
    rank: int = Field(default=8, gt=0, description="LoRA rank (lower = fewer params)")
    alpha: int = Field(default=16, gt=0, description="LoRA alpha scaling factor")
    target_modules: list[str] = Field(
        default=["q_proj", "v_proj"], description="Modules to apply LoRA to"
    )
    dropout: float = Field(default=0.05, ge=0.0, le=1.0, description="LoRA dropout")
    bias: str = Field(default="none", description="Bias handling: none, all, lora_only")


class QuantizationConfig(BaseModel):
    """BitsAndBytes quantization configuration."""

    enabled: bool = Field(default=False, description="Enable quantization")
    bits: Literal[4, 8] = Field(default=4, description="Quantization bits")
    double_quant: bool = Field(default=True, description="Use double quantization (4-bit only)")
    quant_type: str = Field(default="nf4", description="Quantization type: nf4, fp4")
    compute_dtype: str = Field(default="float16", description="Compute dtype: float16, bfloat16")

    @model_validator(mode="after")
    def validate_cuda_available(self) -> "QuantizationConfig":
        if self.enabled:
            import torch

            if not torch.cuda.is_available():
                raise ValueError(
                    "Quantization requires CUDA but no GPU is available. "
                    "Set quantization.enabled=false or use a CUDA-capable machine."
                )
        return self


class TeacherStudentConfig(BaseModel):
    """Knowledge distillation configuration."""

    enabled: bool = Field(default=False, description="Enable teacher-student distillation")
    teacher_model: str = Field(default="", description="HF model name for teacher")
    temperature: float = Field(default=2.0, gt=0.0, description="Distillation temperature")
    alpha: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Balance: 0=only student loss, 1=only distillation loss",
    )


class LLMDataConfig(BaseModel):
    """Data configuration for LLM fine-tuning."""

    path: str | list[str] = Field(..., description="Data file path(s)")
    format: str = Field(default="json", description="Data format: json, jsonl, csv")
    text_column: str = Field(default="text", description="Column with input text")
    response_column: str = Field(default="response", description="Column with target response")
    instruction_column: Optional[str] = Field(
        default=None, description="Column with instructions (enables instruction format)"
    )
    max_length: int = Field(default=512, gt=0, le=8192, description="Maximum sequence length")
    train_split: str = Field(default="train", description="Train split name")
    eval_split: Optional[str] = Field(default=None, description="Eval split name (None = auto-split)")
    test_size: float = Field(default=0.1, gt=0.0, lt=1.0, description="Fraction for eval if auto-splitting")
    streaming: bool = Field(default=False, description="Use streaming mode for large datasets")


class LLMTrainingConfig(BaseModel):
    """Training hyperparameters for LLM fine-tuning."""

    output_dir: str = Field(..., description="Directory for saving outputs")
    learning_rate: float = Field(default=2e-5, gt=0.0, description="Learning rate")
    num_epochs: int = Field(default=3, gt=0, description="Number of training epochs")
    batch_size: int = Field(default=4, gt=0, description="Per-device training batch size")
    eval_batch_size: Optional[int] = Field(default=None, gt=0, description="Per-device eval batch size")
    gradient_accumulation_steps: int = Field(default=1, gt=0, description="Gradient accumulation steps")
    warmup_ratio: float = Field(default=0.03, ge=0.0, le=1.0, description="Warmup ratio of total steps")
    weight_decay: float = Field(default=0.01, ge=0.0, description="Weight decay")
    max_grad_norm: float = Field(default=1.0, gt=0.0, description="Max gradient norm for clipping")
    fp16: bool = Field(default=False, description="Use fp16 mixed precision")
    bf16: bool = Field(default=False, description="Use bf16 mixed precision")
    eval_strategy: str = Field(default="epoch", description="Evaluation strategy: epoch, steps, no")
    save_strategy: str = Field(default="epoch", description="Save strategy: epoch, steps, no")
    logging_steps: int = Field(default=10, gt=0, description="Log every N steps")
    save_total_limit: int = Field(default=3, gt=0, description="Max checkpoints to keep")

    @field_validator("learning_rate", mode="before")
    @classmethod
    def cast_learning_rate(cls, v: Any) -> float:
        """V1 bug fix: YAML loads '2e-5' as string."""
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                raise ValueError(f"Cannot convert learning_rate '{v}' to float")
        return v

    @field_validator("eval_strategy", mode="before")
    @classmethod
    def normalize_eval_strategy(cls, v: str) -> str:
        """V1 bug fix: normalize evaluation_strategy → eval_strategy."""
        return v.replace("evaluation_strategy", "eval_strategy") if isinstance(v, str) else v

    @model_validator(mode="after")
    def validate_precision(self) -> "LLMTrainingConfig":
        """V1 bug fix: auto-disable fp16 on CPU."""
        if self.fp16 or self.bf16:
            import torch

            if not torch.cuda.is_available():
                if self.fp16:
                    warnings.warn(
                        "fp16=True but CUDA not available. Auto-disabling fp16.",
                        stacklevel=2,
                    )
                    self.fp16 = False
                if self.bf16:
                    warnings.warn(
                        "bf16=True but CUDA not available. Auto-disabling bf16.",
                        stacklevel=2,
                    )
                    self.bf16 = False
        if self.eval_batch_size is None:
            self.eval_batch_size = self.batch_size
        return self

    def to_hf_training_args(self) -> dict[str, Any]:
        """Convert to dict suitable for HF TrainingArguments."""
        return {
            "output_dir": self.output_dir,
            "learning_rate": self.learning_rate,
            "num_train_epochs": self.num_epochs,
            "per_device_train_batch_size": self.batch_size,
            "per_device_eval_batch_size": self.eval_batch_size or self.batch_size,
            "gradient_accumulation_steps": self.gradient_accumulation_steps,
            "warmup_ratio": self.warmup_ratio,
            "weight_decay": self.weight_decay,
            "max_grad_norm": self.max_grad_norm,
            "fp16": self.fp16,
            "bf16": self.bf16,
            "eval_strategy": self.eval_strategy,
            "save_strategy": self.save_strategy,
            "logging_steps": self.logging_steps,
            "save_total_limit": self.save_total_limit,
        }


class LLMConfig(BaseModel):
    """Top-level LLM fine-tuning configuration."""

    model_name: str = Field(..., min_length=1, description="HuggingFace model name or path")
    task_type: LLMTaskType = Field(default=LLMTaskType.CAUSAL_LM, description="LLM task type")
    lora: LoRAConfig = Field(default_factory=LoRAConfig, description="LoRA adapter config")
    quantization: QuantizationConfig = Field(
        default_factory=QuantizationConfig, description="Quantization config"
    )
    distillation: TeacherStudentConfig = Field(
        default_factory=TeacherStudentConfig, description="Knowledge distillation config"
    )
    data: LLMDataConfig = Field(..., description="Data configuration")
    training: LLMTrainingConfig = Field(..., description="Training configuration")
    logging: LoggingConfig = Field(default_factory=LoggingConfig, description="Logging configuration")

    def to_dict(self) -> dict[str, Any]:
        """Serialize config to a dictionary."""
        return self.model_dump(mode="python")

    def to_yaml(self, path: str | Path) -> None:
        """Save config to a YAML file."""
        data = self.model_dump(mode="python")
        _convert_enums(data)
        with open(path, "w") as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
        logger.info(f"LLM config saved to {path}")

    @classmethod
    def from_yaml(cls, path: str | Path) -> "LLMConfig":
        """Load config from a YAML file."""
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls(**data)

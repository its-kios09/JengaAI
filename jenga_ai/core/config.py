"""Pydantic-based configuration system for Jenga-AI .

"""

from __future__ import annotations

import logging
from enum import Enum
from pathlib import Path
from typing import Any, Optional

import yaml
from pydantic import BaseModel, Field, field_validator, model_validator

logger = logging.getLogger(__name__)


# --- Enums ---


class TaskType(str, Enum):
    SINGLE_LABEL_CLASSIFICATION = "single_label_classification"
    MULTI_LABEL_CLASSIFICATION = "multi_label_classification"
    NER = "ner"
    SENTIMENT = "sentiment"
    REGRESSION = "regression"
    QA = "question_answering"


class FusionType(str, Enum):
    ATTENTION = "attention"
    CONCATENATION = "concatenation"
    NONE = "none"


class LoggingService(str, Enum):
    TENSORBOARD = "tensorboard"
    MLFLOW = "mlflow"
    NONE = "none"


class TaskSamplingStrategy(str, Enum):
    ROUND_ROBIN = "round_robin"
    PROPORTIONAL = "proportional"
    TEMPERATURE = "temperature"


# --- Config Models ---


class HeadConfig(BaseModel):
    """Configuration for a single prediction head."""

    name: str = Field(..., min_length=1, description="Unique name for this head")
    num_labels: int = Field(..., gt=0, description="Number of output labels/classes")
    weight: float = Field(default=1.0, gt=0.0, description="Loss weight for this head")
    dropout: float = Field(default=0.1, ge=0.0, le=1.0, description="Dropout rate for this head")


class TaskConfig(BaseModel):
    """Configuration for a single task."""

    name: str = Field(..., min_length=1, description="Unique name for this task")
    type: TaskType = Field(..., description="Type of NLP task")
    data_path: str = Field(..., min_length=1, description="Path to the data file")
    heads: list[HeadConfig] = Field(..., min_length=1, description="List of prediction heads")
    text_column: str = Field(default="text", description="Name of the text column in data")
    label_column: str = Field(default="labels", description="Name of the label column in data")
    label_maps: Optional[dict[str, dict[int, str]]] = Field(
        default=None, description="Mapping from label IDs to label names"
    )

    @field_validator("heads")
    @classmethod
    def validate_unique_head_names(cls, v: list[HeadConfig]) -> list[HeadConfig]:
        names = [h.name for h in v]
        if len(names) != len(set(names)):
            raise ValueError("Head names must be unique within a task")
        return v


class FusionConfig(BaseModel):
    """Configuration for the fusion layer between shared encoder and task heads."""

    type: FusionType = Field(default=FusionType.ATTENTION, description="Fusion mechanism type")
    dropout: float = Field(default=0.1, ge=0.0, le=1.0, description="Dropout rate in fusion layer")
    use_residual: bool = Field(default=True, description="Use residual connection in fusion")
    num_attention_heads: int = Field(default=1, gt=0, description="Number of attention heads (for attention fusion)")
    gate_init_value: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Initial gate value for gating mechanism"
    )


class ModelConfig(BaseModel):
    """Configuration for the model architecture."""

    base_model: str = Field(default="distilbert-base-uncased", description="HuggingFace model name or path")
    hidden_size: int = Field(default=768, gt=0, description="Hidden size of the encoder (auto-detected if 0)")
    dropout: float = Field(default=0.1, ge=0.0, le=1.0, description="Global dropout rate")
    fusion: Optional[FusionConfig] = Field(default=None, description="Fusion layer configuration")
    freeze_encoder_layers: int = Field(
        default=0, ge=0, description="Number of encoder layers to freeze (0 = none)"
    )
    gradient_checkpointing: bool = Field(default=False, description="Enable gradient checkpointing to save memory")


class TokenizerConfig(BaseModel):
    """Configuration for the tokenizer."""

    max_length: int = Field(default=128, gt=0, le=8192, description="Maximum sequence length")
    padding: str = Field(default="max_length", description="Padding strategy")
    truncation: bool = Field(default=True, description="Whether to truncate sequences")


class LoggingConfig(BaseModel):
    """Configuration for experiment logging."""

    service: LoggingService = Field(default=LoggingService.TENSORBOARD, description="Logging backend")
    experiment_name: str = Field(default="jenga_experiment", description="Experiment name")
    tracking_uri: Optional[str] = Field(default=None, description="MLflow tracking URI")
    log_every_n_steps: int = Field(default=10, gt=0, description="Log metrics every N steps")


class CheckpointConfig(BaseModel):
    """Configuration for checkpoint saving."""

    save_every_n_epochs: int = Field(default=1, gt=0, description="Save checkpoint every N epochs")
    save_best: bool = Field(default=True, description="Save the best model based on eval metric")
    max_checkpoints: int = Field(default=3, gt=0, description="Maximum number of checkpoints to keep")


class PIIRedactionConfig(BaseModel):
    """Configuration for PII detection and redaction in data pipeline.

    Disabled by default — enable only when working with real data that may
    contain personally identifiable information. Skip for synthetic data.
    """
    enabled: bool = Field(default=False, description="Enable PII redaction (opt-in)")
    strategy: str = Field(default="mask", description="Redaction strategy: mask, hash, remove, flag")
    detect_types: Optional[list[str]] = Field(
        default=None,
        description="PII types to detect (None = all). Options: phone_ke, national_id, kra_pin, email, ip_address, mpesa_id, credit_card, url, dob, po_box"
    )
    hash_salt: str = Field(default="jenga-ai-pii", description="Salt for deterministic hashing")
    log_detections: bool = Field(default=True, description="Log detection stats (not values)")


class DataConfig(BaseModel):
    """Configuration for data splitting and processing."""

    test_size: float = Field(default=0.2, gt=0.0, lt=1.0, description="Fraction of data for testing")
    seed: int = Field(default=42, description="Random seed for reproducibility")
    num_workers: int = Field(default=0, ge=0, description="Number of data loading workers")
    pin_memory: bool = Field(default=True, description="Pin memory for faster GPU transfer")
    pii_redaction: PIIRedactionConfig = Field(default_factory=PIIRedactionConfig, description="PII redaction settings")


class TrainingConfig(BaseModel):
    """Configuration for the training process."""

    output_dir: str = Field(default="./results", description="Directory for saving outputs")
    learning_rate: float = Field(default=2e-5, gt=0.0, description="Learning rate")
    batch_size: int = Field(default=16, gt=0, description="Training batch size")
    eval_batch_size: Optional[int] = Field(default=None, gt=0, description="Eval batch size (defaults to batch_size)")
    num_epochs: int = Field(default=3, gt=0, description="Number of training epochs")
    weight_decay: float = Field(default=0.01, ge=0.0, description="Weight decay for optimizer")
    warmup_steps: int = Field(default=100, ge=0, description="Warmup steps for scheduler")
    max_grad_norm: float = Field(default=1.0, gt=0.0, description="Maximum gradient norm for clipping")
    gradient_accumulation_steps: int = Field(default=1, gt=0, description="Gradient accumulation steps")
    use_amp: bool = Field(default=False, description="Use automatic mixed precision")
    device: str = Field(default="auto", description="Device to use: 'auto', 'cuda', 'cpu', 'mps'")
    task_sampling: TaskSamplingStrategy = Field(
        default=TaskSamplingStrategy.ROUND_ROBIN, description="How to sample tasks during training"
    )
    temperature: float = Field(
        default=2.0, gt=0.0, description="Temperature for temperature-scaled sampling"
    )
    early_stopping_patience: Optional[int] = Field(
        default=None, gt=0, description="Epochs to wait before early stopping"
    )
    metric_for_best_model: str = Field(default="eval_loss", description="Metric to use for best model selection")
    greater_is_better: bool = Field(default=False, description="Whether higher metric values are better")
    logging: Optional[LoggingConfig] = Field(default=None, description="Logging configuration")
    checkpoint: Optional[CheckpointConfig] = Field(default=None, description="Checkpoint configuration")
    data: DataConfig = Field(default_factory=DataConfig, description="Data processing configuration")

    @model_validator(mode="after")
    def set_eval_batch_size(self) -> "TrainingConfig":
        if self.eval_batch_size is None:
            self.eval_batch_size = self.batch_size
        return self

    def resolve_device(self) -> str:
        """Resolve 'auto' device to the best available device."""
        if self.device != "auto":
            return self.device
        import torch

        if torch.cuda.is_available():
            return "cuda"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        return "cpu"


class ExperimentConfig(BaseModel):
    """Top-level configuration for an experiment."""

    project_name: str = Field(..., min_length=1, description="Name of the project/experiment")
    tasks: list[TaskConfig] = Field(..., min_length=1, description="List of tasks to train")
    model: ModelConfig = Field(default_factory=ModelConfig, description="Model configuration")
    tokenizer: TokenizerConfig = Field(default_factory=TokenizerConfig, description="Tokenizer configuration")
    training: TrainingConfig = Field(default_factory=TrainingConfig, description="Training configuration")

    @field_validator("tasks")
    @classmethod
    def validate_unique_task_names(cls, v: list[TaskConfig]) -> list[TaskConfig]:
        names = [t.name for t in v]
        if len(names) != len(set(names)):
            raise ValueError("Task names must be unique")
        return v

    def to_dict(self) -> dict[str, Any]:
        """Serialize config to a dictionary."""
        return self.model_dump(mode="python")

    def to_yaml(self, path: str | Path) -> None:
        """Save config to a YAML file."""
        data = self.model_dump(mode="python")
        # Convert enums to strings for YAML
        _convert_enums(data)
        with open(path, "w") as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
        logger.info(f"Config saved to {path}")

    @classmethod
    def from_yaml(cls, path: str | Path) -> "ExperimentConfig":
        """Load config from a YAML file."""
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls(**data)


def _convert_enums(d: dict[str, Any]) -> None:
    """Recursively convert enum values to strings in a dict."""
    for key, value in d.items():
        if isinstance(value, Enum):
            d[key] = value.value
        elif isinstance(value, dict):
            _convert_enums(value)
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    _convert_enums(item)
                elif isinstance(item, Enum):
                    d[key][i] = item.value


def load_config(path: str | Path) -> ExperimentConfig:
    """Load an experiment config from a YAML file."""
    return ExperimentConfig.from_yaml(path)

"""Regression task for Jenga-AI.

Supports continuous output
prediction with MSE or MAE loss.
"""

from __future__ import annotations

from typing import Any, Optional

import torch
import torch.nn as nn

from ..core.config import TaskConfig
from .base import BaseTask, TaskOutput


class RegressionTask(BaseTask):
    """Regression task for continuous value prediction.

    Predicts a continuous value for each input. Supports both
    MSE (mean squared error) and Huber loss.

    Args:
        config: Task configuration with head definitions.
        hidden_size: Hidden size from the shared encoder.
        loss_type: Type of loss function ('mse' or 'huber').
    """

    def __init__(
        self,
        config: TaskConfig,
        hidden_size: int,
        loss_type: str = "mse",
    ) -> None:
        super().__init__(config, hidden_size)
        self.loss_type = loss_type

        for head in config.heads:
            # Regression heads output a single value (num_labels=1 typically)
            self.heads[head.name] = nn.Sequential(
                nn.Dropout(head.dropout),
                nn.Linear(hidden_size, head.num_labels),
            )

    def get_forward_output(
        self,
        pooled_output: torch.Tensor,
        sequence_output: torch.Tensor,
        labels: Optional[torch.Tensor | dict[str, torch.Tensor]] = None,
        attention_mask: Optional[torch.Tensor] = None,
        **kwargs: Any,
    ) -> TaskOutput:
        total_loss = None
        all_logits: dict[str, torch.Tensor] = {}

        if self.loss_type == "huber":
            loss_fct = nn.SmoothL1Loss()
        else:
            loss_fct = nn.MSELoss()

        for head_config in self.config.heads:
            head_name = head_config.name
            logits = self.heads[head_name](pooled_output)
            all_logits[head_name] = logits

            if labels is not None:
                head_labels = labels[head_name] if isinstance(labels, dict) else labels
                loss = loss_fct(logits.squeeze(-1), head_labels.float())
                weighted_loss = loss * head_config.weight
                total_loss = weighted_loss if total_loss is None else total_loss + weighted_loss

        return TaskOutput(loss=total_loss, logits=all_logits)

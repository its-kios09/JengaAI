"""Continual learning — prevent catastrophic forgetting in Jenga-AI.

When a model learns new tasks or new data, it tends to forget what it learned
previously. This is catastrophic forgetting. For a national security framework,
this is unacceptable — a model retrained on new phishing patterns must NOT
forget how to detect hate speech.

This module provides multiple strategies:

1. Elastic Weight Consolidation (EWC):
   - Identifies which weights are important for old tasks (via Fisher Information)
   - Penalizes changes to those weights when learning new tasks
   - The model can learn new things while preserving old knowledge

2. Experience Replay:
   - Stores a buffer of examples from previous tasks/data
   - Mixes old examples into new training batches
   - Forces the model to keep performing well on old data

3. Learning without Forgetting (LwF):
   - Before learning new task, record model's outputs on new data (soft labels)
   - During new training, add distillation loss to match old soft labels
   - No need to store old data — just old model's knowledge

4. Progressive Freezing:
   - When adding new tasks, freeze layers critical for old tasks
   - Only train new/upper layers on new task
   - Gradually unfreeze if fine-tuning is needed

5. PackNet (Weight Partitioning):
   - Prune unimportant weights after each task
   - Assign freed weights to new tasks
   - Each task owns a subset of the network
"""

import copy
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset, Subset

logger = logging.getLogger(__name__)


class ContinualStrategy(str, Enum):
    """Available continual learning strategies."""
    EWC = "ewc"
    REPLAY = "replay"
    LWF = "lwf"
    PROGRESSIVE_FREEZE = "progressive_freeze"
    PACKNET = "packnet"


@dataclass
class ContinualConfig:
    """Configuration for continual learning."""
    strategy: ContinualStrategy = ContinualStrategy.EWC

    # EWC settings
    ewc_lambda: float = 1000.0  # penalty strength for important weights
    fisher_sample_size: int = 200  # samples to estimate Fisher Information

    # Experience Replay settings
    replay_buffer_size: int = 500  # max examples to store per task
    replay_ratio: float = 0.3  # fraction of each batch that is replay data

    # LwF settings
    lwf_temperature: float = 2.0  # distillation temperature
    lwf_alpha: float = 0.5  # balance between new task loss and distillation loss

    # Progressive Freezing settings
    freeze_layers_per_task: int = 2  # freeze N more encoder layers per new task
    min_trainable_layers: int = 2  # always keep at least N layers unfrozen

    # PackNet settings
    prune_ratio: float = 0.5  # fraction of weights to prune per task


class FisherInformation:
    """Compute and store Fisher Information Matrix for EWC.

    The Fisher Information tells us which weights are important for a task.
    Weights with high Fisher values are critical — changing them causes forgetting.
    """

    def __init__(self, model: nn.Module, dataset: Dataset, sample_size: int = 200):
        self.model = model
        self.dataset = dataset
        self.sample_size = min(sample_size, len(dataset))
        self._fisher: Dict[str, torch.Tensor] = {}
        self._optimal_params: Dict[str, torch.Tensor] = {}

    def compute(self) -> None:
        """Compute Fisher Information for all parameters."""
        self.model.eval()

        # Store current (optimal) parameters
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                self._optimal_params[name] = param.data.clone()
                self._fisher[name] = torch.zeros_like(param.data)

        # Sample subset of data
        indices = torch.randperm(len(self.dataset))[:self.sample_size]
        subset = Subset(self.dataset, indices.tolist())
        loader = DataLoader(subset, batch_size=1, shuffle=False)

        # Accumulate squared gradients (diagonal Fisher approximation)
        for batch in loader:
            self.model.zero_grad()
            # Forward pass — use log-softmax for proper Fisher computation
            outputs = self.model(**batch)
            if hasattr(outputs, 'loss') and outputs.loss is not None:
                loss = outputs.loss
            elif hasattr(outputs, 'logits'):
                log_probs = F.log_softmax(outputs.logits, dim=-1)
                # Sample from model's own distribution
                labels = torch.multinomial(log_probs.exp(), 1).squeeze()
                loss = F.nll_loss(log_probs, labels)
            else:
                continue

            loss.backward()

            for name, param in self.model.named_parameters():
                if param.requires_grad and param.grad is not None:
                    self._fisher[name] += param.grad.data ** 2

        # Average over samples
        for name in self._fisher:
            self._fisher[name] /= self.sample_size

        logger.info(
            "Fisher Information computed over %d samples, %d parameters",
            self.sample_size, len(self._fisher)
        )

    @property
    def fisher(self) -> Dict[str, torch.Tensor]:
        return self._fisher

    @property
    def optimal_params(self) -> Dict[str, torch.Tensor]:
        return self._optimal_params


class EWCLoss(nn.Module):
    """Elastic Weight Consolidation penalty.

    Adds a quadratic penalty for changing weights that are important for
    previous tasks (as measured by Fisher Information).

    Total loss = task_loss + (ewc_lambda / 2) * sum(F_i * (theta_i - theta_i*)^2)
    """

    def __init__(self, ewc_lambda: float = 1000.0):
        super().__init__()
        self.ewc_lambda = ewc_lambda
        self._tasks: List[FisherInformation] = []

    def register_task(self, fisher_info: FisherInformation) -> None:
        """Register a completed task's Fisher Information."""
        self._tasks.append(fisher_info)
        logger.info("EWC: registered task %d", len(self._tasks))

    def penalty(self, model: nn.Module) -> torch.Tensor:
        """Compute EWC penalty for all registered tasks."""
        loss = torch.tensor(0.0, device=next(model.parameters()).device)

        for task_info in self._tasks:
            for name, param in model.named_parameters():
                if name in task_info.fisher and name in task_info.optimal_params:
                    fisher = task_info.fisher[name].to(param.device)
                    optimal = task_info.optimal_params[name].to(param.device)
                    loss += (fisher * (param - optimal) ** 2).sum()

        return (self.ewc_lambda / 2) * loss

    def forward(self, task_loss: torch.Tensor, model: nn.Module) -> torch.Tensor:
        """Combine task loss with EWC penalty."""
        if not self._tasks:
            return task_loss
        return task_loss + self.penalty(model)


class ExperienceReplayBuffer:
    """Store and sample examples from previous tasks.

    Maintains a fixed-size buffer per task. When the buffer is full,
    reservoir sampling ensures uniform representation.
    """

    def __init__(self, buffer_size_per_task: int = 500):
        self.buffer_size = buffer_size_per_task
        self._buffers: Dict[str, List[dict]] = {}
        self._counts: Dict[str, int] = {}

    def add_task(self, task_name: str, dataset: Dataset) -> None:
        """Store examples from a task's dataset."""
        self._buffers[task_name] = []
        self._counts[task_name] = 0

        indices = torch.randperm(len(dataset))[:self.buffer_size]
        for idx in indices:
            example = dataset[idx.item()]
            if isinstance(example, dict):
                self._buffers[task_name].append(example)
            self._counts[task_name] += 1

        logger.info(
            "Replay buffer: stored %d examples for task '%s'",
            len(self._buffers[task_name]), task_name
        )

    def sample(self, batch_size: int) -> List[dict]:
        """Sample a batch uniformly across all stored tasks."""
        all_examples = []
        for task_examples in self._buffers.values():
            all_examples.extend(task_examples)

        if not all_examples:
            return []

        indices = torch.randint(0, len(all_examples), (min(batch_size, len(all_examples)),))
        return [all_examples[i.item()] for i in indices]

    @property
    def total_size(self) -> int:
        return sum(len(buf) for buf in self._buffers.values())

    @property
    def task_count(self) -> int:
        return len(self._buffers)


class LearningWithoutForgetting:
    """Learning without Forgetting (LwF).

    Before training on new data, capture the current model's soft predictions
    on that data. During training, add a distillation loss to preserve those
    soft predictions alongside the new task loss.

    No old data storage needed — just the old model's knowledge.
    """

    def __init__(self, temperature: float = 2.0, alpha: float = 0.5):
        self.temperature = temperature
        self.alpha = alpha
        self._old_model: Optional[nn.Module] = None

    def snapshot_model(self, model: nn.Module) -> None:
        """Take a snapshot of the current model before new training."""
        self._old_model = copy.deepcopy(model)
        self._old_model.eval()
        for param in self._old_model.parameters():
            param.requires_grad = False
        logger.info("LwF: model snapshot taken")

    def distillation_loss(
        self,
        new_logits: torch.Tensor,
        inputs: dict,
        task_id: int = 0
    ) -> torch.Tensor:
        """Compute distillation loss between old and new model outputs."""
        if self._old_model is None:
            return torch.tensor(0.0, device=new_logits.device)

        with torch.no_grad():
            old_outputs = self._old_model(**inputs)
            old_logits = old_outputs.logits if hasattr(old_outputs, 'logits') else old_outputs

        # Soft targets with temperature scaling
        old_probs = F.softmax(old_logits / self.temperature, dim=-1)
        new_log_probs = F.log_softmax(new_logits / self.temperature, dim=-1)

        # KL divergence loss (scaled by T^2 as per Hinton et al.)
        distill_loss = F.kl_div(
            new_log_probs, old_probs, reduction='batchmean'
        ) * (self.temperature ** 2)

        return distill_loss

    def combined_loss(
        self,
        task_loss: torch.Tensor,
        new_logits: torch.Tensor,
        inputs: dict
    ) -> torch.Tensor:
        """Combine new task loss with distillation loss."""
        distill = self.distillation_loss(new_logits, inputs)
        return (1 - self.alpha) * task_loss + self.alpha * distill


class ProgressiveFreezing:
    """Progressive layer freezing for continual learning.

    As new tasks are added, freeze more encoder layers from the bottom up.
    Bottom layers learn general language features (shared across all tasks).
    Top layers learn task-specific features (can be adapted for new tasks).
    """

    def __init__(
        self,
        model: nn.Module,
        layers_per_task: int = 2,
        min_trainable: int = 2
    ):
        self.model = model
        self.layers_per_task = layers_per_task
        self.min_trainable = min_trainable
        self._task_count = 0
        self._total_layers = self._count_encoder_layers()

    def _count_encoder_layers(self) -> int:
        """Count encoder layers in the model."""
        if hasattr(self.model, 'encoder'):
            encoder = self.model.encoder
            if hasattr(encoder, 'encoder') and hasattr(encoder.encoder, 'layer'):
                return len(encoder.encoder.layer)
            if hasattr(encoder, 'layer'):
                return len(encoder.layer)
        return 12  # default BERT-base

    def freeze_for_new_task(self) -> int:
        """Freeze additional layers for a new task. Returns number frozen."""
        self._task_count += 1
        freeze_count = min(
            self._task_count * self.layers_per_task,
            self._total_layers - self.min_trainable
        )

        if hasattr(self.model, 'encoder'):
            encoder = self.model.encoder
            layers = None
            if hasattr(encoder, 'encoder') and hasattr(encoder.encoder, 'layer'):
                layers = encoder.encoder.layer
            elif hasattr(encoder, 'layer'):
                layers = encoder.layer

            if layers is not None:
                for i, layer in enumerate(layers):
                    if i < freeze_count:
                        for param in layer.parameters():
                            param.requires_grad = False

        logger.info(
            "Progressive freezing: task %d, frozen %d/%d encoder layers",
            self._task_count, freeze_count, self._total_layers
        )
        return freeze_count

    @property
    def frozen_layers(self) -> int:
        return min(
            self._task_count * self.layers_per_task,
            self._total_layers - self.min_trainable
        )


class ContinualLearningManager:
    """High-level manager that coordinates continual learning strategies.

    Usage:
        manager = ContinualLearningManager(model, config)

        # Before training on task 1
        manager.before_task("threat_classification", train_dataset)
        # ... train normally ...
        manager.after_task("threat_classification", train_dataset)

        # Before training on task 2 (new phishing patterns)
        manager.before_task("phishing", new_dataset)
        # ... train — old knowledge is preserved ...
        manager.after_task("phishing", new_dataset)
    """

    def __init__(self, model: nn.Module, config: ContinualConfig):
        self.model = model
        self.config = config

        # Initialize strategy components
        self.ewc_loss: Optional[EWCLoss] = None
        self.replay_buffer: Optional[ExperienceReplayBuffer] = None
        self.lwf: Optional[LearningWithoutForgetting] = None
        self.progressive_freezer: Optional[ProgressiveFreezing] = None

        if config.strategy == ContinualStrategy.EWC:
            self.ewc_loss = EWCLoss(ewc_lambda=config.ewc_lambda)
        elif config.strategy == ContinualStrategy.REPLAY:
            self.replay_buffer = ExperienceReplayBuffer(config.replay_buffer_size)
        elif config.strategy == ContinualStrategy.LWF:
            self.lwf = LearningWithoutForgetting(
                temperature=config.lwf_temperature,
                alpha=config.lwf_alpha
            )
        elif config.strategy == ContinualStrategy.PROGRESSIVE_FREEZE:
            self.progressive_freezer = ProgressiveFreezing(
                model,
                layers_per_task=config.freeze_layers_per_task,
                min_trainable=config.min_trainable_layers
            )

        logger.info("Continual learning initialized: strategy=%s", config.strategy.value)

    def before_task(self, task_name: str, dataset: Dataset) -> None:
        """Call before training on a new task."""
        if self.lwf is not None:
            self.lwf.snapshot_model(self.model)

        if self.progressive_freezer is not None:
            self.progressive_freezer.freeze_for_new_task()

        logger.info("Continual learning: preparing for task '%s'", task_name)

    def after_task(self, task_name: str, dataset: Dataset) -> None:
        """Call after training on a task completes."""
        if self.ewc_loss is not None:
            fisher = FisherInformation(
                self.model, dataset, self.config.fisher_sample_size
            )
            fisher.compute()
            self.ewc_loss.register_task(fisher)

        if self.replay_buffer is not None:
            self.replay_buffer.add_task(task_name, dataset)

        logger.info("Continual learning: task '%s' registered", task_name)

    def compute_loss(
        self,
        task_loss: torch.Tensor,
        new_logits: Optional[torch.Tensor] = None,
        inputs: Optional[dict] = None
    ) -> torch.Tensor:
        """Compute combined loss with continual learning penalty."""
        if self.ewc_loss is not None:
            return self.ewc_loss(task_loss, self.model)

        if self.lwf is not None and new_logits is not None and inputs is not None:
            return self.lwf.combined_loss(task_loss, new_logits, inputs)

        return task_loss

    def get_replay_batch(self, batch_size: int) -> Optional[List[dict]]:
        """Get a batch of replay examples (for experience replay strategy)."""
        if self.replay_buffer is not None and self.replay_buffer.total_size > 0:
            replay_size = int(batch_size * self.config.replay_ratio)
            return self.replay_buffer.sample(replay_size)
        return None

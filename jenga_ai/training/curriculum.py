"""Curriculum and nested learning for Jenga-AI.

Models learn better when examples are presented in a meaningful order —
easy to hard, general to specific, simple to complex. This is curriculum
learning, and it is especially important for security models where:

1. NESTED/HIERARCHICAL LEARNING:
   - Learn "is this text threatening?" before learning "what type of threat?"
   - Learn basic NER (person, location) before fine-grained NER (suspect, victim)
   - Learn general sentiment before domain-specific sentiment (security context)
   - Tasks form a hierarchy: parent tasks scaffold child tasks

2. DIFFICULTY-BASED CURRICULUM:
   - Start with clear-cut examples (obvious hate speech, obvious normal text)
   - Gradually introduce ambiguous/borderline examples
   - Models build confidence on easy cases before tackling hard ones

3. COMPETENCE-BASED PROGRESSION:
   - Only advance to harder examples when model demonstrates competence
   - Measured by loss, accuracy, or confidence on current difficulty level
   - Prevents training collapse from too-hard examples early on

4. ANTI-CURRICULUM (HARD EXAMPLE MINING):
   - After initial training, focus on examples the model gets wrong
   - Especially important for adversarial robustness
   - Hard examples often represent edge cases critical for security

5. TASK-LEVEL CURRICULUM:
   - In multi-task learning, don't train all tasks equally from the start
   - Start with the "foundation" task, then layer on additional tasks
   - Example: classification first (easy) → NER (harder) → fusion benefits
"""

import logging
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Dict, List, Optional, Tuple

import torch
from torch.utils.data import Dataset, Sampler

logger = logging.getLogger(__name__)


class CurriculumStrategy(str, Enum):
    """Curriculum learning strategies."""
    DIFFICULTY = "difficulty"        # easy → hard based on loss
    COMPETENCE = "competence"        # advance when model is ready
    ANTI_CURRICULUM = "anti"         # focus on hard examples
    NESTED = "nested"                # hierarchical task dependencies
    TASK_PHASED = "task_phased"      # introduce tasks progressively


@dataclass
class CurriculumConfig:
    """Configuration for curriculum learning."""
    strategy: CurriculumStrategy = CurriculumStrategy.DIFFICULTY

    # Difficulty-based settings
    initial_difficulty: float = 0.3     # start with easiest 30% of data
    difficulty_step: float = 0.1        # increase by 10% each epoch
    difficulty_metric: str = "loss"     # "loss" or "confidence" or "length"

    # Competence-based settings
    competence_threshold: float = 0.8   # advance when accuracy > 80%
    min_epochs_per_level: int = 2       # train at least 2 epochs per level

    # Anti-curriculum settings
    hard_example_ratio: float = 0.5     # 50% of batch is hard examples
    hard_example_update_freq: int = 5   # re-score difficulty every 5 epochs

    # Nested learning settings
    task_hierarchy: Dict[str, List[str]] = field(default_factory=dict)
    # e.g., {"threat_detection": ["threat_type", "severity_score"]}
    # means threat_detection must be learned before threat_type and severity_score

    # Task-phased settings
    task_introduction_schedule: Dict[str, int] = field(default_factory=dict)
    # e.g., {"classification": 0, "ner": 3, "sentiment": 5}
    # means classification starts epoch 0, NER epoch 3, sentiment epoch 5


class DifficultyScorer:
    """Score example difficulty for curriculum ordering.

    Difficulty can be measured by:
    - Loss: higher loss = harder example
    - Confidence: lower confidence = harder example
    - Length: longer text = harder (for simple heuristic)
    - Model uncertainty: entropy of predictions
    """

    def __init__(self, model: torch.nn.Module, metric: str = "loss"):
        self.model = model
        self.metric = metric
        self._scores: Dict[int, float] = {}

    @torch.no_grad()
    def score_dataset(self, dataset: Dataset) -> Dict[int, float]:
        """Score all examples in a dataset by difficulty."""
        self.model.eval()
        scores = {}

        for idx in range(len(dataset)):
            example = dataset[idx]

            if self.metric == "length":
                # Simple heuristic: longer text = harder
                if isinstance(example, dict) and "input_ids" in example:
                    scores[idx] = float(len(example["input_ids"]))
                else:
                    scores[idx] = 0.0
                continue

            if self.metric in ("loss", "confidence"):
                try:
                    # Batch of 1
                    batch = {k: v.unsqueeze(0) if isinstance(v, torch.Tensor) else v
                             for k, v in example.items()}
                    outputs = self.model(**batch)

                    if self.metric == "loss" and hasattr(outputs, 'loss') and outputs.loss is not None:
                        scores[idx] = outputs.loss.item()
                    elif self.metric == "confidence" and hasattr(outputs, 'logits'):
                        probs = torch.softmax(outputs.logits, dim=-1)
                        scores[idx] = 1.0 - probs.max().item()  # lower confidence = harder
                    else:
                        scores[idx] = 0.0
                except Exception:
                    scores[idx] = 0.0

        self._scores = scores
        logger.info("Scored %d examples by %s", len(scores), self.metric)
        return scores

    def get_curriculum_indices(
        self, difficulty_fraction: float, reverse: bool = False
    ) -> List[int]:
        """Get indices sorted by difficulty, up to the given fraction.

        Args:
            difficulty_fraction: fraction of data to include (0.0-1.0)
            reverse: if True, return hardest examples first (anti-curriculum)
        """
        sorted_indices = sorted(self._scores.keys(), key=lambda i: self._scores[i],
                                reverse=reverse)
        cutoff = int(len(sorted_indices) * min(difficulty_fraction, 1.0))
        return sorted_indices[:max(cutoff, 1)]


class CurriculumSampler(Sampler):
    """Custom sampler that implements curriculum learning.

    Controls which examples are available at each epoch based on
    the curriculum strategy.
    """

    def __init__(
        self,
        dataset_size: int,
        initial_fraction: float = 0.3,
        step: float = 0.1,
        indices_fn: Optional[Callable[[float], List[int]]] = None
    ):
        self.dataset_size = dataset_size
        self.current_fraction = initial_fraction
        self.step = step
        self.indices_fn = indices_fn
        self._epoch = 0

    def advance_epoch(self) -> float:
        """Advance to next epoch, expanding available data."""
        self._epoch += 1
        self.current_fraction = min(1.0, self.current_fraction + self.step)
        logger.info(
            "Curriculum: epoch %d, data fraction %.1f%%",
            self._epoch, self.current_fraction * 100
        )
        return self.current_fraction

    def __iter__(self):
        if self.indices_fn is not None:
            indices = self.indices_fn(self.current_fraction)
        else:
            # Default: random subset of current fraction
            n = max(1, int(self.dataset_size * self.current_fraction))
            indices = torch.randperm(self.dataset_size)[:n].tolist()

        # Shuffle within the selected indices
        perm = torch.randperm(len(indices))
        return iter([indices[i] for i in perm])

    def __len__(self):
        if self.indices_fn is not None:
            return len(self.indices_fn(self.current_fraction))
        return max(1, int(self.dataset_size * self.current_fraction))


class NestedTaskScheduler:
    """Manage hierarchical/nested task learning.

    Tasks form a dependency tree:
        threat_detection (parent)
        ├── threat_type_classification (child — needs parent first)
        ├── severity_scoring (child)
        └── entity_extraction (child)
            └── entity_relation (grandchild — needs entity_extraction first)

    The scheduler ensures:
    1. Parent tasks train first
    2. Child tasks only start after parent reaches competence threshold
    3. Multi-task fusion activates only when all participating tasks are ready
    """

    def __init__(self, config: CurriculumConfig):
        self.hierarchy = config.task_hierarchy
        self.competence_threshold = config.competence_threshold
        self._task_scores: Dict[str, float] = {}
        self._active_tasks: List[str] = []
        self._completed_tasks: List[str] = []

    def initialize(self, all_tasks: List[str]) -> List[str]:
        """Determine which tasks to start with (root tasks)."""
        # Find root tasks (not a child of any other task)
        all_children = set()
        for children in self.hierarchy.values():
            all_children.update(children)

        root_tasks = [t for t in all_tasks if t not in all_children]
        if not root_tasks:
            root_tasks = all_tasks[:1]  # fallback: start with first task

        self._active_tasks = root_tasks
        logger.info("Nested learning: starting with root tasks %s", root_tasks)
        return root_tasks

    def update_scores(self, task_scores: Dict[str, float]) -> None:
        """Update task competence scores (e.g., accuracy)."""
        self._task_scores.update(task_scores)

    def get_active_tasks(self) -> List[str]:
        """Get currently active tasks based on hierarchy and competence."""
        newly_activated = []

        for parent, children in self.hierarchy.items():
            parent_score = self._task_scores.get(parent, 0.0)
            if parent_score >= self.competence_threshold:
                if parent not in self._completed_tasks:
                    self._completed_tasks.append(parent)
                for child in children:
                    if child not in self._active_tasks:
                        self._active_tasks.append(child)
                        newly_activated.append(child)

        if newly_activated:
            logger.info("Nested learning: activated tasks %s", newly_activated)

        return self._active_tasks

    @property
    def all_tasks_complete(self) -> bool:
        """Check if all tasks have reached competence."""
        return all(
            self._task_scores.get(t, 0.0) >= self.competence_threshold
            for t in self._active_tasks
        )


class TaskPhasedScheduler:
    """Introduce tasks progressively during training.

    Instead of training all tasks from epoch 0, introduce them one by one:
    - Epoch 0-2: only classification (foundation)
    - Epoch 3-4: classification + NER (build on foundation)
    - Epoch 5+: classification + NER + sentiment (full multi-task)

    This gives the shared encoder time to learn general features before
    being pulled in multiple task-specific directions.
    """

    def __init__(self, schedule: Dict[str, int]):
        """
        Args:
            schedule: mapping of task_name → epoch to introduce
                      e.g., {"classification": 0, "ner": 3, "sentiment": 5}
        """
        self.schedule = schedule

    def get_active_tasks(self, epoch: int) -> List[str]:
        """Get tasks that should be active at the given epoch."""
        active = [
            task for task, start_epoch in self.schedule.items()
            if epoch >= start_epoch
        ]
        return active

    def get_task_weight(self, task_name: str, epoch: int) -> float:
        """Get task weight based on how long it's been active.

        Recently introduced tasks get lower weight to avoid disrupting
        already-learned tasks. Weight ramps up over 3 epochs.
        """
        start_epoch = self.schedule.get(task_name, 0)
        epochs_active = epoch - start_epoch
        if epochs_active < 0:
            return 0.0
        # Linear warmup over 3 epochs
        return min(1.0, (epochs_active + 1) / 3.0)


class CurriculumManager:
    """High-level manager for curriculum and nested learning.

    Usage:
        manager = CurriculumManager(model, config)

        for epoch in range(num_epochs):
            # Get which tasks and data to train on this epoch
            active_tasks = manager.get_active_tasks(epoch)
            sampler = manager.get_sampler(task_name)

            # ... train ...

            # Update with results
            manager.end_epoch(epoch, task_metrics)
    """

    def __init__(self, model: torch.nn.Module, config: CurriculumConfig):
        self.model = model
        self.config = config

        self._difficulty_scorer: Optional[DifficultyScorer] = None
        self._samplers: Dict[str, CurriculumSampler] = {}
        self._nested_scheduler: Optional[NestedTaskScheduler] = None
        self._phased_scheduler: Optional[TaskPhasedScheduler] = None

        if config.strategy == CurriculumStrategy.NESTED:
            self._nested_scheduler = NestedTaskScheduler(config)
        elif config.strategy == CurriculumStrategy.TASK_PHASED:
            self._phased_scheduler = TaskPhasedScheduler(config.task_introduction_schedule)
        elif config.strategy in (CurriculumStrategy.DIFFICULTY, CurriculumStrategy.ANTI_CURRICULUM):
            self._difficulty_scorer = DifficultyScorer(model, config.difficulty_metric)

        logger.info("Curriculum learning initialized: strategy=%s", config.strategy.value)

    def setup_task(self, task_name: str, dataset: Dataset) -> None:
        """Initialize curriculum for a task's dataset."""
        if self._difficulty_scorer is not None:
            scores = self._difficulty_scorer.score_dataset(dataset)
            reverse = self.config.strategy == CurriculumStrategy.ANTI_CURRICULUM

            self._samplers[task_name] = CurriculumSampler(
                dataset_size=len(dataset),
                initial_fraction=self.config.initial_difficulty,
                step=self.config.difficulty_step,
                indices_fn=lambda frac, s=self._difficulty_scorer, r=reverse:
                    s.get_curriculum_indices(frac, reverse=r)
            )
        else:
            self._samplers[task_name] = CurriculumSampler(
                dataset_size=len(dataset),
                initial_fraction=1.0,  # use all data
                step=0.0
            )

    def get_active_tasks(self, epoch: int) -> List[str]:
        """Get tasks active at this epoch."""
        if self._nested_scheduler is not None:
            return self._nested_scheduler.get_active_tasks()
        if self._phased_scheduler is not None:
            return self._phased_scheduler.get_active_tasks(epoch)
        return list(self._samplers.keys())

    def get_sampler(self, task_name: str) -> Optional[CurriculumSampler]:
        """Get the curriculum sampler for a task."""
        return self._samplers.get(task_name)

    def get_task_weight(self, task_name: str, epoch: int) -> float:
        """Get the loss weight for a task at this epoch."""
        if self._phased_scheduler is not None:
            return self._phased_scheduler.get_task_weight(task_name, epoch)
        return 1.0

    def end_epoch(self, epoch: int, task_metrics: Dict[str, float]) -> None:
        """Update curriculum state after an epoch."""
        # Advance difficulty samplers
        for sampler in self._samplers.values():
            sampler.advance_epoch()

        # Update nested scheduler
        if self._nested_scheduler is not None:
            self._nested_scheduler.update_scores(task_metrics)

        logger.info("Curriculum: epoch %d complete, metrics=%s", epoch, task_metrics)

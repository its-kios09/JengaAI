"""Advanced regularization and training techniques for Jenga-AI.

Techniques that make models generalize better, train more stably,
and perform more reliably on unseen security threats.

1. LABEL SMOOTHING:
   - Instead of hard labels [0, 0, 1, 0], use soft labels [0.025, 0.025, 0.925, 0.025]
   - Prevents overconfident predictions (critical for security — overconfidence = missed threats)
   - Works with any classification task

2. R-DROP (Regularized Dropout):
   - Run each input through the model TWICE with different dropout masks
   - Minimize KL divergence between the two outputs
   - Forces model to be consistent regardless of dropout noise
   - Dramatically improves robustness

3. MIXUP:
   - Create virtual training examples by interpolating between real examples
   - Smooths decision boundaries
   - Reduces sensitivity to adversarial perturbations

4. STOCHASTIC WEIGHT AVERAGING (SWA):
   - Average model weights over multiple training checkpoints
   - Produces a model that sits in a wider, flatter loss minimum
   - Better generalization, especially on out-of-distribution data

5. FOCAL LOSS:
   - Down-weights easy examples, focuses learning on hard ones
   - Critical for imbalanced security datasets (rare threats matter most)

6. KNOWLEDGE DISTILLATION:
   - Train a small (fast) model to mimic a large (accurate) model
   - SwahiliBERT → SwahiliDistilBERT via distillation
   - Deploy the small model with near-large-model accuracy
"""

import copy
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger(__name__)


class RegularizationTechnique(str, Enum):
    """Available regularization techniques."""
    LABEL_SMOOTHING = "label_smoothing"
    R_DROP = "r_drop"
    MIXUP = "mixup"
    SWA = "swa"
    FOCAL_LOSS = "focal_loss"
    DISTILLATION = "distillation"


@dataclass
class RegularizationConfig:
    """Configuration for regularization techniques.

    Multiple techniques can be combined:
        config = RegularizationConfig(
            techniques=["label_smoothing", "r_drop", "focal_loss"],
            label_smoothing_epsilon=0.1,
            r_drop_alpha=5.0,
            focal_gamma=2.0
        )
    """
    techniques: List[str] = None  # list of RegularizationTechnique values

    # Label smoothing
    label_smoothing_epsilon: float = 0.1

    # R-Drop
    r_drop_alpha: float = 5.0  # KL divergence weight

    # Mixup
    mixup_alpha: float = 0.2  # Beta distribution parameter

    # SWA
    swa_start_epoch: int = 5   # start averaging after this epoch
    swa_lr: float = 1e-5       # SWA learning rate

    # Focal loss
    focal_gamma: float = 2.0   # focusing parameter (higher = more focus on hard examples)
    focal_alpha: Optional[List[float]] = None  # per-class weights

    # Knowledge distillation
    distill_temperature: float = 3.0
    distill_alpha: float = 0.7  # balance: 0=only student loss, 1=only distillation

    def __post_init__(self):
        if self.techniques is None:
            self.techniques = []


class LabelSmoothingLoss(nn.Module):
    """Cross-entropy loss with label smoothing.

    Instead of [0, 0, 1, 0], targets become [eps/K, eps/K, 1-eps+eps/K, eps/K]
    where K is the number of classes and eps is the smoothing factor.

    Prevents the model from being overconfident, which is critical for
    security applications where false confidence means missed threats.
    """

    def __init__(self, num_classes: int, epsilon: float = 0.1):
        super().__init__()
        self.num_classes = num_classes
        self.epsilon = epsilon

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        log_probs = F.log_softmax(logits, dim=-1)

        # Create smoothed target distribution
        with torch.no_grad():
            smooth_targets = torch.full_like(log_probs, self.epsilon / self.num_classes)
            smooth_targets.scatter_(1, targets.unsqueeze(1), 1.0 - self.epsilon + self.epsilon / self.num_classes)

        loss = -(smooth_targets * log_probs).sum(dim=-1).mean()
        return loss


class FocalLoss(nn.Module):
    """Focal Loss for handling class imbalance.

    FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)

    When gamma > 0, easy examples (high p_t) are down-weighted.
    This forces the model to focus on hard, misclassified examples.

    Critical for security datasets where threats are rare:
    - 95% normal traffic, 3% suspicious, 2% malicious
    - Standard cross-entropy would mostly learn "predict normal"
    - Focal loss forces learning on the rare but critical classes
    """

    def __init__(self, gamma: float = 2.0, alpha: Optional[torch.Tensor] = None):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = F.cross_entropy(logits, targets, reduction='none')
        pt = torch.exp(-ce_loss)  # probability of correct class

        focal_weight = (1 - pt) ** self.gamma

        if self.alpha is not None:
            alpha_t = self.alpha.to(logits.device)[targets]
            focal_weight = alpha_t * focal_weight

        loss = (focal_weight * ce_loss).mean()
        return loss


class RDropLoss(nn.Module):
    """R-Drop: Regularized Dropout for robust training.

    Each input is passed through the model TWICE with different dropout masks.
    A KL divergence loss is added to force the two outputs to agree.

    This makes the model robust to stochastic variations and significantly
    improves generalization. Particularly effective for:
    - Small datasets (common in specialized security domains)
    - High-variance predictions (ambiguous text)
    """

    def __init__(self, alpha: float = 5.0):
        super().__init__()
        self.alpha = alpha

    def compute_kl_loss(
        self, logits_1: torch.Tensor, logits_2: torch.Tensor
    ) -> torch.Tensor:
        """Symmetric KL divergence between two sets of logits."""
        p = F.log_softmax(logits_1, dim=-1)
        q = F.log_softmax(logits_2, dim=-1)
        p_probs = F.softmax(logits_1, dim=-1)
        q_probs = F.softmax(logits_2, dim=-1)

        kl_pq = F.kl_div(p, q_probs, reduction='batchmean')
        kl_qp = F.kl_div(q, p_probs, reduction='batchmean')

        return (kl_pq + kl_qp) / 2

    def forward(
        self,
        logits_1: torch.Tensor,
        logits_2: torch.Tensor,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """Combined R-Drop loss.

        Returns: ce_loss + alpha * kl_loss
        """
        ce_loss_1 = F.cross_entropy(logits_1, targets)
        ce_loss_2 = F.cross_entropy(logits_2, targets)
        ce_loss = (ce_loss_1 + ce_loss_2) / 2

        kl_loss = self.compute_kl_loss(logits_1, logits_2)

        return ce_loss + self.alpha * kl_loss


class Mixup:
    """Mixup data augmentation.

    Creates virtual training examples by interpolating between pairs:
        x_mixed = lambda * x_i + (1 - lambda) * x_j
        y_mixed = lambda * y_i + (1 - lambda) * y_j

    where lambda ~ Beta(alpha, alpha)

    Smooths decision boundaries and reduces overfitting.
    Also provides some adversarial robustness for free.
    """

    def __init__(self, alpha: float = 0.2):
        self.alpha = alpha

    def mix_batch(
        self,
        embeddings: torch.Tensor,
        targets: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, float]:
        """Mix a batch of embeddings and targets.

        Returns:
            mixed_embeddings, targets_a, targets_b, lambda_value
        """
        batch_size = embeddings.size(0)
        lam = torch.distributions.Beta(self.alpha, self.alpha).sample().item()

        # Random permutation for pairing
        index = torch.randperm(batch_size, device=embeddings.device)

        mixed = lam * embeddings + (1 - lam) * embeddings[index]
        return mixed, targets, targets[index], lam

    @staticmethod
    def mixup_criterion(
        loss_fn: nn.Module,
        logits: torch.Tensor,
        targets_a: torch.Tensor,
        targets_b: torch.Tensor,
        lam: float
    ) -> torch.Tensor:
        """Compute mixup loss."""
        return lam * loss_fn(logits, targets_a) + (1 - lam) * loss_fn(logits, targets_b)


class StochasticWeightAveraging:
    """Stochastic Weight Averaging (SWA).

    Averages model weights over the last few epochs of training.
    The averaged model sits in a wider minimum → better generalization.

    Usage:
        swa = StochasticWeightAveraging(model, start_epoch=5)

        for epoch in range(num_epochs):
            train(model)
            if swa.should_update(epoch):
                swa.update()

        # After training, load the averaged weights
        swa.apply_average()
    """

    def __init__(self, model: nn.Module, start_epoch: int = 5, swa_lr: float = 1e-5):
        self.model = model
        self.start_epoch = start_epoch
        self.swa_lr = swa_lr
        self._avg_state: Optional[Dict[str, torch.Tensor]] = None
        self._num_averaged = 0

    def should_update(self, epoch: int) -> bool:
        return epoch >= self.start_epoch

    def update(self) -> None:
        """Add current model weights to running average."""
        if self._avg_state is None:
            self._avg_state = {
                name: param.data.clone()
                for name, param in self.model.named_parameters()
            }
            self._num_averaged = 1
        else:
            self._num_averaged += 1
            for name, param in self.model.named_parameters():
                if name in self._avg_state:
                    self._avg_state[name] += (
                        param.data - self._avg_state[name]
                    ) / self._num_averaged

        logger.info("SWA: averaged %d checkpoints", self._num_averaged)

    def apply_average(self) -> None:
        """Replace model weights with averaged weights."""
        if self._avg_state is None:
            logger.warning("SWA: no weights to average")
            return

        for name, param in self.model.named_parameters():
            if name in self._avg_state:
                param.data.copy_(self._avg_state[name])

        logger.info("SWA: applied averaged weights (%d checkpoints)", self._num_averaged)


class KnowledgeDistiller:
    """Knowledge distillation: transfer knowledge from large model to small model.

    Train SwahiliDistilBERT to mimic SwahiliBERT's predictions.
    The small model learns the large model's "dark knowledge" — the
    probability distribution over all classes, not just the top prediction.

    Usage:
        distiller = KnowledgeDistiller(teacher_model, temperature=3.0, alpha=0.7)

        for batch in dataloader:
            student_logits = student_model(batch)
            loss = distiller.distillation_loss(student_logits, batch, hard_targets)
            loss.backward()
    """

    def __init__(
        self,
        teacher_model: nn.Module,
        temperature: float = 3.0,
        alpha: float = 0.7
    ):
        self.teacher = teacher_model
        self.teacher.eval()
        for param in self.teacher.parameters():
            param.requires_grad = False

        self.temperature = temperature
        self.alpha = alpha

    @torch.no_grad()
    def get_teacher_logits(self, inputs: dict) -> torch.Tensor:
        """Get soft predictions from teacher model."""
        outputs = self.teacher(**inputs)
        if hasattr(outputs, 'logits'):
            return outputs.logits
        return outputs

    def distillation_loss(
        self,
        student_logits: torch.Tensor,
        inputs: dict,
        hard_targets: torch.Tensor
    ) -> torch.Tensor:
        """Combined distillation + hard target loss.

        Total = alpha * distill_loss + (1 - alpha) * hard_loss
        """
        teacher_logits = self.get_teacher_logits(inputs)

        # Soft target loss (KL divergence with temperature)
        soft_teacher = F.softmax(teacher_logits / self.temperature, dim=-1)
        soft_student = F.log_softmax(student_logits / self.temperature, dim=-1)
        distill_loss = F.kl_div(
            soft_student, soft_teacher, reduction='batchmean'
        ) * (self.temperature ** 2)

        # Hard target loss (standard cross-entropy)
        hard_loss = F.cross_entropy(student_logits, hard_targets)

        total = self.alpha * distill_loss + (1 - self.alpha) * hard_loss
        return total


class RegularizationManager:
    """Manages multiple regularization techniques.

    Combines label smoothing, R-Drop, mixup, focal loss, SWA, and
    distillation into a single manager that integrates with the trainer.

    Usage:
        config = RegularizationConfig(
            techniques=["label_smoothing", "focal_loss", "swa"],
            label_smoothing_epsilon=0.1,
            focal_gamma=2.0,
            swa_start_epoch=5
        )
        manager = RegularizationManager(model, config)

        loss = manager.compute_loss(logits, targets, epoch=current_epoch)
    """

    def __init__(self, model: nn.Module, config: RegularizationConfig,
                 num_classes: int = 2, teacher_model: Optional[nn.Module] = None):
        self.model = model
        self.config = config
        self.techniques = [RegularizationTechnique(t) for t in config.techniques]

        self.label_smoother: Optional[LabelSmoothingLoss] = None
        self.focal_loss: Optional[FocalLoss] = None
        self.r_drop: Optional[RDropLoss] = None
        self.mixup: Optional[Mixup] = None
        self.swa: Optional[StochasticWeightAveraging] = None
        self.distiller: Optional[KnowledgeDistiller] = None

        if RegularizationTechnique.LABEL_SMOOTHING in self.techniques:
            self.label_smoother = LabelSmoothingLoss(num_classes, config.label_smoothing_epsilon)

        if RegularizationTechnique.FOCAL_LOSS in self.techniques:
            alpha_tensor = torch.tensor(config.focal_alpha) if config.focal_alpha else None
            self.focal_loss = FocalLoss(config.focal_gamma, alpha_tensor)

        if RegularizationTechnique.R_DROP in self.techniques:
            self.r_drop = RDropLoss(config.r_drop_alpha)

        if RegularizationTechnique.MIXUP in self.techniques:
            self.mixup = Mixup(config.mixup_alpha)

        if RegularizationTechnique.SWA in self.techniques:
            self.swa = StochasticWeightAveraging(model, config.swa_start_epoch, config.swa_lr)

        if RegularizationTechnique.DISTILLATION in self.techniques and teacher_model is not None:
            self.distiller = KnowledgeDistiller(
                teacher_model, config.distill_temperature, config.distill_alpha
            )

        active = [t.value for t in self.techniques]
        logger.info("Regularization initialized: %s", active)

    def compute_loss(
        self,
        logits: torch.Tensor,
        targets: torch.Tensor,
        inputs: Optional[dict] = None,
        logits_2: Optional[torch.Tensor] = None,
        epoch: int = 0
    ) -> torch.Tensor:
        """Compute combined loss with all active regularization techniques."""
        # Choose base loss function
        if self.focal_loss is not None:
            loss = self.focal_loss(logits, targets)
        elif self.label_smoother is not None:
            loss = self.label_smoother(logits, targets)
        else:
            loss = F.cross_entropy(logits, targets)

        # Add R-Drop consistency loss
        if self.r_drop is not None and logits_2 is not None:
            kl_loss = self.r_drop.compute_kl_loss(logits, logits_2)
            loss = loss + self.config.r_drop_alpha * kl_loss

        # Add distillation loss
        if self.distiller is not None and inputs is not None:
            distill_loss = self.distiller.distillation_loss(logits, inputs, targets)
            loss = 0.5 * loss + 0.5 * distill_loss

        return loss

    def end_epoch(self, epoch: int) -> None:
        """Called at end of each epoch for SWA updates."""
        if self.swa is not None and self.swa.should_update(epoch):
            self.swa.update()

    def finalize(self) -> None:
        """Called after training completes. Applies SWA if active."""
        if self.swa is not None:
            self.swa.apply_average()

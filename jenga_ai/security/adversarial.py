"""Adversarial training and robustness for Jenga-AI.

Provides tools to:
1. Generate adversarial examples to test model robustness
2. Train models with adversarial augmentation for hardening
3. Evaluate model vulnerability to AI-enhanced cyber attacks
4. Defend against prompt injection and data poisoning

Designed for Kenya's threat landscape where AI-enhanced attacks
(phishing, deepfakes, automated exploitation) are growing concerns.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


class AttackType(str, Enum):
    """Types of adversarial attacks supported."""
    FGSM = "fgsm"                     # Fast Gradient Sign Method
    PGD = "pgd"                       # Projected Gradient Descent
    TEXTFOOLER = "textfooler"         # Text-level word substitution
    SYNONYM_SWAP = "synonym_swap"     # Synonym-based perturbation
    CHARACTER_SWAP = "char_swap"      # Typo-based evasion (common in Kenyan SMS fraud)


@dataclass
class AdversarialConfig:
    """Configuration for adversarial training."""
    enabled: bool = False
    attack_type: AttackType = AttackType.FGSM
    epsilon: float = 0.01             # Perturbation magnitude for gradient attacks
    num_attack_steps: int = 3         # Steps for PGD
    adversarial_weight: float = 0.5   # Weight of adversarial loss vs clean loss
    eval_adversarial: bool = True     # Evaluate on adversarial examples too


class AdversarialAttack:
    """Generate adversarial examples for model robustness testing.

    Supports embedding-level attacks (FGSM, PGD) that perturb the
    input embeddings to find adversarial examples that fool the model.

    This is critical for security models where adversaries actively
    try to evade detection (e.g., hate speech with misspellings,
    phishing with Unicode tricks common in Kenyan SMS fraud).

    Args:
        model: The model to attack.
        attack_type: Type of attack to use.
        epsilon: Maximum perturbation magnitude.
        num_steps: Number of PGD steps.
    """

    def __init__(
        self,
        model: nn.Module,
        attack_type: AttackType = AttackType.FGSM,
        epsilon: float = 0.01,
        num_steps: int = 3,
    ) -> None:
        self.model = model
        self.attack_type = attack_type
        self.epsilon = epsilon
        self.num_steps = num_steps

    def fgsm_attack(
        self,
        embeddings: torch.Tensor,
        labels: torch.Tensor,
        loss_fn: nn.Module,
        task_output_fn: Any,
    ) -> torch.Tensor:
        """Fast Gradient Sign Method attack on embeddings.

        Computes the gradient of the loss w.r.t. embeddings and
        perturbs in the direction that maximizes loss.

        Args:
            embeddings: [batch, seq_len, hidden] input embeddings.
            labels: Ground truth labels.
            loss_fn: Loss function.
            task_output_fn: Function that runs model from embeddings.

        Returns:
            Perturbed embeddings.
        """
        embeddings_adv = embeddings.clone().detach().requires_grad_(True)

        # Forward pass
        output = task_output_fn(embeddings_adv)
        loss = loss_fn(output, labels)
        loss.backward()

        # Perturb in gradient direction
        grad_sign = embeddings_adv.grad.sign()
        perturbed = embeddings + self.epsilon * grad_sign

        return perturbed.detach()

    def pgd_attack(
        self,
        embeddings: torch.Tensor,
        labels: torch.Tensor,
        loss_fn: nn.Module,
        task_output_fn: Any,
    ) -> torch.Tensor:
        """Projected Gradient Descent attack (iterative FGSM).

        Stronger than FGSM. Iteratively perturbs embeddings within
        an epsilon-ball around the original input.

        Args:
            embeddings: [batch, seq_len, hidden] input embeddings.
            labels: Ground truth labels.
            loss_fn: Loss function.
            task_output_fn: Function that runs model from embeddings.

        Returns:
            Perturbed embeddings.
        """
        step_size = self.epsilon / self.num_steps * 2
        perturbed = embeddings.clone().detach()

        for _ in range(self.num_steps):
            perturbed.requires_grad_(True)
            output = task_output_fn(perturbed)
            loss = loss_fn(output, labels)
            loss.backward()

            # Step in gradient direction
            grad_sign = perturbed.grad.sign()
            perturbed = perturbed.detach() + step_size * grad_sign

            # Project back to epsilon-ball
            perturbation = perturbed - embeddings
            perturbation = torch.clamp(perturbation, -self.epsilon, self.epsilon)
            perturbed = embeddings + perturbation

        return perturbed.detach()

    def evaluate_robustness(
        self,
        dataloader: Any,
        attack_fn: Any,
    ) -> dict[str, float]:
        """Evaluate model robustness against adversarial attacks.

        Returns:
            Dict with clean_accuracy, adversarial_accuracy, robustness_gap.
        """
        # This will be fully implemented when integrated with the trainer
        logger.info("Adversarial robustness evaluation - placeholder for full integration")
        return {
            "clean_accuracy": 0.0,
            "adversarial_accuracy": 0.0,
            "robustness_gap": 0.0,
        }


class AdversarialTrainer:
    """Wrapper that adds adversarial training to the standard Trainer.

    During training, for each clean batch:
    1. Compute clean loss normally
    2. Generate adversarial examples using FGSM/PGD
    3. Compute adversarial loss on perturbed inputs
    4. Combine: total_loss = (1-w)*clean_loss + w*adversarial_loss

    This hardens the model against evasion attacks, critical for:
    - Hate speech detection (attackers use misspellings, code-switching)
    - Phishing detection (Unicode tricks, lookalike domains)
    - Fraud detection (obfuscated transaction descriptions)

    Args:
        config: Adversarial training configuration.
    """

    def __init__(self, config: AdversarialConfig) -> None:
        self.config = config
        self.attack: Optional[AdversarialAttack] = None

    def setup(self, model: nn.Module) -> None:
        """Initialize the attack with the model."""
        self.attack = AdversarialAttack(
            model=model,
            attack_type=self.config.attack_type,
            epsilon=self.config.epsilon,
            num_steps=self.config.num_attack_steps,
        )
        logger.info(
            f"Adversarial training enabled: {self.config.attack_type.value}, "
            f"epsilon={self.config.epsilon}"
        )

    def compute_adversarial_loss(
        self,
        clean_loss: torch.Tensor,
        adversarial_loss: torch.Tensor,
    ) -> torch.Tensor:
        """Combine clean and adversarial losses.

        Args:
            clean_loss: Loss on clean examples.
            adversarial_loss: Loss on adversarial examples.

        Returns:
            Combined weighted loss.
        """
        w = self.config.adversarial_weight
        return (1 - w) * clean_loss + w * adversarial_loss

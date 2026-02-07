"""Security module for Jenga-AI V2.

Provides tools for building secure, auditable, and explainable AI systems
for national security, governance, and cyber threat detection in Kenya.

Sub-modules:
- adversarial: Adversarial training and robustness testing
- explainability: SHAP, attention visualization, feature importance
- audit: Complete audit trail for model lifecycle
- hitl: Human-in-the-loop active learning for uncertain predictions
"""

from .adversarial import AdversarialTrainer, AdversarialAttack
from .explainability import ExplainabilityEngine
from .audit import AuditLogger, AuditEvent
from .hitl import HITLRouter, UncertaintyEstimator

__all__ = [
    "AdversarialTrainer",
    "AdversarialAttack",
    "ExplainabilityEngine",
    "AuditLogger",
    "AuditEvent",
    "HITLRouter",
    "UncertaintyEstimator",
]

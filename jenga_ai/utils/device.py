"""Device management utilities for Jenga-AI.

Handles device detection, tensor movement, and AMP compatibility checks.
"""

import logging
from typing import Any

import torch

logger = logging.getLogger(__name__)


def get_device(preferred: str = "auto") -> torch.device:
    """Get the best available device.

    Args:
        preferred: Preferred device. Options: 'auto', 'cuda', 'cpu', 'mps'.

    Returns:
        torch.device instance.
    """
    if preferred == "auto":
        if torch.cuda.is_available():
            device = torch.device("cuda")
            logger.info(f"Using CUDA device: {torch.cuda.get_device_name(0)}")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = torch.device("mps")
            logger.info("Using MPS (Apple Silicon) device")
        else:
            device = torch.device("cpu")
            logger.info("Using CPU device")
    else:
        device = torch.device(preferred)
        if preferred == "cuda" and not torch.cuda.is_available():
            logger.warning("CUDA requested but not available, falling back to CPU")
            device = torch.device("cpu")
        elif preferred == "mps" and not (hasattr(torch.backends, "mps") and torch.backends.mps.is_available()):
            logger.warning("MPS requested but not available, falling back to CPU")
            device = torch.device("cpu")

    return device


def move_to_device(data: Any, device: torch.device) -> Any:
    """Recursively move data to the specified device.

    Handles tensors, dicts, lists, and tuples.

    Args:
        data: Data to move (tensor, dict, list, or tuple).
        device: Target device.

    Returns:
        Data on the target device.
    """
    if isinstance(data, torch.Tensor):
        return data.to(device)
    elif isinstance(data, dict):
        return {k: move_to_device(v, device) for k, v in data.items()}
    elif isinstance(data, (list, tuple)):
        moved = [move_to_device(item, device) for item in data]
        return type(data)(moved)
    return data


def supports_amp(device: torch.device) -> bool:
    """Check if a device supports automatic mixed precision.

    Args:
        device: The device to check.

    Returns:
        True if AMP is supported.
    """
    if device.type == "cuda":
        return True
    if device.type == "cpu":
        # CPU AMP is supported in newer PyTorch versions but is slower
        return torch.torch_version.TorchVersion(torch.__version__) >= "2.0.0"
    return False

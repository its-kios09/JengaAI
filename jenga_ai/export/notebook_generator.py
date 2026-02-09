"""Generate Jupyter notebooks for Google Colab and Kaggle.

Creates ready-to-run .ipynb files with:
- Dependency installation cells
- Jenga-AI framework setup
- YAML config embedded as a cell
- Training execution via CLI
- Results visualization stub
"""

from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Dependencies to install in notebooks
CORE_DEPS = "torch transformers datasets peft accelerate scikit-learn pyyaml tensorboard"


def _make_cell(
    source: str | list[str],
    cell_type: str = "code",
    execution_count: int | None = None,
) -> dict[str, Any]:
    """Create a Jupyter notebook cell."""
    if isinstance(source, str):
        source = source.split("\n")
    # Ensure each line (except the last) ends with \n
    lines = []
    for i, line in enumerate(source):
        if i < len(source) - 1 and not line.endswith("\n"):
            lines.append(line + "\n")
        else:
            lines.append(line)

    cell: dict[str, Any] = {
        "cell_type": cell_type,
        "metadata": {},
        "source": lines,
    }
    if cell_type == "code":
        cell["execution_count"] = execution_count
        cell["outputs"] = []
    return cell


def _detect_config_type(config_yaml: str) -> str:
    """Detect if config is for LLM fine-tuning or multi-task training."""
    if "model_name:" in config_yaml and "task_type:" in config_yaml:
        return "llm"
    return "multitask"


def _make_notebook(
    cells: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Assemble cells into a complete notebook dict."""
    return {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": metadata or {},
        "cells": cells,
    }


def generate_colab_notebook(
    config_yaml: str,
    project_name: str = "jenga_experiment",
) -> dict[str, Any]:
    """Generate a Google Colab notebook for training.

    Args:
        config_yaml: YAML config file contents.
        project_name: Name for the experiment.

    Returns:
        Notebook dict (nbformat v4 compatible).
    """
    config_type = _detect_config_type(config_yaml)
    train_cmd = "llm-train" if config_type == "llm" else "train"

    cells = [
        # Title
        _make_cell(
            f"# Jenga-AI — {project_name}\n"
            f"\n"
            f"Auto-generated notebook for training on Google Colab.\n"
            f"\n"
            f"**Config type:** {config_type}\n"
            f"**Runtime:** GPU (T4 or better recommended)",
            cell_type="markdown",
        ),
        # Install dependencies
        _make_cell(
            f"# Install dependencies\n"
            f"!pip install -q {CORE_DEPS}",
        ),
        # Clone/install Jenga-AI
        _make_cell(
            "# Install Jenga-AI framework\n"
            "# Option 1: Clone from repo (uncomment and set your repo URL)\n"
            "# !git clone https://github.com/your-org/jenga-ai.git\n"
            "# %cd jenga-ai\n"
            "# !pip install -e .\n"
            "\n"
            "# Option 2: Install from PyPI (when published)\n"
            "# !pip install jenga-ai\n"
            "\n"
            "# Option 3: Upload jenga_ai/ folder to Colab files panel\n"
            "import sys\n"
            "sys.path.insert(0, '.')",
        ),
        # Write config
        _make_cell(
            f"# Write experiment config\n"
            f"config_yaml = '''{config_yaml}'''\n"
            f"\n"
            f"with open('config.yaml', 'w') as f:\n"
            f"    f.write(config_yaml)\n"
            f"\n"
            f"print('Config written to config.yaml')",
        ),
        # Verify GPU
        _make_cell(
            "# Verify GPU availability\n"
            "import torch\n"
            "print(f'PyTorch: {torch.__version__}')\n"
            "print(f'CUDA available: {torch.cuda.is_available()}')\n"
            "if torch.cuda.is_available():\n"
            "    print(f'GPU: {torch.cuda.get_device_name(0)}')\n"
            "    print(f'VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB')\n"
            "else:\n"
            "    print('WARNING: No GPU detected. Go to Runtime > Change runtime type > GPU')",
        ),
        # Train
        _make_cell(
            f"# Run training\n"
            f"!python -m jenga_ai {train_cmd} --config config.yaml --output-dir ./results",
        ),
        # Results
        _make_cell(
            "# View results\n"
            "import os\n"
            "results_dir = './results'\n"
            "if os.path.exists(results_dir):\n"
            "    for f in os.listdir(results_dir):\n"
            "        print(f'  {f}')\n"
            "else:\n"
            "    print('No results directory found')",
        ),
        # Download
        _make_cell(
            "# Download trained model (Colab)\n"
            "# from google.colab import files\n"
            "# !zip -r model.zip results/\n"
            "# files.download('model.zip')",
        ),
    ]

    metadata = {
        "colab": {
            "provenance": [],
            "gpuType": "T4",
        },
        "kernelspec": {
            "display_name": "Python 3",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
        },
        "accelerator": "GPU",
    }

    nb = _make_notebook(cells, metadata)
    logger.info("Generated Colab notebook for '%s'", project_name)
    return nb


def generate_kaggle_notebook(
    config_yaml: str,
    project_name: str = "jenga_experiment",
) -> dict[str, Any]:
    """Generate a Kaggle notebook for training.

    Args:
        config_yaml: YAML config file contents.
        project_name: Name for the experiment.

    Returns:
        Notebook dict (nbformat v4 compatible).
    """
    config_type = _detect_config_type(config_yaml)
    train_cmd = "llm-train" if config_type == "llm" else "train"

    cells = [
        # Title
        _make_cell(
            f"# Jenga-AI — {project_name}\n"
            f"\n"
            f"Auto-generated notebook for training on Kaggle.\n"
            f"\n"
            f"**Config type:** {config_type}\n"
            f"**Runtime:** GPU (T4 x2 available free)",
            cell_type="markdown",
        ),
        # Install dependencies
        _make_cell(
            f"# Install dependencies\n"
            f"!pip install -q {CORE_DEPS}",
        ),
        # Setup
        _make_cell(
            "# Setup Jenga-AI framework\n"
            "# Option 1: Upload jenga_ai/ as a Kaggle dataset\n"
            "# import sys\n"
            "# sys.path.insert(0, '/kaggle/input/jenga-ai')\n"
            "\n"
            "# Option 2: Clone from repo\n"
            "# !git clone https://github.com/your-org/jenga-ai.git\n"
            "# import sys\n"
            "# sys.path.insert(0, 'jenga-ai')\n"
            "\n"
            "import sys\n"
            "sys.path.insert(0, '.')",
        ),
        # Write config
        _make_cell(
            f"# Write experiment config\n"
            f"config_yaml = '''{config_yaml}'''\n"
            f"\n"
            f"# Use Kaggle working directory\n"
            f"import os\n"
            f"os.chdir('/kaggle/working')\n"
            f"\n"
            f"with open('config.yaml', 'w') as f:\n"
            f"    f.write(config_yaml)\n"
            f"\n"
            f"print('Config written to /kaggle/working/config.yaml')",
        ),
        # Verify GPU
        _make_cell(
            "# Verify GPU availability\n"
            "import torch\n"
            "print(f'PyTorch: {torch.__version__}')\n"
            "print(f'CUDA available: {torch.cuda.is_available()}')\n"
            "if torch.cuda.is_available():\n"
            "    for i in range(torch.cuda.device_count()):\n"
            "        print(f'GPU {i}: {torch.cuda.get_device_name(i)}')\n"
            "else:\n"
            "    print('WARNING: No GPU. Enable in Settings > Accelerator > GPU T4 x2')",
        ),
        # Train
        _make_cell(
            f"# Run training\n"
            f"!python -m jenga_ai {train_cmd} --config config.yaml --output-dir /kaggle/working/results",
        ),
        # Results
        _make_cell(
            "# View results\n"
            "import os\n"
            "results_dir = '/kaggle/working/results'\n"
            "if os.path.exists(results_dir):\n"
            "    for f in os.listdir(results_dir):\n"
            "        size = os.path.getsize(os.path.join(results_dir, f))\n"
            "        print(f'  {f} ({size:,} bytes)')\n"
            "else:\n"
            "    print('No results directory found')",
        ),
    ]

    metadata = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.10.0",
        },
        "kaggle": {
            "accelerator": "gpu",
            "dataSources": [],
            "isGpuEnabled": True,
            "isInternetEnabled": True,
        },
    }

    nb = _make_notebook(cells, metadata)
    logger.info("Generated Kaggle notebook for '%s'", project_name)
    return nb


def save_notebook(nb_dict: dict[str, Any], path: str | Path) -> None:
    """Write a notebook dict to a .ipynb file.

    Args:
        nb_dict: Notebook dict from generate_*_notebook().
        path: Output file path.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(nb_dict, f, indent=1)
    logger.info("Notebook saved to %s", path)

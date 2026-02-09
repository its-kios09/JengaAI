"""Generate downloadable training packages for local execution.

Creates ZIP archives containing:
- Standalone training script
- YAML experiment config
- requirements.txt with pinned deps
- README with run instructions
"""

from __future__ import annotations

import io
import logging
import zipfile
from pathlib import Path

logger = logging.getLogger(__name__)

REQUIREMENTS = """\
torch>=2.0
transformers>=4.40
datasets>=2.18
peft>=0.10
accelerate>=0.28
scikit-learn>=1.4
pyyaml>=6.0
tensorboard>=2.16
numpy>=1.26
pandas>=2.0
tqdm>=4.66
"""


def _detect_config_type(config_yaml: str) -> str:
    """Detect if config is for LLM fine-tuning or multi-task training."""
    if "model_name:" in config_yaml and "task_type:" in config_yaml:
        return "llm"
    return "multitask"


def generate_training_script(config_yaml: str) -> str:
    """Generate a standalone Python training script.

    Args:
        config_yaml: YAML config contents.

    Returns:
        Python script as a string.
    """
    config_type = _detect_config_type(config_yaml)

    if config_type == "llm":
        return _generate_llm_script()
    return _generate_multitask_script()


def _generate_multitask_script() -> str:
    return '''\
#!/usr/bin/env python3
"""Jenga-AI Multi-Task Training Script.

Usage:
    python train.py
    python train.py --device cuda
"""

import argparse
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Jenga-AI Training")
    parser.add_argument("--config", default="config.yaml", help="Path to YAML config")
    parser.add_argument("--output-dir", default=None, help="Override output directory")
    parser.add_argument("--device", default=None, help="Device: auto, cuda, cpu, mps")
    args = parser.parse_args()

    from transformers import AutoTokenizer
    from jenga_ai.core.config import ExperimentConfig
    from jenga_ai.core.model import MultiTaskModel
    from jenga_ai.data.processor import DataProcessor
    from jenga_ai.training.trainer import Trainer

    config = ExperimentConfig.from_yaml(args.config)
    if args.output_dir:
        config.training.output_dir = args.output_dir
    if args.device:
        config.training.device = args.device

    logger.info("Project: %s", config.project_name)
    logger.info("Model: %s", config.model.base_model)

    tokenizer = AutoTokenizer.from_pretrained(config.model.base_model)
    processor = DataProcessor(config, tokenizer)
    train_ds, eval_ds, config = processor.process()
    model = MultiTaskModel.from_config(config)

    trainer = Trainer(
        config=config, model=model, tokenizer=tokenizer,
        train_datasets=train_ds, eval_datasets=eval_ds,
    )
    results = trainer.train()
    config.to_yaml(f"{config.training.output_dir}/experiment_config.yaml")
    logger.info("Training complete.")


if __name__ == "__main__":
    main()
'''


def _generate_llm_script() -> str:
    return '''\
#!/usr/bin/env python3
"""Jenga-AI LLM Fine-Tuning Script.

Usage:
    python train.py
    python train.py --output-dir ./my_model
"""

import argparse
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Jenga-AI LLM Fine-Tuning")
    parser.add_argument("--config", default="config.yaml", help="Path to YAML config")
    parser.add_argument("--output-dir", default=None, help="Override output directory")
    args = parser.parse_args()

    from jenga_ai.llm.config import LLMConfig
    from jenga_ai.llm.data import LLMDataProcessor
    from jenga_ai.llm.model_factory import load_model_and_tokenizer
    from jenga_ai.llm.trainer import LLMTrainer

    config = LLMConfig.from_yaml(args.config)
    if args.output_dir:
        config.training.output_dir = args.output_dir

    logger.info("Model: %s", config.model_name)

    _, tokenizer = load_model_and_tokenizer(config)
    data_processor = LLMDataProcessor(config, tokenizer)
    train_dataset, eval_dataset = data_processor.load_and_prepare()

    trainer = LLMTrainer(config)
    metrics = trainer.train(train_dataset, eval_dataset)
    trainer.save(config.training.output_dir)
    logger.info("Training complete. Metrics: %s", metrics)


if __name__ == "__main__":
    main()
'''


def _generate_readme(project_name: str, config_type: str) -> str:
    return f"""\
# {project_name} — Jenga-AI Training Package

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install Jenga-AI framework:
   ```bash
   # Clone and install
   git clone https://github.com/your-org/jenga-ai.git
   pip install -e jenga-ai/
   ```

3. Run training:
   ```bash
   python train.py
   ```

## Options

```bash
# Override output directory
python train.py --output-dir ./my_results

# Specify device
python train.py --device cuda
```

## Config

Edit `config.yaml` to customize:
- Model architecture and hyperparameters
- Training epochs, learning rate, batch size
- Data paths and preprocessing
- Logging and checkpointing

## Config Type: {config_type}
"""


def generate_training_package(
    config_yaml: str,
    project_name: str = "jenga_experiment",
) -> bytes:
    """Generate a ZIP archive with training script, config, and requirements.

    Args:
        config_yaml: YAML config contents.
        project_name: Name for the experiment.

    Returns:
        ZIP file as bytes.
    """
    config_type = _detect_config_type(config_yaml)
    script = generate_training_script(config_yaml)
    readme = _generate_readme(project_name, config_type)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{project_name}/train.py", script)
        zf.writestr(f"{project_name}/config.yaml", config_yaml)
        zf.writestr(f"{project_name}/requirements.txt", REQUIREMENTS)
        zf.writestr(f"{project_name}/README.md", readme)

    package_bytes = buf.getvalue()
    logger.info(
        "Generated training package '%s' (%d bytes, %s)",
        project_name, len(package_bytes), config_type,
    )
    return package_bytes

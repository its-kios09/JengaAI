"""CLI for Jenga-AI: run experiments from YAML config files.

Usage:
    python -m jenga_ai train --config configs/multi_task_classification.yaml
    python -m jenga_ai llm-train --config configs/llm_finetuning.yaml
    python -m jenga_ai evaluate --config configs/multi_task_classification.yaml --model-dir results/
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

logger = logging.getLogger("jenga_ai")


def _setup_logging(verbose: bool) -> None:
    """Configure logging for the CLI."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def cmd_train(args: argparse.Namespace) -> None:
    """Run multi-task training from a YAML config."""
    from transformers import AutoTokenizer

    from jenga_ai.core.config import ExperimentConfig
    from jenga_ai.core.model import MultiTaskModel
    from jenga_ai.data.processor import DataProcessor
    from jenga_ai.training.trainer import Trainer

    config_path = Path(args.config)
    if not config_path.exists():
        logger.error("Config file not found: %s", config_path)
        sys.exit(1)

    logger.info("Loading config from %s", config_path)
    config = ExperimentConfig.from_yaml(config_path)

    # Apply CLI overrides
    if args.output_dir:
        config.training.output_dir = args.output_dir
    if args.device:
        config.training.device = args.device

    output_dir = Path(config.training.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Project: %s", config.project_name)
    logger.info("Tasks: %s", [t.name for t in config.tasks])
    logger.info("Model: %s", config.model.base_model)
    logger.info("Output: %s", output_dir)

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(config.model.base_model)

    # Process data
    processor = DataProcessor(config, tokenizer)
    train_datasets, eval_datasets, config = processor.process()

    # Create model
    model = MultiTaskModel.from_config(config)
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info("Parameters: %s total, %s trainable", f"{total_params:,}", f"{trainable_params:,}")

    # Train
    trainer = Trainer(
        config=config,
        model=model,
        tokenizer=tokenizer,
        train_datasets=train_datasets,
        eval_datasets=eval_datasets,
    )
    results = trainer.train()

    # Save config alongside model
    config.to_yaml(output_dir / "experiment_config.yaml")

    # Print QA report if applicable
    from jenga_ai.core.config import TaskType

    for task_config in config.tasks:
        if task_config.type == TaskType.QA:
            from jenga_ai.tasks.qa import QAScoringTask

            report = QAScoringTask.format_evaluation_report(
                results.get("final_metrics", {}),
                task_name=task_config.name,
            )
            print(report)

    logger.info("Training complete. Results saved to %s", output_dir)


def cmd_llm_train(args: argparse.Namespace) -> None:
    """Run LLM fine-tuning from a YAML config."""
    from jenga_ai.llm.config import LLMConfig
    from jenga_ai.llm.data import LLMDataProcessor
    from jenga_ai.llm.trainer import LLMTrainer

    config_path = Path(args.config)
    if not config_path.exists():
        logger.error("Config file not found: %s", config_path)
        sys.exit(1)

    logger.info("Loading LLM config from %s", config_path)
    config = LLMConfig.from_yaml(config_path)

    # Apply CLI overrides
    if args.output_dir:
        config.training.output_dir = args.output_dir

    output_dir = Path(config.training.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Model: %s", config.model_name)
    logger.info("LoRA: %s (rank=%d)", config.lora.enabled, config.lora.rank)
    logger.info("Output: %s", output_dir)

    # Load model + tokenizer (handled inside LLMTrainer)
    trainer = LLMTrainer(config)

    # Process data
    from jenga_ai.llm.model_factory import load_model_and_tokenizer

    _, tokenizer = load_model_and_tokenizer(config)
    data_processor = LLMDataProcessor(config, tokenizer)
    train_dataset, eval_dataset = data_processor.load_and_prepare()

    logger.info("Train samples: %d", len(train_dataset))
    if eval_dataset:
        logger.info("Eval samples: %d", len(eval_dataset))

    # Train
    metrics = trainer.train(train_dataset, eval_dataset)

    # Save
    trainer.save(str(output_dir))

    logger.info("LLM training complete. Metrics: %s", metrics)
    logger.info("Model saved to %s", output_dir)


def cmd_evaluate(args: argparse.Namespace) -> None:
    """Evaluate a saved model from a YAML config."""
    from transformers import AutoTokenizer

    from jenga_ai.core.config import ExperimentConfig, TaskType
    from jenga_ai.core.model import MultiTaskModel
    from jenga_ai.data.processor import DataProcessor
    from jenga_ai.training.trainer import Trainer

    config_path = Path(args.config)
    model_dir = Path(args.model_dir)

    if not config_path.exists():
        logger.error("Config file not found: %s", config_path)
        sys.exit(1)
    if not model_dir.exists():
        logger.error("Model directory not found: %s", model_dir)
        sys.exit(1)

    logger.info("Loading config from %s", config_path)
    config = ExperimentConfig.from_yaml(config_path)

    if args.device:
        config.training.device = args.device

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(config.model.base_model)

    # Process data (for eval split)
    processor = DataProcessor(config, tokenizer)
    _, eval_datasets, config = processor.process()

    # Load model
    device = config.training.resolve_device()
    model = MultiTaskModel.load(model_dir, config, device=device)

    # Create trainer for evaluation only
    trainer = Trainer(
        config=config,
        model=model,
        tokenizer=tokenizer,
        train_datasets={},  # No training data needed
        eval_datasets=eval_datasets,
    )
    metrics = trainer.evaluate()

    # Print metrics
    print("\nEvaluation Results:")
    print("-" * 40)
    for key, value in sorted(metrics.items()):
        print(f"  {key:30s}: {value:.4f}")

    # Print QA report if applicable
    for task_config in config.tasks:
        if task_config.type == TaskType.QA:
            from jenga_ai.tasks.qa import QAScoringTask

            report = QAScoringTask.format_evaluation_report(metrics, task_name=task_config.name)
            print(report)


def cmd_export_notebook(args: argparse.Namespace) -> None:
    """Generate a Colab or Kaggle notebook from a YAML config."""
    from jenga_ai.export.notebook_generator import (
        generate_colab_notebook,
        generate_kaggle_notebook,
        save_notebook,
    )

    config_path = Path(args.config)
    if not config_path.exists():
        logger.error("Config file not found: %s", config_path)
        sys.exit(1)

    config_yaml = config_path.read_text()
    project_name = args.project_name or config_path.stem

    if args.target == "kaggle":
        nb = generate_kaggle_notebook(config_yaml, project_name)
    else:
        nb = generate_colab_notebook(config_yaml, project_name)

    output_path = Path(args.output)
    save_notebook(nb, output_path)
    logger.info("Notebook saved to %s (target: %s)", output_path, args.target)


def cmd_export_package(args: argparse.Namespace) -> None:
    """Generate a training ZIP package from a YAML config."""
    from jenga_ai.export.local_package import generate_training_package

    config_path = Path(args.config)
    if not config_path.exists():
        logger.error("Config file not found: %s", config_path)
        sys.exit(1)

    config_yaml = config_path.read_text()
    project_name = args.project_name or config_path.stem

    package_bytes = generate_training_package(config_yaml, project_name)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(package_bytes)
    logger.info("Package saved to %s (%d bytes)", output_path, len(package_bytes))


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="jenga-ai",
        description="Jenga-AI: Low-code NLP platform for national security applications",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable debug logging")

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # --- train ---
    train_parser = subparsers.add_parser(
        "train",
        help="Run multi-task training from YAML config",
    )
    train_parser.add_argument(
        "--config", required=True, help="Path to experiment YAML config"
    )
    train_parser.add_argument(
        "--output-dir", default=None, help="Override output directory from config"
    )
    train_parser.add_argument(
        "--device", default=None, help="Override device (auto, cuda, cpu, mps)"
    )

    # --- llm-train ---
    llm_parser = subparsers.add_parser(
        "llm-train",
        help="Run LLM fine-tuning from YAML config",
    )
    llm_parser.add_argument(
        "--config", required=True, help="Path to LLM YAML config"
    )
    llm_parser.add_argument(
        "--output-dir", default=None, help="Override output directory from config"
    )

    # --- evaluate ---
    eval_parser = subparsers.add_parser(
        "evaluate",
        help="Evaluate a saved model",
    )
    eval_parser.add_argument(
        "--config", required=True, help="Path to experiment YAML config"
    )
    eval_parser.add_argument(
        "--model-dir", required=True, help="Path to saved model directory"
    )
    eval_parser.add_argument(
        "--device", default=None, help="Override device (auto, cuda, cpu, mps)"
    )

    # --- export-notebook ---
    nb_parser = subparsers.add_parser(
        "export-notebook",
        help="Generate a Colab/Kaggle notebook from YAML config",
    )
    nb_parser.add_argument(
        "--config", required=True, help="Path to experiment YAML config"
    )
    nb_parser.add_argument(
        "--target",
        choices=["colab", "kaggle"],
        default="colab",
        help="Notebook target platform (default: colab)",
    )
    nb_parser.add_argument(
        "--output", required=True, help="Output .ipynb file path"
    )
    nb_parser.add_argument(
        "--project-name", default=None, help="Override project name"
    )

    # --- export-package ---
    pkg_parser = subparsers.add_parser(
        "export-package",
        help="Generate a downloadable training ZIP package from YAML config",
    )
    pkg_parser.add_argument(
        "--config", required=True, help="Path to experiment YAML config"
    )
    pkg_parser.add_argument(
        "--output", required=True, help="Output .zip file path"
    )
    pkg_parser.add_argument(
        "--project-name", default=None, help="Override project name"
    )

    args = parser.parse_args()
    _setup_logging(args.verbose)

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    commands = {
        "train": cmd_train,
        "llm-train": cmd_llm_train,
        "evaluate": cmd_evaluate,
        "export-notebook": cmd_export_notebook,
        "export-package": cmd_export_package,
    }

    handler = commands.get(args.command)
    if handler:
        handler(args)
    else:
        parser.print_help()
        sys.exit(1)

"""Celery worker for running training jobs on the Jenga Platform provider.

Dispatches training via the jenga_ai CLI module. Updates job status in the
compute service's in-memory store (would use DB/Redis in production).
"""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from celery import Celery

from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "jenga_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(bind=True, name="training.run_job")
def run_training_job(
    self,
    job_id: str,
    config_yaml: str,
    project_name: str = "jenga_experiment",
    output_dir: str | None = None,
) -> dict:
    """Execute a training job using the Jenga-AI framework.

    Args:
        job_id: Unique job identifier.
        config_yaml: YAML config contents.
        project_name: Experiment name.
        output_dir: Override output directory.

    Returns:
        Dict with final metrics.
    """
    from app.services.compute_service import compute_service

    # Update status to running
    compute_service._jobs[job_id] = {
        "job_id": job_id,
        "status": "running",
        "provider_type": "platform",
        "progress": 0.0,
    }

    try:
        # Write config to temp file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".yaml", delete=False
        ) as tmp:
            tmp.write(config_yaml)
            config_path = tmp.name

        # Detect config type and run appropriate training
        if "model_name:" in config_yaml and "task_type:" in config_yaml:
            _run_llm_training(config_path, output_dir)
        else:
            _run_multitask_training(config_path, output_dir)

        # Update status to completed
        compute_service._jobs[job_id] = {
            "job_id": job_id,
            "status": "completed",
            "provider_type": "platform",
            "progress": 1.0,
        }

        logger.info("Training job %s completed", job_id)
        return {"status": "completed", "job_id": job_id}

    except Exception as exc:
        compute_service._jobs[job_id] = {
            "job_id": job_id,
            "status": "failed",
            "provider_type": "platform",
            "error": str(exc),
        }
        logger.exception("Training job %s failed", job_id)
        raise

    finally:
        # Clean up temp config file
        Path(config_path).unlink(missing_ok=True)


def _run_multitask_training(config_path: str, output_dir: str | None) -> None:
    """Run multi-task training via jenga_ai framework."""
    from transformers import AutoTokenizer

    from jenga_ai.core.config import ExperimentConfig
    from jenga_ai.core.model import MultiTaskModel
    from jenga_ai.data.processor import DataProcessor
    from jenga_ai.training.trainer import Trainer

    config = ExperimentConfig.from_yaml(config_path)
    if output_dir:
        config.training.output_dir = output_dir

    tokenizer = AutoTokenizer.from_pretrained(config.model.base_model)
    processor = DataProcessor(config, tokenizer)
    train_ds, eval_ds, config = processor.process()
    model = MultiTaskModel.from_config(config)

    trainer = Trainer(
        config=config,
        model=model,
        tokenizer=tokenizer,
        train_datasets=train_ds,
        eval_datasets=eval_ds,
    )
    trainer.train()


def _run_llm_training(config_path: str, output_dir: str | None) -> None:
    """Run LLM fine-tuning via jenga_ai framework."""
    from jenga_ai.llm.config import LLMConfig
    from jenga_ai.llm.trainer import LLMTrainer

    config = LLMConfig.from_yaml(config_path)
    if output_dir:
        config.training.output_dir = output_dir

    trainer = LLMTrainer(config)
    train_ds, eval_ds = trainer._prepare_data()
    trainer.train(train_ds, eval_ds)

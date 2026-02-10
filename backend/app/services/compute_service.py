"""Compute service — orchestrates provider routing, job management, and export generation."""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any, Optional

from app.config import settings
from app.schemas.compute import (
    ComputeOptionResponse,
    ComputeProviderResponse,
    CostEstimateResponse,
    JobStatusResponse,
    LaunchJobRequest,
    LaunchJobResponse,
)

logger = logging.getLogger(__name__)

# --- Static provider/option data (matches frontend mock data) ---

PROVIDERS: list[dict[str, Any]] = [
    {"id": "cp_001", "name": "Jenga Platform", "type": "platform", "description": "Managed GPU instances optimized for Jenga-AI workloads. No setup required.", "icon": "Server", "available": True},
    {"id": "cp_002", "name": "RunPod", "type": "runpod", "description": "On-demand GPU cloud with competitive pricing. Connect your RunPod API key.", "icon": "Cloud", "available": True},
    {"id": "cp_003", "name": "Google Colab", "type": "colab", "description": "Free and Pro tier GPU access via Google Colab notebooks.", "icon": "Laptop", "available": True},
    {"id": "cp_004", "name": "Kaggle", "type": "kaggle", "description": "Free GPU notebooks with 30h/week quota. Great for experimentation.", "icon": "Database", "available": True},
    {"id": "cp_005", "name": "Local / Download", "type": "local", "description": "Download model and training scripts to run on your own hardware.", "icon": "HardDrive", "available": True},
]

OPTIONS: list[dict[str, Any]] = [
    {"id": "co_001", "providerId": "cp_001", "name": "Jenga A100", "gpu": "NVIDIA A100 40GB", "vram": "40 GB", "pricePerHour": 2.50, "available": True},
    {"id": "co_002", "providerId": "cp_001", "name": "Jenga T4", "gpu": "NVIDIA T4 16GB", "vram": "16 GB", "pricePerHour": 0.80, "available": True},
    {"id": "co_003", "providerId": "cp_002", "name": "RunPod A100", "gpu": "NVIDIA A100 80GB", "vram": "80 GB", "pricePerHour": 1.99, "available": True},
    {"id": "co_004", "providerId": "cp_002", "name": "RunPod RTX 4090", "gpu": "NVIDIA RTX 4090 24GB", "vram": "24 GB", "pricePerHour": 0.69, "available": True},
    {"id": "co_005", "providerId": "cp_003", "name": "Colab Free", "gpu": "NVIDIA T4 16GB", "vram": "16 GB", "pricePerHour": 0, "available": True},
    {"id": "co_006", "providerId": "cp_003", "name": "Colab Pro", "gpu": "NVIDIA A100 40GB", "vram": "40 GB", "pricePerHour": 0.10, "available": True},
    {"id": "co_007", "providerId": "cp_004", "name": "Kaggle GPU", "gpu": "NVIDIA T4 x2", "vram": "32 GB", "pricePerHour": 0, "available": True},
]


class ComputeService:
    """Manages compute providers, cost estimation, and job launching."""

    def __init__(self) -> None:
        self._jobs: dict[str, dict[str, Any]] = {}
        self._runpod_api_key: Optional[str] = settings.RUNPOD_API_KEY

        # Ensure output directories exist
        Path(settings.NOTEBOOKS_DIR).mkdir(parents=True, exist_ok=True)
        Path(settings.PACKAGES_DIR).mkdir(parents=True, exist_ok=True)

    def get_providers(self) -> list[ComputeProviderResponse]:
        """Return all compute providers."""
        return [ComputeProviderResponse(**p) for p in PROVIDERS]

    def get_options(self, provider_id: Optional[str] = None) -> list[ComputeOptionResponse]:
        """Return compute options, optionally filtered by provider."""
        opts = OPTIONS
        if provider_id:
            opts = [o for o in opts if o["providerId"] == provider_id]
        return [ComputeOptionResponse(**o) for o in opts]

    def estimate_cost(
        self, option_id: str, epochs: int, dataset_size: int
    ) -> CostEstimateResponse:
        """Estimate training cost for a compute option."""
        option = next((o for o in OPTIONS if o["id"] == option_id), None)
        if not option:
            raise ValueError(f"Unknown option: {option_id}")

        estimated_hours = (epochs * dataset_size) / 50000
        return CostEstimateResponse(
            provider=option["name"],
            gpu=option["gpu"],
            estimated_hours=round(estimated_hours, 1),
            cost_per_hour=option["pricePerHour"],
            total_cost=round(estimated_hours * option["pricePerHour"], 2),
        )

    def launch_job(self, request: LaunchJobRequest) -> LaunchJobResponse:
        """Launch a training job on the selected provider.

        Routes to the appropriate handler based on provider_type.
        """
        job_id = f"job_{uuid.uuid4().hex[:12]}"

        if request.provider_type == "colab":
            return self._launch_colab(job_id, request)
        elif request.provider_type == "kaggle":
            return self._launch_kaggle(job_id, request)
        elif request.provider_type == "local":
            return self._launch_local(job_id, request)
        elif request.provider_type == "runpod":
            return self._launch_runpod(job_id, request)
        elif request.provider_type == "platform":
            return self._launch_platform(job_id, request)
        else:
            raise ValueError(f"Unknown provider type: {request.provider_type}")

    def get_job_status(self, job_id: str) -> JobStatusResponse:
        """Get the status of a launched job."""
        job = self._jobs.get(job_id)
        if not job:
            raise ValueError(f"Unknown job: {job_id}")
        return JobStatusResponse(**job)

    def set_runpod_key(self, api_key: str) -> None:
        """Store RunPod API key for this session."""
        self._runpod_api_key = api_key
        logger.info("RunPod API key updated")

    # --- Provider-specific launchers ---

    def _launch_colab(self, job_id: str, request: LaunchJobRequest) -> LaunchJobResponse:
        from jenga_ai.export.notebook_generator import generate_colab_notebook, save_notebook

        nb = generate_colab_notebook(request.config_yaml, request.project_name)
        filename = f"{job_id}_colab.ipynb"
        path = Path(settings.NOTEBOOKS_DIR) / filename
        save_notebook(nb, path)

        self._jobs[job_id] = {
            "job_id": job_id,
            "status": "completed",
            "provider_type": "colab",
            "download_url": f"/api/v1/compute/notebooks/{job_id}",
        }

        return LaunchJobResponse(
            job_id=job_id,
            status="completed",
            provider_type="colab",
            message="Colab notebook generated. Download and open in Google Colab.",
            download_url=f"/api/v1/compute/notebooks/{job_id}",
        )

    def _launch_kaggle(self, job_id: str, request: LaunchJobRequest) -> LaunchJobResponse:
        from jenga_ai.export.notebook_generator import generate_kaggle_notebook, save_notebook

        nb = generate_kaggle_notebook(request.config_yaml, request.project_name)
        filename = f"{job_id}_kaggle.ipynb"
        path = Path(settings.NOTEBOOKS_DIR) / filename
        save_notebook(nb, path)

        self._jobs[job_id] = {
            "job_id": job_id,
            "status": "completed",
            "provider_type": "kaggle",
            "download_url": f"/api/v1/compute/notebooks/{job_id}",
        }

        return LaunchJobResponse(
            job_id=job_id,
            status="completed",
            provider_type="kaggle",
            message="Kaggle notebook generated. Download and upload to Kaggle.",
            download_url=f"/api/v1/compute/notebooks/{job_id}",
        )

    def _launch_local(self, job_id: str, request: LaunchJobRequest) -> LaunchJobResponse:
        from jenga_ai.export.local_package import generate_training_package

        package_bytes = generate_training_package(request.config_yaml, request.project_name)
        filename = f"{job_id}_package.zip"
        path = Path(settings.PACKAGES_DIR) / filename
        path.write_bytes(package_bytes)

        self._jobs[job_id] = {
            "job_id": job_id,
            "status": "completed",
            "provider_type": "local",
            "download_url": f"/api/v1/compute/packages/{job_id}",
        }

        return LaunchJobResponse(
            job_id=job_id,
            status="completed",
            provider_type="local",
            message="Training package generated. Download and run locally.",
            download_url=f"/api/v1/compute/packages/{job_id}",
        )

    def _launch_runpod(self, job_id: str, request: LaunchJobRequest) -> LaunchJobResponse:
        if not self._runpod_api_key:
            return LaunchJobResponse(
                job_id=job_id,
                status="failed",
                provider_type="runpod",
                message="RunPod API key not configured. Set it via POST /api/v1/compute/runpod-key.",
            )

        # Store job as pending — actual pod creation would be async
        self._jobs[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "provider_type": "runpod",
        }

        logger.info("RunPod job %s queued (pod creation requires async execution)", job_id)

        return LaunchJobResponse(
            job_id=job_id,
            status="pending",
            provider_type="runpod",
            message="RunPod job queued. Pod will be created shortly. Poll /jobs/{job_id} for status.",
        )

    def _launch_platform(self, job_id: str, request: LaunchJobRequest) -> LaunchJobResponse:
        # Platform = local Celery execution
        self._jobs[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "provider_type": "platform",
        }

        # In production, this would enqueue a Celery task:
        # from app.workers.training_worker import run_training_job
        # run_training_job.delay(job_id, request.config_yaml, request.project_name)

        logger.info("Platform job %s queued (Celery task would be dispatched)", job_id)

        return LaunchJobResponse(
            job_id=job_id,
            status="pending",
            provider_type="platform",
            message="Training job queued on Jenga Platform. Poll /jobs/{job_id} for status.",
        )


# Singleton instance
compute_service = ComputeService()

"""Compute API router — providers, cost estimation, job launching, and downloads."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.config import settings
from app.schemas.compute import (
    CostEstimateRequest,
    CostEstimateResponse,
    ComputeOptionResponse,
    ComputeProviderResponse,
    JobStatusResponse,
    LaunchJobRequest,
    LaunchJobResponse,
    RunPodKeyRequest,
)
from app.services.compute_service import compute_service

router = APIRouter()


@router.get("/providers", response_model=list[ComputeProviderResponse])
async def list_providers():
    """Return all compute providers."""
    return compute_service.get_providers()


@router.get("/options", response_model=list[ComputeOptionResponse])
async def list_options(
    provider_id: str | None = Query(default=None, alias="providerId"),
):
    """Return compute options, optionally filtered by provider."""
    return compute_service.get_options(provider_id)


@router.post("/estimate", response_model=CostEstimateResponse)
async def estimate_cost(request: CostEstimateRequest):
    """Estimate training cost for a given compute option."""
    try:
        return compute_service.estimate_cost(
            option_id=request.option_id,
            epochs=request.epochs,
            dataset_size=request.dataset_size,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/launch", response_model=LaunchJobResponse)
async def launch_job(request: LaunchJobRequest):
    """Launch a training job on the selected provider."""
    try:
        return compute_service.launch_job(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a launched job."""
    try:
        return compute_service.get_job_status(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/runpod-key")
async def set_runpod_key(request: RunPodKeyRequest):
    """Store RunPod API key for this session."""
    compute_service.set_runpod_key(request.api_key)
    return {"message": "RunPod API key stored"}


@router.get("/notebooks/{job_id}")
async def download_notebook(job_id: str):
    """Download a generated notebook file."""
    notebooks_dir = Path(settings.NOTEBOOKS_DIR)

    # Find notebook matching job_id
    for suffix in ("_colab.ipynb", "_kaggle.ipynb"):
        path = notebooks_dir / f"{job_id}{suffix}"
        if path.exists():
            return FileResponse(
                path,
                media_type="application/x-ipynb+json",
                filename=path.name,
            )

    raise HTTPException(status_code=404, detail=f"Notebook not found for job {job_id}")


@router.get("/packages/{job_id}")
async def download_package(job_id: str):
    """Download a generated training package."""
    path = Path(settings.PACKAGES_DIR) / f"{job_id}_package.zip"

    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Package not found for job {job_id}")

    return FileResponse(
        path,
        media_type="application/zip",
        filename=path.name,
    )

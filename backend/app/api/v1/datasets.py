"""Dataset API endpoints."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.dataset import (
    DatasetResponse,
    DatasetPreviewResponse,
    LabelDistributionResponse,
    DatasetUpdateRequest,
    MessageResponse,
)
from app.services.dataset_service import DatasetService

logger = logging.getLogger(__name__)

router = APIRouter()


def _to_response(ds) -> DatasetResponse:
    return DatasetResponse(
        id=str(ds.id),
        name=ds.name,
        description=ds.description,
        format=ds.format,
        size=ds.size,
        row_count=ds.row_count,
        column_count=ds.column_count,
        columns=ds.columns or [],
        status=ds.status,
        text_column=ds.text_column,
        label_column=ds.label_column,
        created_at=ds.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if ds.created_at else "",
    )


@router.get("", response_model=list[DatasetResponse])
async def list_datasets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all datasets for the current user."""
    service = DatasetService(db)
    datasets = await service.list_datasets(current_user.id)
    return [_to_response(ds) for ds in datasets]


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific dataset."""
    service = DatasetService(db)
    dataset = await service.get_dataset(dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return _to_response(dataset)


@router.post("", response_model=DatasetResponse, status_code=201)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a new dataset (CSV, JSON, or JSONL)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    service = DatasetService(db)

    try:
        dataset = await service.upload_dataset(
            user_id=current_user.id,
            filename=file.filename,
            content=content,
        )
        return _to_response(dataset)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(
    dataset_id: UUID,
    body: DatasetUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update dataset metadata (name, description, text/label columns)."""
    service = DatasetService(db)
    dataset = await service.update_dataset(
        dataset_id=dataset_id,
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        text_column=body.text_column,
        label_column=body.label_column,
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return _to_response(dataset)


@router.delete("/{dataset_id}", response_model=MessageResponse)
async def delete_dataset(
    dataset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a dataset and its file."""
    service = DatasetService(db)
    deleted = await service.delete_dataset(dataset_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return MessageResponse(message="Dataset deleted")


@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
async def get_preview(
    dataset_id: UUID,
    limit: int = Query(default=50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a preview of the dataset (first N rows)."""
    service = DatasetService(db)
    try:
        preview = await service.get_preview(dataset_id, current_user.id, limit=limit)
        return preview
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{dataset_id}/distribution", response_model=list[LabelDistributionResponse])
async def get_distribution(
    dataset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get label distribution for the dataset."""
    service = DatasetService(db)
    try:
        distribution = await service.get_label_distribution(dataset_id, current_user.id)
        return distribution
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

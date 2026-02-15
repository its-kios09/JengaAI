"""Dataset request/response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DatasetResponse(BaseModel):
    id: str
    name: str
    description: str
    format: str
    size: int
    row_count: int = Field(serialization_alias="rowCount")
    column_count: int = Field(serialization_alias="columnCount")
    columns: list[str]
    status: str
    text_column: Optional[str] = Field(default=None, serialization_alias="textColumn")
    label_column: Optional[str] = Field(default=None, serialization_alias="labelColumn")
    created_at: str = Field(serialization_alias="createdAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class DatasetPreviewResponse(BaseModel):
    headers: list[str]
    rows: list[list[str]]
    total_rows: int = Field(serialization_alias="totalRows")

    model_config = {"populate_by_name": True}


class LabelDistributionResponse(BaseModel):
    label: str
    count: int
    percentage: float


class DatasetUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    text_column: Optional[str] = Field(default=None, alias="textColumn")
    label_column: Optional[str] = Field(default=None, alias="labelColumn")

    model_config = {"populate_by_name": True}


class MessageResponse(BaseModel):
    message: str

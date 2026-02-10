"""Pydantic v2 schemas for the Compute API.

Mirrors frontend types: ComputeProvider, ComputeOption, CostEstimate.
Adds job management types: LaunchJob, JobStatus.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


ComputeProviderType = Literal["platform", "runpod", "colab", "kaggle", "local"]
JobStatusType = Literal["pending", "running", "completed", "failed", "cancelled"]


class ComputeProviderResponse(BaseModel):
    id: str
    name: str
    type: ComputeProviderType
    description: str
    icon: str
    available: bool


class ComputeOptionResponse(BaseModel):
    id: str
    provider_id: str = Field(alias="providerId", serialization_alias="providerId")
    name: str
    gpu: str
    vram: str
    price_per_hour: float = Field(alias="pricePerHour", serialization_alias="pricePerHour")
    available: bool

    model_config = {"populate_by_name": True}


class CostEstimateRequest(BaseModel):
    option_id: str = Field(alias="optionId")
    epochs: int = Field(gt=0)
    dataset_size: int = Field(gt=0, alias="datasetSize")

    model_config = {"populate_by_name": True}


class CostEstimateResponse(BaseModel):
    provider: str
    gpu: str
    estimated_hours: float = Field(serialization_alias="estimatedHours")
    cost_per_hour: float = Field(serialization_alias="costPerHour")
    total_cost: float = Field(serialization_alias="totalCost")


class LaunchJobRequest(BaseModel):
    provider_type: ComputeProviderType = Field(alias="providerType")
    option_id: str = Field(alias="optionId")
    config_yaml: str = Field(alias="configYaml")
    project_name: str = Field(default="jenga_experiment", alias="projectName")

    model_config = {"populate_by_name": True}


class LaunchJobResponse(BaseModel):
    job_id: str = Field(serialization_alias="jobId")
    status: JobStatusType
    provider_type: ComputeProviderType = Field(serialization_alias="providerType")
    message: str
    download_url: Optional[str] = Field(default=None, serialization_alias="downloadUrl")
    notebook_url: Optional[str] = Field(default=None, serialization_alias="notebookUrl")


class JobStatusResponse(BaseModel):
    job_id: str = Field(serialization_alias="jobId")
    status: JobStatusType
    provider_type: ComputeProviderType = Field(serialization_alias="providerType")
    progress: Optional[float] = None
    metrics: Optional[dict[str, float]] = None
    error: Optional[str] = None
    download_url: Optional[str] = Field(default=None, serialization_alias="downloadUrl")


class RunPodKeyRequest(BaseModel):
    api_key: str = Field(alias="apiKey", min_length=1)

    model_config = {"populate_by_name": True}

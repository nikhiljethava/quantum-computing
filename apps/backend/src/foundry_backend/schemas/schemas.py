"""
Pydantic schemas for request/response serialization.
These are completely separate from the ORM models to keep API contracts stable.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from foundry_backend.models.models import IndustryTag, JobStatus, JobType


# ---------------------------------------------------------------------------
# Use Case
# ---------------------------------------------------------------------------


class UseCaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    industry: IndustryTag
    description: str
    quantum_approach: str
    complexity_score: float
    horizon: str
    created_at: datetime


class UseCaseList(BaseModel):
    items: list[UseCaseRead]
    total: int


# ---------------------------------------------------------------------------
# Assessment
# ---------------------------------------------------------------------------


class AssessmentCreate(BaseModel):
    use_case_id: uuid.UUID
    user_inputs: dict[str, Any] = Field(
        ...,
        description="Keyed answers to the QALS-lite questionnaire.",
        examples=[{"data_size": "large", "classical_hardness": "high", "timeline": "2-3 years"}],
    )


class AssessmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    use_case_id: uuid.UUID
    user_inputs: dict[str, Any]
    qals_score: float
    verdict: str
    score_breakdown: dict[str, Any]
    created_at: datetime


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------


class JobCreate(BaseModel):
    job_type: JobType
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description="Circuit-specific parameters. Defaults appropriate per job_type.",
    )


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_type: JobType
    status: JobStatus
    payload: dict[str, Any]
    result: dict[str, Any] | None = None
    error_message: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


# ---------------------------------------------------------------------------
# Architecture
# ---------------------------------------------------------------------------


class ArchitectureRequest(BaseModel):
    job_id: uuid.UUID | None = None
    assessment_id: uuid.UUID | None = None
    use_case_id: uuid.UUID | None = None


# ArchitectureMap and GcpComponent live in foundry-core to avoid circular imports.
# Re-export them here so the backend has a single import path.
from foundry_core.mapping.gcp_mapper import ArchitectureMap as ArchitectureRead  # noqa: E402
from foundry_core.mapping.gcp_mapper import GcpComponent  # noqa: E402, F401

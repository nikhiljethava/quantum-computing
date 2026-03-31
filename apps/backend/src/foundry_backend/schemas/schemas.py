"""Pydantic schemas for the backend API contracts."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from foundry_backend.models.models import ArtifactType, IndustryTag, JobStatus, JobType, ProjectStatus


class UseCaseRead(BaseModel):
    """Read model for a seeded industry use case."""

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
    """Paginated use-case list."""

    items: list[UseCaseRead]
    total: int


class ProjectCreate(BaseModel):
    """Request body for creating a saved workspace project."""

    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    status: ProjectStatus = ProjectStatus.active


class ProjectUpdate(BaseModel):
    """Patch body for updating a project."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: ProjectStatus | None = None


class ProjectRead(BaseModel):
    """Read model for a saved project."""

    id: uuid.UUID
    name: str
    description: str
    status: ProjectStatus
    session_count: int = 0
    created_at: datetime
    updated_at: datetime


class ProjectList(BaseModel):
    """Paginated project list."""

    items: list[ProjectRead]
    total: int


class SessionCreate(BaseModel):
    """Request body for creating a saved workspace session."""

    project_id: uuid.UUID | None = None
    selected_use_case_id: uuid.UUID | None = None
    title: str = Field(min_length=1, max_length=200)
    current_mode: str = "build"
    starter_key: str = Field(default="coin_flip", min_length=1, max_length=50)
    notes: dict[str, Any] = Field(default_factory=dict)
    latest_circuit_run_id: uuid.UUID | None = Field(
        default=None,
        description="Optional circuit run to attach to this session when saving live workspace state.",
    )


class SessionUpdate(BaseModel):
    """Patch body for updating a saved workspace session."""

    project_id: uuid.UUID | None = None
    selected_use_case_id: uuid.UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    current_mode: str | None = None
    starter_key: str | None = Field(default=None, min_length=1, max_length=50)
    notes: dict[str, Any] | None = None
    latest_circuit_run_id: uuid.UUID | None = Field(
        default=None,
        description="Optional circuit run to attach to this session when updating workspace state.",
    )


class SessionRead(BaseModel):
    """Read model for a saved workspace session."""

    id: uuid.UUID
    project_id: uuid.UUID | None = None
    project_name: str | None = None
    selected_use_case_id: uuid.UUID | None = None
    title: str
    current_mode: str
    starter_key: str
    notes: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class SessionList(BaseModel):
    """Paginated session list."""

    items: list[SessionRead]
    total: int


class AssessmentCreate(BaseModel):
    """Request body for a persisted QALS-lite assessment."""

    use_case_id: uuid.UUID
    user_inputs: dict[str, Any] = Field(
        ...,
        description="Keyed answers to the QALS-lite questionnaire.",
        examples=[{"data_size": "large", "classical_hardness": "high", "timeline": "2-3 years"}],
    )


class AssessmentRead(BaseModel):
    """Read model for a persisted QALS-lite assessment."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    use_case_id: uuid.UUID
    user_inputs: dict[str, Any]
    qals_score: float
    verdict: str
    score_breakdown: dict[str, Any]
    created_at: datetime


class JobCreate(BaseModel):
    """Request body for an async worker-backed circuit or export job."""

    job_type: JobType
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description="Job-specific parameters for simulation or export generation.",
    )


class JobRead(BaseModel):
    """Read model for queued or completed jobs."""

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


class CircuitTemplateRead(BaseModel):
    """Metadata for a starter circuit template shown in the Build workspace."""

    key: JobType
    label: str
    badge: str
    concept: str
    prompt: str


class HistogramEntryRead(BaseModel):
    """Measurement histogram entry for UI charts."""

    state: str
    count: int
    probability: float


class AssessmentPreviewRead(BaseModel):
    """Heuristic preview surfaced directly inside the Hybrid Lab."""

    score: int
    verdict: str
    horizon: str
    confidence: str
    explanation: list[str]
    assumptions: list[str]
    public_signals: list[str]
    next_action: str
    score_breakdown: dict[str, Any]


class CircuitRunCreate(BaseModel):
    """Request body for a synchronous Build workspace circuit run."""

    template_key: JobType = Field(description="Starter template to generate and simulate.")
    prompt: str | None = Field(
        default=None,
        description="Optional custom prompt shown back to the user alongside the generated circuit.",
    )
    use_case_id: uuid.UUID | None = Field(
        default=None,
        description="Optional seeded use case to anchor the narrative and QALS-lite preview.",
    )
    session_id: uuid.UUID | None = Field(
        default=None,
        description="Optional saved workspace session identifier.",
    )


class CircuitRunRead(BaseModel):
    """Read model for a synchronous circuit run."""

    id: uuid.UUID
    session_id: uuid.UUID | None = None
    use_case_id: uuid.UUID | None = None
    template_key: JobType
    label: str
    badge: str
    concept: str
    prompt: str
    guide_response: str
    explanation: str
    circuit_text: str
    cirq_code: str
    histogram: list[HistogramEntryRead]
    measurements: dict[str, Any]
    metadata: dict[str, Any]
    assessment_preview: AssessmentPreviewRead
    created_at: datetime


class GcpComponentRead(BaseModel):
    """Serializable GCP architecture component."""

    id: str
    name: str
    service: str
    description: str


class ArchitectureRequest(BaseModel):
    """Request body for rule-based architecture generation."""

    circuit_run_id: uuid.UUID | None = Field(
        default=None,
        description="Persisted circuit run created by the Build workspace.",
    )
    job_id: uuid.UUID | None = Field(
        default=None,
        description="Optional legacy async job identifier for compatibility with worker-based runs.",
    )
    assessment_id: uuid.UUID | None = Field(
        default=None,
        description="Persisted QALS-lite assessment to layer into the architecture context.",
    )
    use_case_id: uuid.UUID | None = Field(
        default=None,
        description="Optional seeded use case to enrich the architecture story.",
    )


class ArchitectureRead(BaseModel):
    """Read model for a persisted or transient architecture map."""

    id: uuid.UUID | None = None
    circuit_run_id: uuid.UUID | None = None
    assessment_id: uuid.UUID | None = None
    use_case_id: uuid.UUID | None = None
    title: str
    summary: str
    components: list[GcpComponentRead]
    connections: list[list[str]]
    notes: list[str]
    created_at: datetime | None = None


class ArtifactCreate(BaseModel):
    """Request body for generating a downloadable artifact."""

    artifact_type: ArtifactType = Field(description="Which export to generate.")
    circuit_run_id: uuid.UUID | None = Field(
        default=None,
        description="Circuit run backing the export bundle.",
    )
    architecture_record_id: uuid.UUID | None = Field(
        default=None,
        description="Optional persisted architecture record for architecture/session exports.",
    )


class ArtifactRead(BaseModel):
    """Read model for stored artifacts."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    artifact_type: ArtifactType
    job_id: uuid.UUID | None = None
    circuit_run_id: uuid.UUID | None = None
    architecture_record_id: uuid.UUID | None = None
    filename: str
    content_type: str
    storage_uri: str
    size_bytes: int
    download_path: str
    created_at: datetime


class SessionDetailRead(SessionRead):
    """Detailed saved-session view with the latest workspace outputs attached."""

    latest_circuit_run: CircuitRunRead | None = None
    latest_architecture: ArchitectureRead | None = None
    artifacts: list[ArtifactRead] = Field(default_factory=list)

"""Pydantic schemas for the backend API contracts."""

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from foundry_backend.models.models import (
    ArtifactType,
    IndustryTag,
    JobStatus,
    JobType,
    ProjectStatus,
)


class UseCaseRead(BaseModel):
    """Read model for a seeded industry use case."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str | None = None
    title: str
    industry: IndustryTag
    description: str
    quantum_approach: str
    complexity_score: float
    horizon: str
    featured: bool = False
    featured_rank: int | None = None
    blueprint: dict[str, Any] = Field(default_factory=dict)
    evidence_items: list[dict[str, str]] = Field(default_factory=list)
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
    """Request body for a persisted QALS 2.0 readiness assessment."""

    use_case_id: uuid.UUID
    user_inputs: dict[str, Any] = Field(
        ...,
        description="Keyed answers to the guided readiness assessment intake.",
        examples=[
            {
                "industry": "energy",
                "objective": "Screen battery cathode material fragments",
                "problemClass": "QUANTUM_SIMULATION",
                "currentClassicalBaseline": "DFT / classical HPC workflow",
                "baselineMetrics": "48 hour batch cycle for a narrowed candidate set",
            }
        ],
    )


class AssessmentUpdate(BaseModel):
    """Patch body for rerunning a persisted assessment with revised inputs."""

    user_inputs: dict[str, Any] = Field(default_factory=dict)


class AssessmentRead(BaseModel):
    """Read model for a persisted QALS 2.0 assessment."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    use_case_id: uuid.UUID
    user_inputs: dict[str, Any]
    qals_score: float
    verdict: str
    score_breakdown: dict[str, Any]
    recommendation: Literal["classical_now", "hybrid_pilot_now", "watchlist", "research_only"]
    readiness_score: int = 0
    confidence: str = "LOW"
    time_horizon: str = "NOW_CLASSICAL"
    trust_labels: list[str] = Field(default_factory=list)
    problem_class: str = "UNKNOWN"
    plain_english_recommendation: str = ""
    classical_baseline_summary: str = ""
    quantum_candidate_summary: str = ""
    evidence_used: list[str] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)
    next_best_action: str = ""
    build_eligibility: str = "LIMITED"
    recommended_experiment_type: str = ""
    hardware_assumptions: list[str] = Field(default_factory=list)
    exportable_memo: str = ""
    why_promising: list[str] = Field(default_factory=list)
    why_not_now: list[str] = Field(default_factory=list)
    top_blockers: list[str] = Field(default_factory=list)
    next_90_days: list[str] = Field(default_factory=list)
    created_at: datetime


class ExperimentBundleCreate(BaseModel):
    """Request body for creating an experiment bundle from an assessment."""

    queue_simulation: bool = Field(
        default=True,
        description="Create a job-like simulation record when the assessment recommends a toy experiment.",
    )


class ExperimentBundleRead(BaseModel):
    """Read model for a serious Build artifact anchored to an assessment."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    assessment_id: uuid.UUID
    simulation_job_id: uuid.UUID | None = None
    title: str
    hypothesis: str
    classical_baseline: str
    quantum_candidate: str
    toy_implementation: dict[str, Any]
    result_trust_metrics: dict[str, Any]
    limitations: list[str] = Field(default_factory=list)
    next_evidence_required: list[str] = Field(default_factory=list)
    gcp_map: dict[str, Any]
    export_artifacts: list[dict[str, Any]] = Field(default_factory=list)
    trust_labels: list[str] = Field(default_factory=list)
    created_at: datetime


class JobCreate(BaseModel):
    """Request body for an async worker-backed circuit or export job."""

    job_type: JobType
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description="Job-specific parameters for simulation or export generation.",
    )


class SimulationJobCreate(BaseModel):
    """Request body for a job-like simulation request tied to an assessment or bundle."""

    assessment_id: uuid.UUID | None = None
    experiment_bundle_id: uuid.UUID | None = None
    job_type: JobType
    payload: dict[str, Any] = Field(default_factory=dict)


class JobRead(BaseModel):
    """Read model for queued or completed jobs."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_type: JobType
    status: JobStatus
    payload: dict[str, Any]
    result: dict[str, Any] | None = None
    logs: list[str] = Field(default_factory=list)
    result_artifact_id: uuid.UUID | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
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


class StateAmplitudeRead(BaseModel):
    """A compact state-vector amplitude preview entry."""

    basis_state: str
    real: float
    imag: float
    magnitude: float
    phase: float
    probability: float


class BasisProbabilityRead(BaseModel):
    """A compact basis probability preview entry."""

    basis_state: str
    probability: float


class StatePreviewRead(BaseModel):
    """State-vector preview returned for small educational circuits."""

    available: bool
    reason: str | None = None
    top_amplitudes: list[StateAmplitudeRead] = Field(default_factory=list)
    basis_probabilities: list[BasisProbabilityRead] = Field(default_factory=list)


class AssessmentPreviewRead(BaseModel):
    """Heuristic preview surfaced directly inside the Hybrid Lab."""

    score: int
    verdict: str
    horizon: str
    confidence: str
    trust_labels: list[str] = Field(default_factory=list)
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
    repetitions: int | None = Field(
        default=None,
        ge=1,
        le=20000,
        description="Optional simulator shot count override.",
    )
    simulator_backend: Literal["cirq", "qsim"] = Field(
        default="cirq",
        description=(
            "Simulator backend preference. qsim falls back to Cirq if qsimcirq "
            "is unavailable."
        ),
    )
    noise_enabled: bool = Field(
        default=False,
        description="When true, return an educational noisy-histogram comparison.",
    )
    noise_level: float = Field(
        default=0.0,
        ge=0.0,
        le=0.25,
        description="Depolarizing noise probability for educational comparison runs.",
    )
    include_state_preview: bool = Field(
        default=True,
        description="When true, return a state-vector preview for small circuits.",
    )


CircuitTone = Literal["primary", "secondary", "accent", "warn", "neutral"]
CircuitNodeType = Literal["gate", "control", "target", "measure", "label"]


class CircuitVisualNodeRead(BaseModel):
    """Serializable circuit node used by the direct-edit canvas."""

    type: CircuitNodeType
    lane: int = Field(ge=0, le=16)
    column: int = Field(ge=0, le=24)
    label: str | None = Field(default=None, max_length=48)
    target_lane: int | None = Field(default=None, ge=0, le=16)
    tone: CircuitTone | None = None

    @field_validator("label")
    @classmethod
    def strip_label(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class GeminiCircuitUpdateRequest(BaseModel):
    """Request body for Gemini-assisted circuit draft updates."""

    api_key: str = Field(
        min_length=16,
        max_length=256,
        description=(
            "User-supplied Gemini API key. The backend uses it ephemerally for this request "
            "and does not persist it."
        ),
    )
    instruction: str = Field(
        min_length=3,
        max_length=1200,
        description="Natural-language instruction describing how the current draft should change.",
    )
    model_name: str = Field(
        default="gemini-2.5-flash",
        min_length=3,
        max_length=80,
        description="Gemini model name to call via generateContent.",
    )
    starter_key: JobType | None = Field(
        default=None,
        description="Current starter template key anchoring the draft circuit story.",
    )
    wires: list[str] = Field(
        min_length=1,
        max_length=8,
        description="Ordered list of wire labels currently rendered in the Build canvas.",
    )
    nodes: list[CircuitVisualNodeRead] = Field(
        min_length=1,
        max_length=48,
        description="Current editable circuit nodes from the Build canvas.",
    )
    prompt: str | None = Field(
        default=None,
        description="Current guide prompt shown in the workspace.",
    )
    guide_response: str | None = Field(
        default=None,
        description="Current guide response shown beside the circuit.",
    )
    explanation: str | None = Field(
        default=None,
        description="Current plain-English explanation shown under the circuit.",
    )
    use_case_title: str | None = Field(
        default=None,
        description="Optional selected use-case title for additional context.",
    )


class GeminiCircuitUpdateResponse(BaseModel):
    """Validated Gemini-assisted draft update returned to the Build canvas."""

    model_name: str
    guide_response: str
    explanation: str
    nodes: list[CircuitVisualNodeRead]


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
    simulator_backend: str = "cirq"
    simulator_warning: str | None = None
    num_qubits: int | None = None
    gate_count: int | None = None
    one_qubit_gate_count: int | None = None
    two_qubit_gate_count: int | None = None
    circuit_depth: int | None = None
    shots: int | None = None
    ideal_vs_noisy: str | None = None
    assumed_noise_model: str | None = None
    hardware_readiness_label: str | None = None
    trust_labels: list[str] = Field(default_factory=list)
    result_caveats: list[str] = Field(default_factory=list)
    measurement_keys: list[str] = Field(default_factory=list)
    ideal_histogram: list[HistogramEntryRead] | None = None
    noisy_histogram: list[HistogramEntryRead] | None = None
    state_preview: StatePreviewRead | None = None
    created_at: datetime


class GcpComponentRead(BaseModel):
    """Serializable Google Cloud architecture component."""

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
    assessment_id: uuid.UUID | None = None
    filename: str
    content_type: str
    storage_uri: str
    size_bytes: int
    download_path: str
    created_at: datetime


class MemoExportRead(BaseModel):
    """Read model returned when an assessment memo export is prepared."""

    job: JobRead
    artifact: ArtifactRead


class SessionDetailRead(SessionRead):
    """Detailed saved-session view with the latest workspace outputs attached."""

    latest_circuit_run: CircuitRunRead | None = None
    latest_architecture: ArchitectureRead | None = None
    artifacts: list[ArtifactRead] = Field(default_factory=list)


class PageUsageCreate(BaseModel):
    """Request body for recording a page view."""

    page_path: str = Field(..., min_length=1, max_length=255)
    visitor_id: str = Field(..., min_length=8, max_length=64)


class PageUsageRead(BaseModel):
    """Read model for a page view."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    page_path: str
    visitor_id: str | None = None
    city: str
    created_at: datetime


class CityUsageSummary(BaseModel):
    """Summary of usage for a specific city."""

    city: str
    count: int


class PageUsageSummary(BaseModel):
    """Aggregated usage data for the last 30 days."""

    total_visits: int
    unique_visitors: int
    window_days: int = 30
    by_city: list[CityUsageSummary]


GuidePageContext = Literal["learn", "build", "explore", "assess", "map", "general"]
GuideSourceType = Literal[
    "app_lesson",
    "app_use_case",
    "google_doc",
    "google_cloud_doc",
    "google_search",
]
GuideActionType = Literal["lesson", "build", "assess", "map", "use_case"]


class GuideAskRequest(BaseModel):
    """Context-aware guide question."""

    question: str = Field(min_length=3, max_length=1400)
    page_context: GuidePageContext = "general"
    lesson_slug: str | None = Field(default=None, max_length=120)
    use_case_id: uuid.UUID | None = None
    circuit_run_id: uuid.UUID | None = None
    architecture_id: uuid.UUID | None = None
    allow_google_search_grounding: bool = False


class GuideSource(BaseModel):
    """Source card returned by the guide."""

    title: str
    url: str | None = None
    source_type: GuideSourceType


class GuideNextAction(BaseModel):
    """In-app next action recommended by the guide."""

    label: str
    href: str
    action_type: GuideActionType


class GuideAskResponse(BaseModel):
    """Guide tutor response."""

    answer: str
    cited_sources: list[GuideSource] = Field(default_factory=list)
    recommended_next_actions: list[GuideNextAction] = Field(default_factory=list)
    safety_notes: list[str] = Field(default_factory=list)

"""
ORM models for the Quantum Foundry.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from foundry_backend.models.base import Base


class IndustryTag(str, enum.Enum):
    pharma = "pharma"
    finance = "finance"
    logistics = "logistics"
    energy = "energy"
    materials = "materials"
    aerospace = "aerospace"
    other = "other"


class ProjectStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    archived = "archived"


class JobStatus(str, enum.Enum):
    pending = "PENDING"
    running = "RUNNING"
    completed = "COMPLETED"
    failed = "FAILED"


class JobType(str, enum.Enum):
    coin_flip = "coin_flip"
    bell_state = "bell_state"
    grover = "grover"
    routing = "routing"
    chemistry = "chemistry"
    session_summary_export = "session_summary_export"


class ArtifactType(str, enum.Enum):
    job_output = "job_output"
    cirq_code = "cirq_code"
    assessment_json = "assessment_json"
    architecture_json = "architecture_json"
    session_summary = "session_summary"


class Project(Base):
    """Top-level saved workspace grouping."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), nullable=False, default=ProjectStatus.draft
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="project", cascade="all, delete-orphan"
    )


class UseCase(Base):
    """
    A seeded industry quantum use case shown in the Explore / Industry Atlas.
    Records are created via seed scripts, not user input.
    """

    __tablename__ = "use_cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    industry: Mapped[IndustryTag] = mapped_column(Enum(IndustryTag), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantum_approach: Mapped[str] = mapped_column(Text, nullable=False)
    complexity_score: Mapped[float] = mapped_column(Float, nullable=False, default=3.0)
    horizon: Mapped[str] = mapped_column(String(20), nullable=False, default="mid-term")
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    featured_rank: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    blueprint: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    evidence_items: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assessments: Mapped[list["Assessment"]] = relationship(
        "Assessment", back_populates="use_case", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="selected_use_case")
    circuit_runs: Mapped[list["CircuitRun"]] = relationship("CircuitRun", back_populates="use_case")
    architecture_records: Mapped[list["ArchitectureRecord"]] = relationship(
        "ArchitectureRecord", back_populates="use_case"
    )


class Session(Base):
    """A saved guided workspace session."""

    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True
    )
    selected_use_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("use_cases.id"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False, default="Untitled Session")
    current_mode: Mapped[str] = mapped_column(String(50), nullable=False, default="learn")
    starter_key: Mapped[str] = mapped_column(String(50), nullable=False, default="coin_flip")
    notes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project: Mapped["Project | None"] = relationship("Project", back_populates="sessions")
    selected_use_case: Mapped["UseCase | None"] = relationship("UseCase", back_populates="sessions")
    circuit_runs: Mapped[list["CircuitRun"]] = relationship("CircuitRun", back_populates="session")


class Assessment(Base):
    """
    Records a user's QALS-lite self-assessment for a given use case.
    QALS = Quantum Applicability and Likelihood Score (local heuristic only).
    """

    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    use_case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("use_cases.id"), nullable=False, index=True
    )
    user_inputs: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    qals_score: Mapped[float] = mapped_column(Float, nullable=False)
    verdict: Mapped[str] = mapped_column(String(50), nullable=False)
    score_breakdown: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    use_case: Mapped["UseCase"] = relationship("UseCase", back_populates="assessments")
    architecture_records: Mapped[list["ArchitectureRecord"]] = relationship(
        "ArchitectureRecord", back_populates="assessment"
    )


class Job(Base):
    """
    Tracks an async circuit simulation job.
    Local development uses a DB-backed poller. Cloud deployments can dispatch the
    same records to a Cloud Tasks-backed worker service.
    """

    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_type: Mapped[JobType] = mapped_column(Enum(JobType), nullable=False, index=True)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus), nullable=False, default=JobStatus.pending, index=True
    )
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    artifacts: Mapped[list["Artifact"]] = relationship(
        "Artifact", back_populates="job", cascade="all, delete-orphan"
    )


class CircuitRun(Base):
    """A synchronous simulator run used by the Build workspace."""

    __tablename__ = "circuit_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True, index=True
    )
    use_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("use_cases.id"), nullable=True, index=True
    )
    template_key: Mapped[JobType] = mapped_column(Enum(JobType), nullable=False, index=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    guide_response: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    circuit_text: Mapped[str] = mapped_column(Text, nullable=False)
    cirq_code: Mapped[str] = mapped_column(Text, nullable=False)
    histogram: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    measurements: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    run_metadata: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    assessment_preview: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped["Session | None"] = relationship("Session", back_populates="circuit_runs")
    use_case: Mapped["UseCase | None"] = relationship("UseCase", back_populates="circuit_runs")
    architecture_records: Mapped[list["ArchitectureRecord"]] = relationship(
        "ArchitectureRecord", back_populates="circuit_run", cascade="all, delete-orphan"
    )
    artifacts: Mapped[list["Artifact"]] = relationship("Artifact", back_populates="circuit_run")


class ArchitectureRecord(Base):
    """Persisted GCP architecture snapshot associated with a circuit run or assessment."""

    __tablename__ = "architecture_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circuit_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("circuit_runs.id"), nullable=True, index=True
    )
    use_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("use_cases.id"), nullable=True, index=True
    )
    assessment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    components: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    connections: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    notes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    circuit_run: Mapped["CircuitRun | None"] = relationship(
        "CircuitRun", back_populates="architecture_records"
    )
    use_case: Mapped["UseCase | None"] = relationship("UseCase", back_populates="architecture_records")
    assessment: Mapped["Assessment | None"] = relationship(
        "Assessment", back_populates="architecture_records"
    )
    artifacts: Mapped[list["Artifact"]] = relationship(
        "Artifact", back_populates="architecture_record"
    )


class Artifact(Base):
    """
    Tracks a file artifact (e.g. circuit export, session summary, worker output).
    The storage_uri points to a local path or GCS URI depending on the storage backend.
    """

    __tablename__ = "artifacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True, index=True
    )
    circuit_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("circuit_runs.id"), nullable=True, index=True
    )
    architecture_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("architecture_records.id"), nullable=True, index=True
    )
    artifact_type: Mapped[ArtifactType] = mapped_column(
        Enum(ArtifactType), nullable=False, default=ArtifactType.job_output, index=True
    )
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_uri: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    job: Mapped["Job | None"] = relationship("Job", back_populates="artifacts")
    circuit_run: Mapped["CircuitRun | None"] = relationship("CircuitRun", back_populates="artifacts")
    architecture_record: Mapped["ArchitectureRecord | None"] = relationship(
        "ArchitectureRecord", back_populates="artifacts"
    )


class PageUsage(Base):
    """
    Tracks page loads and user location for analytics.
    """

    __tablename__ = "page_usages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_path: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    visitor_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

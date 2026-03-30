"""
ORM models for the Quantum Foundry.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from foundry_backend.models.base import Base


# ---------------------------------------------------------------------------
# Use Case — seeded industry examples
# ---------------------------------------------------------------------------


class IndustryTag(str, enum.Enum):
    pharma = "pharma"
    finance = "finance"
    logistics = "logistics"
    energy = "energy"
    materials = "materials"
    aerospace = "aerospace"
    other = "other"


class UseCase(Base):
    """
    A seeded industry quantum use case shown in the Explore / Industry Atlas.
    Records are created via seed scripts, not user input.
    """

    __tablename__ = "use_cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    industry: Mapped[IndustryTag] = mapped_column(Enum(IndustryTag), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantum_approach: Mapped[str] = mapped_column(Text, nullable=False)
    # 1–5: rough estimate of implementation complexity (used for display only)
    complexity_score: Mapped[float] = mapped_column(Float, nullable=False, default=3.0)
    # Maturity horizon: "near-term" | "mid-term" | "long-term"
    horizon: Mapped[str] = mapped_column(String(20), nullable=False, default="mid-term")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assessments: Mapped[list["Assessment"]] = relationship(
        "Assessment", back_populates="use_case", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Assessment — QALS-lite scoring
# ---------------------------------------------------------------------------


class Assessment(Base):
    """
    Records a user's QALS-lite self-assessment for a given use case.
    QALS = Quantum Applicability and Likelihood Score (local heuristic only).
    """

    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    use_case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("use_cases.id"), nullable=False, index=True
    )
    # Raw user inputs stored as JSON for flexibility
    user_inputs: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Final QALS-lite score 0.0–1.0
    qals_score: Mapped[float] = mapped_column(Float, nullable=False)
    # Human-readable verdict string produced by the heuristic
    verdict: Mapped[str] = mapped_column(String(50), nullable=False)
    # JSON blob of sub-dimension scores for display breakdown
    score_breakdown: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    use_case: Mapped["UseCase"] = relationship("UseCase", back_populates="assessments")


# ---------------------------------------------------------------------------
# Job — async simulation execution tracking
# ---------------------------------------------------------------------------


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


class Job(Base):
    """
    Tracks an async circuit simulation job.
    The worker polls this table (DB-backed queue) to pick up PENDING jobs.
    TODO(gcp-deploy): replace polling with Cloud Tasks push or Pub/Sub subscription.
    """

    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_type: Mapped[JobType] = mapped_column(Enum(JobType), nullable=False, index=True)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus), nullable=False, default=JobStatus.pending, index=True
    )
    # Input parameters for the circuit (varies by job_type)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Simulation result stored as JSON once completed
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Error message if failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    artifacts: Mapped[list["Artifact"]] = relationship(
        "Artifact", back_populates="job", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Artifact — file/blob tracking for exports
# ---------------------------------------------------------------------------


class Artifact(Base):
    """
    Tracks a file artifact (e.g. circuit diagram, JSON export) produced by a Job.
    The storage_uri points to a local path or GCS URI depending on the storage backend.
    """

    __tablename__ = "artifacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # Local path or GCS URI — resolved by storage abstraction layer
    storage_uri: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    job: Mapped["Job"] = relationship("Job", back_populates="artifacts")

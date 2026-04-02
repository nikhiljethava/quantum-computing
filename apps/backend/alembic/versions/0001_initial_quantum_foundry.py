"""Initial Quantum Foundry schema.

Revision ID: 0001_initial_quantum_foundry
Revises:
Create Date: 2026-03-29 12:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001_initial_quantum_foundry"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


industry_tag = postgresql.ENUM(
    "pharma",
    "finance",
    "logistics",
    "energy",
    "materials",
    "aerospace",
    "other",
    name="industrytag",
    create_type=False,
)
project_status = postgresql.ENUM(
    "draft",
    "active",
    "archived",
    name="projectstatus",
    create_type=False,
)
job_status = postgresql.ENUM(
    "PENDING",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    name="jobstatus",
    create_type=False,
)
job_type = postgresql.ENUM(
    "coin_flip",
    "bell_state",
    "grover",
    "routing",
    "chemistry",
    name="jobtype",
    create_type=False,
)


def upgrade() -> None:
    """Create the initial application schema."""

    bind = op.get_bind()
    industry_tag.create(bind, checkfirst=True)
    project_status.create(bind, checkfirst=True)
    job_status.create(bind, checkfirst=True)
    job_type.create(bind, checkfirst=True)

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", project_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "use_cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("industry", industry_tag, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantum_approach", sa.Text(), nullable=False),
        sa.Column("complexity_score", sa.Float(), nullable=False),
        sa.Column("horizon", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_use_cases_industry"), "use_cases", ["industry"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("selected_use_case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("current_mode", sa.String(length=50), nullable=False),
        sa.Column("starter_key", sa.String(length=50), nullable=False),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["selected_use_case_id"], ["use_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sessions_project_id"), "sessions", ["project_id"], unique=False)
    op.create_index(op.f("ix_sessions_selected_use_case_id"), "sessions", ["selected_use_case_id"], unique=False)

    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("use_case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_inputs", sa.JSON(), nullable=False),
        sa.Column("qals_score", sa.Float(), nullable=False),
        sa.Column("verdict", sa.String(length=50), nullable=False),
        sa.Column("score_breakdown", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["use_case_id"], ["use_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assessments_use_case_id"), "assessments", ["use_case_id"], unique=False)

    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_type", job_type, nullable=False),
        sa.Column("status", job_status, nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_jobs_job_type"), "jobs", ["job_type"], unique=False)
    op.create_index(op.f("ix_jobs_status"), "jobs", ["status"], unique=False)

    op.create_table(
        "circuit_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("use_case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("template_key", job_type, nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("guide_response", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("circuit_text", sa.Text(), nullable=False),
        sa.Column("cirq_code", sa.Text(), nullable=False),
        sa.Column("histogram", sa.JSON(), nullable=False),
        sa.Column("measurements", sa.JSON(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("assessment_preview", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"]),
        sa.ForeignKeyConstraint(["use_case_id"], ["use_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_circuit_runs_session_id"), "circuit_runs", ["session_id"], unique=False)
    op.create_index(op.f("ix_circuit_runs_template_key"), "circuit_runs", ["template_key"], unique=False)
    op.create_index(op.f("ix_circuit_runs_use_case_id"), "circuit_runs", ["use_case_id"], unique=False)

    op.create_table(
        "architecture_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("circuit_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("use_case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("components", sa.JSON(), nullable=False),
        sa.Column("connections", sa.JSON(), nullable=False),
        sa.Column("notes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"]),
        sa.ForeignKeyConstraint(["circuit_run_id"], ["circuit_runs.id"]),
        sa.ForeignKeyConstraint(["use_case_id"], ["use_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_architecture_records_assessment_id"),
        "architecture_records",
        ["assessment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_architecture_records_circuit_run_id"),
        "architecture_records",
        ["circuit_run_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_architecture_records_use_case_id"),
        "architecture_records",
        ["use_case_id"],
        unique=False,
    )

    op.create_table(
        "artifacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(length=300), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("storage_uri", sa.Text(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_artifacts_job_id"), "artifacts", ["job_id"], unique=False)


def downgrade() -> None:
    """Drop the application schema."""

    op.drop_index(op.f("ix_artifacts_job_id"), table_name="artifacts")
    op.drop_table("artifacts")

    op.drop_index(op.f("ix_architecture_records_use_case_id"), table_name="architecture_records")
    op.drop_index(op.f("ix_architecture_records_circuit_run_id"), table_name="architecture_records")
    op.drop_index(op.f("ix_architecture_records_assessment_id"), table_name="architecture_records")
    op.drop_table("architecture_records")

    op.drop_index(op.f("ix_circuit_runs_use_case_id"), table_name="circuit_runs")
    op.drop_index(op.f("ix_circuit_runs_template_key"), table_name="circuit_runs")
    op.drop_index(op.f("ix_circuit_runs_session_id"), table_name="circuit_runs")
    op.drop_table("circuit_runs")

    op.drop_index(op.f("ix_jobs_status"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_job_type"), table_name="jobs")
    op.drop_table("jobs")

    op.drop_index(op.f("ix_assessments_use_case_id"), table_name="assessments")
    op.drop_table("assessments")

    op.drop_index(op.f("ix_sessions_selected_use_case_id"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_project_id"), table_name="sessions")
    op.drop_table("sessions")

    op.drop_index(op.f("ix_use_cases_industry"), table_name="use_cases")
    op.drop_table("use_cases")

    op.drop_table("projects")

    bind = op.get_bind()
    job_type.drop(bind, checkfirst=True)
    job_status.drop(bind, checkfirst=True)
    project_status.drop(bind, checkfirst=True)
    industry_tag.drop(bind, checkfirst=True)

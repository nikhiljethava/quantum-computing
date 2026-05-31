"""Add QALS 2.0 opportunity workbench records.

Revision ID: 0009_qals_2_workbench
Revises: 0008_add_use_case_slugs
Create Date: 2026-05-28 12:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0009_qals_2_workbench"
down_revision: str | None = "0008_add_use_case_slugs"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Add enterprise assessment, bundle, job, and memo export metadata."""

    op.execute("ALTER TYPE jobtype ADD VALUE IF NOT EXISTS 'opportunity_memo_export'")
    op.execute("ALTER TYPE artifacttype ADD VALUE IF NOT EXISTS 'opportunity_memo'")

    op.add_column("assessments", sa.Column("problem_class", sa.String(length=50), nullable=True))
    op.add_column("assessments", sa.Column("readiness_score", sa.Integer(), nullable=True))
    op.add_column("assessments", sa.Column("confidence", sa.String(length=20), nullable=True))
    op.add_column("assessments", sa.Column("time_horizon", sa.String(length=50), nullable=True))
    op.add_column("assessments", sa.Column("trust_labels", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("assessments", sa.Column("qals_output", sa.JSON(), nullable=False, server_default="{}"))
    op.add_column("assessments", sa.Column("build_eligibility", sa.String(length=30), nullable=True))
    op.add_column("assessments", sa.Column("exportable_memo", sa.Text(), nullable=True))
    op.create_index(op.f("ix_assessments_problem_class"), "assessments", ["problem_class"], unique=False)
    op.create_index(
        op.f("ix_assessments_build_eligibility"),
        "assessments",
        ["build_eligibility"],
        unique=False,
    )
    op.alter_column("assessments", "trust_labels", server_default=None)
    op.alter_column("assessments", "qals_output", server_default=None)

    op.add_column("jobs", sa.Column("logs", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("jobs", sa.Column("result_artifact_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.alter_column("jobs", "logs", server_default=None)

    op.add_column("artifacts", sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f("ix_artifacts_assessment_id"), "artifacts", ["assessment_id"], unique=False)
    op.create_foreign_key(
        "fk_artifacts_assessment_id_assessments",
        "artifacts",
        "assessments",
        ["assessment_id"],
        ["id"],
    )

    op.create_table(
        "experiment_bundles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("simulation_job_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("hypothesis", sa.Text(), nullable=False),
        sa.Column("classical_baseline", sa.Text(), nullable=False),
        sa.Column("quantum_candidate", sa.Text(), nullable=False),
        sa.Column("toy_implementation", sa.JSON(), nullable=False),
        sa.Column("result_trust_metrics", sa.JSON(), nullable=False),
        sa.Column("limitations", sa.JSON(), nullable=False),
        sa.Column("next_evidence_required", sa.JSON(), nullable=False),
        sa.Column("gcp_map", sa.JSON(), nullable=False),
        sa.Column("export_artifacts", sa.JSON(), nullable=False),
        sa.Column("trust_labels", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"]),
        sa.ForeignKeyConstraint(["simulation_job_id"], ["jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_experiment_bundles_assessment_id"),
        "experiment_bundles",
        ["assessment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_experiment_bundles_simulation_job_id"),
        "experiment_bundles",
        ["simulation_job_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove QALS 2.0 workbench metadata."""

    op.drop_index(op.f("ix_experiment_bundles_simulation_job_id"), table_name="experiment_bundles")
    op.drop_index(op.f("ix_experiment_bundles_assessment_id"), table_name="experiment_bundles")
    op.drop_table("experiment_bundles")

    op.drop_constraint("fk_artifacts_assessment_id_assessments", "artifacts", type_="foreignkey")
    op.drop_index(op.f("ix_artifacts_assessment_id"), table_name="artifacts")
    op.drop_column("artifacts", "assessment_id")

    op.drop_column("jobs", "updated_at")
    op.drop_column("jobs", "result_artifact_id")
    op.drop_column("jobs", "logs")

    op.drop_index(op.f("ix_assessments_build_eligibility"), table_name="assessments")
    op.drop_index(op.f("ix_assessments_problem_class"), table_name="assessments")
    op.drop_column("assessments", "exportable_memo")
    op.drop_column("assessments", "build_eligibility")
    op.drop_column("assessments", "qals_output")
    op.drop_column("assessments", "trust_labels")
    op.drop_column("assessments", "time_horizon")
    op.drop_column("assessments", "confidence")
    op.drop_column("assessments", "readiness_score")
    op.drop_column("assessments", "problem_class")

    # PostgreSQL enum value removal is intentionally omitted; old migrations in this repo
    # use rebuilds for removals, but keeping added enum values is safer for downgrade dev loops.

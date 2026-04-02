"""Extend artifacts for export bundle support.

Revision ID: 0002_artifact_exports
Revises: 0001_initial_quantum_foundry
Create Date: 2026-03-29 13:30:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_artifact_exports"
down_revision: str | None = "0001_initial_quantum_foundry"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


artifact_type = postgresql.ENUM(
    "job_output",
    "cirq_code",
    "assessment_json",
    "architecture_json",
    "session_summary",
    name="artifacttype",
    create_type=False,
)


def upgrade() -> None:
    """Add export-oriented links and type metadata to artifacts."""

    bind = op.get_bind()
    artifact_type.create(bind, checkfirst=True)

    op.add_column(
        "artifacts",
        sa.Column("circuit_run_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "artifacts",
        sa.Column("architecture_record_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "artifacts",
        sa.Column(
            "artifact_type",
            artifact_type,
            nullable=False,
            server_default="job_output",
        ),
    )

    op.alter_column("artifacts", "job_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)

    op.create_index(op.f("ix_artifacts_artifact_type"), "artifacts", ["artifact_type"], unique=False)
    op.create_index(op.f("ix_artifacts_circuit_run_id"), "artifacts", ["circuit_run_id"], unique=False)
    op.create_index(
        op.f("ix_artifacts_architecture_record_id"),
        "artifacts",
        ["architecture_record_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_artifacts_circuit_run_id_circuit_runs",
        "artifacts",
        "circuit_runs",
        ["circuit_run_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_artifacts_architecture_record_id_architecture_records",
        "artifacts",
        "architecture_records",
        ["architecture_record_id"],
        ["id"],
    )

    op.alter_column("artifacts", "artifact_type", server_default=None)


def downgrade() -> None:
    """Remove export-oriented artifact metadata."""

    op.drop_constraint(
        "fk_artifacts_architecture_record_id_architecture_records",
        "artifacts",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_artifacts_circuit_run_id_circuit_runs",
        "artifacts",
        type_="foreignkey",
    )

    op.drop_index(op.f("ix_artifacts_architecture_record_id"), table_name="artifacts")
    op.drop_index(op.f("ix_artifacts_circuit_run_id"), table_name="artifacts")
    op.drop_index(op.f("ix_artifacts_artifact_type"), table_name="artifacts")

    op.alter_column("artifacts", "job_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.drop_column("artifacts", "artifact_type")
    op.drop_column("artifacts", "architecture_record_id")
    op.drop_column("artifacts", "circuit_run_id")

    bind = op.get_bind()
    artifact_type.drop(bind, checkfirst=True)

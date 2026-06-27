"""Add Algorithm Contract workbench records.

Revision ID: 0010_algorithm_contract_workbench
Revises: 0009_qals_2_workbench
Create Date: 2026-06-27 12:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0010_algorithm_contract_workbench"
down_revision: str | None = "0009_qals_2_workbench"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Persist Algorithm Contracts and attach bundles to contracts."""

    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TYPE artifacttype ADD VALUE IF NOT EXISTS 'algorithm_brief'")
        op.execute("ALTER TYPE artifacttype ADD VALUE IF NOT EXISTS 'pqc_migration_memo'")

    op.alter_column(
        "assessments",
        "build_eligibility",
        existing_type=sa.String(length=30),
        type_=sa.String(length=50),
        existing_nullable=True,
    )

    op.add_column(
        "assessments",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "algorithm_contracts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contract_type", sa.String(length=50), nullable=False),
        sa.Column("algorithm_family", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("validity_status", sa.String(length=30), nullable=False),
        sa.Column("mathematical_object", sa.Text(), nullable=False),
        sa.Column("reduction_summary", sa.Text(), nullable=False),
        sa.Column("required_inputs", sa.JSON(), nullable=False),
        sa.Column("provided_inputs", sa.JSON(), nullable=False),
        sa.Column("missing_inputs", sa.JSON(), nullable=False),
        sa.Column("assumptions", sa.JSON(), nullable=False),
        sa.Column("caveats", sa.JSON(), nullable=False),
        sa.Column("classical_baseline", sa.Text(), nullable=False),
        sa.Column("benchmark_plan", sa.Text(), nullable=False),
        sa.Column("resource_estimate", sa.JSON(), nullable=False),
        sa.Column("trust_labels", sa.JSON(), nullable=False),
        sa.Column("build_eligibility", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_algorithm_contracts_assessment_id"),
        "algorithm_contracts",
        ["assessment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_algorithm_contracts_algorithm_family"),
        "algorithm_contracts",
        ["algorithm_family"],
        unique=False,
    )
    op.create_index(
        op.f("ix_algorithm_contracts_build_eligibility"),
        "algorithm_contracts",
        ["build_eligibility"],
        unique=False,
    )
    op.create_index(
        op.f("ix_algorithm_contracts_contract_type"),
        "algorithm_contracts",
        ["contract_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_algorithm_contracts_validity_status"),
        "algorithm_contracts",
        ["validity_status"],
        unique=False,
    )

    op.add_column("experiment_bundles", sa.Column("contract_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(
        op.f("ix_experiment_bundles_contract_id"),
        "experiment_bundles",
        ["contract_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_experiment_bundles_contract_id_algorithm_contracts",
        "experiment_bundles",
        "algorithm_contracts",
        ["contract_id"],
        ["id"],
    )


def downgrade() -> None:
    """Remove Algorithm Contract workbench records."""

    op.drop_constraint(
        "fk_experiment_bundles_contract_id_algorithm_contracts",
        "experiment_bundles",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_experiment_bundles_contract_id"), table_name="experiment_bundles")
    op.drop_column("experiment_bundles", "contract_id")

    op.alter_column(
        "assessments",
        "build_eligibility",
        existing_type=sa.String(length=50),
        type_=sa.String(length=30),
        existing_nullable=True,
    )

    op.drop_index(op.f("ix_algorithm_contracts_validity_status"), table_name="algorithm_contracts")
    op.drop_index(op.f("ix_algorithm_contracts_contract_type"), table_name="algorithm_contracts")
    op.drop_index(op.f("ix_algorithm_contracts_build_eligibility"), table_name="algorithm_contracts")
    op.drop_index(op.f("ix_algorithm_contracts_algorithm_family"), table_name="algorithm_contracts")
    op.drop_index(op.f("ix_algorithm_contracts_assessment_id"), table_name="algorithm_contracts")
    op.drop_table("algorithm_contracts")

    op.drop_column("assessments", "updated_at")

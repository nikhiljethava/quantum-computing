"""Add contract-specific architecture trust context.

Revision ID: 0011_phase0_result_trust_maps
Revises: 0010_algorithm_contract_workbench
Create Date: 2026-08-26 12:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0011_phase0_result_trust_maps"
down_revision: str | None = "0010_algorithm_contract_workbench"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Persist Algorithm Contract classification and result trust on maps."""

    op.add_column(
        "architecture_records",
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "architecture_records",
        sa.Column("problem_class", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "architecture_records",
        sa.Column("contract_type", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "architecture_records",
        sa.Column("trust_context", sa.JSON(), server_default="{}", nullable=False),
    )
    op.create_index(
        op.f("ix_architecture_records_contract_id"),
        "architecture_records",
        ["contract_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_architecture_records_problem_class"),
        "architecture_records",
        ["problem_class"],
        unique=False,
    )
    op.create_index(
        op.f("ix_architecture_records_contract_type"),
        "architecture_records",
        ["contract_type"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_architecture_records_contract_id_algorithm_contracts",
        "architecture_records",
        "algorithm_contracts",
        ["contract_id"],
        ["id"],
    )
    op.alter_column("architecture_records", "trust_context", server_default=None)

    op.add_column(
        "artifacts",
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "artifacts",
        sa.Column("trust_context", sa.JSON(), server_default="{}", nullable=False),
    )
    op.create_index(
        op.f("ix_artifacts_contract_id"),
        "artifacts",
        ["contract_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_artifacts_contract_id_algorithm_contracts",
        "artifacts",
        "algorithm_contracts",
        ["contract_id"],
        ["id"],
    )
    op.alter_column("artifacts", "trust_context", server_default=None)


def downgrade() -> None:
    """Remove contract-specific architecture trust context."""

    op.drop_constraint(
        "fk_artifacts_contract_id_algorithm_contracts",
        "artifacts",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_artifacts_contract_id"), table_name="artifacts")
    op.drop_column("artifacts", "trust_context")
    op.drop_column("artifacts", "contract_id")
    op.drop_constraint(
        "fk_architecture_records_contract_id_algorithm_contracts",
        "architecture_records",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_architecture_records_contract_type"), table_name="architecture_records")
    op.drop_index(op.f("ix_architecture_records_problem_class"), table_name="architecture_records")
    op.drop_index(op.f("ix_architecture_records_contract_id"), table_name="architecture_records")
    op.drop_column("architecture_records", "trust_context")
    op.drop_column("architecture_records", "contract_type")
    op.drop_column("architecture_records", "problem_class")
    op.drop_column("architecture_records", "contract_id")

"""Add featured Explore metadata to use cases.

Revision ID: 0006_add_featured_use_case_fields
Revises: 0005_add_visitor_id_to_page_usage
Create Date: 2026-04-18 13:30:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0006_add_featured_use_case_fields"
down_revision: str | None = "0005_add_visitor_id_to_page_usage"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Add featured scenario metadata to use cases."""

    op.add_column(
        "use_cases",
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "use_cases",
        sa.Column("featured_rank", sa.Integer(), nullable=True),
    )
    op.add_column(
        "use_cases",
        sa.Column(
            "blueprint",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'::json"),
        ),
    )
    op.add_column(
        "use_cases",
        sa.Column(
            "evidence_items",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
    )
    op.create_index(op.f("ix_use_cases_featured"), "use_cases", ["featured"], unique=False)
    op.create_index(op.f("ix_use_cases_featured_rank"), "use_cases", ["featured_rank"], unique=False)


def downgrade() -> None:
    """Remove featured scenario metadata from use cases."""

    op.drop_index(op.f("ix_use_cases_featured_rank"), table_name="use_cases")
    op.drop_index(op.f("ix_use_cases_featured"), table_name="use_cases")
    op.drop_column("use_cases", "evidence_items")
    op.drop_column("use_cases", "blueprint")
    op.drop_column("use_cases", "featured_rank")
    op.drop_column("use_cases", "featured")

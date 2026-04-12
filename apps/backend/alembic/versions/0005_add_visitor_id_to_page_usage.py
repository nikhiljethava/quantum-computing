"""Add visitor_id to page usage rows.

Revision ID: 0005_add_visitor_id_to_page_usage
Revises: 0004_add_page_usage
Create Date: 2026-04-11 18:30:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0005_add_visitor_id_to_page_usage"
down_revision: str | None = "0004_add_page_usage"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Add visitor tracking to page usage rows."""

    op.add_column("page_usages", sa.Column("visitor_id", sa.String(length=64), nullable=True))
    op.create_index(
        op.f("ix_page_usages_visitor_id"),
        "page_usages",
        ["visitor_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove visitor tracking from page usage rows."""

    op.drop_index(op.f("ix_page_usages_visitor_id"), table_name="page_usages")
    op.drop_column("page_usages", "visitor_id")

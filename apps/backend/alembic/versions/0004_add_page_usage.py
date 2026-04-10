"""Add page usage tracking table.

Revision ID: 0004_add_page_usage
Revises: 0003_summary_export_job
Create Date: 2026-04-10 18:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0004_add_page_usage"
down_revision: str | None = "0003_summary_export_job"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create page_usages table."""
    op.create_table(
        "page_usages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("page_path", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_page_usages_page_path"),
        "page_usages",
        ["page_path"],
        unique=False,
    )
    op.create_index(
        op.f("ix_page_usages_created_at"),
        "page_usages",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    """Drop page_usages table."""
    op.drop_index(op.f("ix_page_usages_created_at"), table_name="page_usages")
    op.drop_index(op.f("ix_page_usages_page_path"), table_name="page_usages")
    op.drop_table("page_usages")

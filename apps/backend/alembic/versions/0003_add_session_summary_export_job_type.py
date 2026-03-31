"""Add worker-backed session summary export job type.

Revision ID: 0003_add_session_summary_export_job_type
Revises: 0002_extend_artifacts_for_exports
Create Date: 2026-03-31 10:30:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003_add_session_summary_export_job_type"
down_revision: str | None = "0002_extend_artifacts_for_exports"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


new_job_type = sa.Enum(
    "coin_flip",
    "bell_state",
    "grover",
    "routing",
    "chemistry",
    "session_summary_export",
    name="jobtype",
)

old_job_type = sa.Enum(
    "coin_flip",
    "bell_state",
    "grover",
    "routing",
    "chemistry",
    name="jobtype",
)


def upgrade() -> None:
    """Add the session summary export worker job type to the shared enum."""

    op.execute("ALTER TYPE jobtype ADD VALUE IF NOT EXISTS 'session_summary_export'")


def downgrade() -> None:
    """Remove the session summary export worker job type from the shared enum."""

    op.execute("DELETE FROM jobs WHERE job_type = 'session_summary_export'")
    op.execute("ALTER TYPE jobtype RENAME TO jobtype_old")

    bind = op.get_bind()
    old_job_type.create(bind, checkfirst=False)

    op.execute(
        "ALTER TABLE jobs ALTER COLUMN job_type TYPE jobtype USING job_type::text::jobtype"
    )
    op.execute(
        "ALTER TABLE circuit_runs ALTER COLUMN template_key TYPE jobtype USING template_key::text::jobtype"
    )

    op.execute("DROP TYPE jobtype_old")

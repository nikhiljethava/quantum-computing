"""Add Colab notebook artifact type.

Revision ID: 0007_colab_notebook_artifact
Revises: 0006_add_featured_use_case_fields
Create Date: 2026-05-03 14:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0007_colab_notebook_artifact"
down_revision: str | None = "0006_add_featured_use_case_fields"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


old_artifact_type = sa.Enum(
    "job_output",
    "cirq_code",
    "assessment_json",
    "architecture_json",
    "session_summary",
    name="artifacttype",
)


def upgrade() -> None:
    """Add the downloadable Colab notebook artifact type."""

    op.execute("ALTER TYPE artifacttype ADD VALUE IF NOT EXISTS 'colab_notebook'")


def downgrade() -> None:
    """Remove the Colab notebook artifact type."""

    op.execute("DELETE FROM artifacts WHERE artifact_type = 'colab_notebook'")
    op.execute("ALTER TYPE artifacttype RENAME TO artifacttype_old")

    bind = op.get_bind()
    old_artifact_type.create(bind, checkfirst=False)

    op.execute(
        "ALTER TABLE artifacts ALTER COLUMN artifact_type TYPE artifacttype "
        "USING artifact_type::text::artifacttype"
    )
    op.execute("DROP TYPE artifacttype_old")

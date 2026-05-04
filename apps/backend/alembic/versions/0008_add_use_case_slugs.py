"""Add stable public slugs to use cases.

Revision ID: 0008_add_use_case_slugs
Revises: 0007_colab_notebook_artifact
Create Date: 2026-05-03 18:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0008_add_use_case_slugs"
down_revision: str | None = "0007_colab_notebook_artifact"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


TITLE_SLUGS = {
    "Portfolio Optimization": "portfolio-optimization",
    "Credit Risk Simulation (Monte Carlo)": "credit-risk-simulation-monte-carlo",
    "Molecular Docking & Drug Design": "molecular-docking-drug-design",
    "Genomics Sequence Alignment": "genomics-sequence-alignment",
    "Vehicle Routing Optimization": "vehicle-routing-optimization",
    "Supply Chain Network Design": "supply-chain-network-design",
    "Power Grid Scheduling": "power-grid-scheduling",
    "Battery Material Discovery": "battery-material-discovery",
    "Aerodynamic Simulation": "aerodynamic-simulation",
    "Satellite Orbit Scheduling": "satellite-orbit-scheduling",
    "Catalyst Design for Green Chemistry": "catalyst-design",
}


def upgrade() -> None:
    """Add nullable slugs, backfill known seeded rows, and index them."""

    op.add_column("use_cases", sa.Column("slug", sa.String(length=240), nullable=True))
    for title, slug in TITLE_SLUGS.items():
        op.execute(
            sa.text("UPDATE use_cases SET slug = :slug WHERE title = :title AND slug IS NULL")
            .bindparams(title=title, slug=slug)
        )
    op.create_index(op.f("ix_use_cases_slug"), "use_cases", ["slug"], unique=True)


def downgrade() -> None:
    """Remove public use-case slugs."""

    op.drop_index(op.f("ix_use_cases_slug"), table_name="use_cases")
    op.drop_column("use_cases", "slug")

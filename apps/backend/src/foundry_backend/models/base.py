"""
SQLAlchemy declarative base — shared by all models.
Import this module in main.py (or wherever your lifespan runs)
to ensure all models are registered before Alembic sees them.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass

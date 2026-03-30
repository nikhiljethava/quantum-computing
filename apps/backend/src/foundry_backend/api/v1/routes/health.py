"""Health routes for local development and container probes."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.core.config import settings
from foundry_backend.db.session import get_db

router = APIRouter()


@router.get("", summary="API liveness check")
async def api_health() -> dict[str, str]:
    """Return a lightweight liveness payload."""
    return {
        "status": "ok",
        "service": "backend",
        "environment": settings.environment,
    }


@router.get("/ready", summary="API readiness check")
async def api_ready(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Verify the database is reachable for the current process."""
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "reachable"}

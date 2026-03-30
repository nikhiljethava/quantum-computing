"""
GCP Quantum Foundry — Backend
FastAPI application entry point.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from foundry_backend.api.v1 import router as api_v1_router
from foundry_backend.core.config import settings
from foundry_backend.db.session import engine
from foundry_backend.models import base  # noqa: F401 — ensures models are registered


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown hooks."""
    # NOTE: In production, migrations run via Alembic before deploy.
    # For local dev convenience we do NOT auto-run migrations here;
    # run `alembic upgrade head` manually or via Makefile.
    yield
    await engine.dispose()


app = FastAPI(
    title="GCP Quantum Foundry API",
    description="Backend API for the GCP Quantum Foundry — an interactive quantum launchpad.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Lightweight liveness probe."""
    return {
        "status": "ok",
        "service": "backend",
        "environment": settings.environment,
    }

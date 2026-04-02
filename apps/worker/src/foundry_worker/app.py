"""HTTP task runner for Cloud Run worker deployments."""

from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from foundry_backend.models.models import JobStatus
from foundry_worker.main import SessionLocal, engine, process_job_by_id

logger = logging.getLogger(__name__)


class TaskAck(BaseModel):
    """Small response body for Cloud Tasks / Cloud Run task executions."""

    job_id: uuid.UUID
    status: str
    detail: str | None = None
    result: dict[str, Any] | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    yield
    await engine.dispose()


app = FastAPI(
    title="GCP Quantum Foundry Worker",
    description="Cloud Run task execution surface for worker-backed circuit and export jobs.",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "worker"}


@app.post("/tasks/jobs/{job_id}", response_model=TaskAck, tags=["tasks"])
async def run_job(job_id: uuid.UUID) -> TaskAck:
    """Execute a single persisted job row."""

    async with SessionLocal() as db:
        try:
            job = await process_job_by_id(db, job_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except Exception as exc:  # pragma: no cover - defensive guard for task responses
            logger.exception("Worker task failed for %s", job_id)
            raise HTTPException(status_code=500, detail="Worker execution failed.") from exc

    detail = None
    if job.status == JobStatus.failed:
        detail = job.error_message or "Worker execution failed."
        raise HTTPException(status_code=500, detail=detail)

    return TaskAck(
        job_id=job.id,
        status=job.status.value,
        detail=detail,
        result=job.result,
    )

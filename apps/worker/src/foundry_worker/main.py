"""
Worker main loop — polls the PostgreSQL DB for PENDING jobs, runs circuits, saves results.

This is the DB-backed queue implementation for local development.
TODO(gcp-deploy): replace this polling loop with a Cloud Tasks push handler
                  (HTTP endpoint that receives a task payload and calls _execute_job).
"""

import asyncio
import dataclasses
import json
import logging
import os
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from foundry_core.circuits import CIRCUIT_REGISTRY, CircuitResult
from foundry_core.storage import get_storage_backend

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration from environment
# ---------------------------------------------------------------------------
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://foundry:foundry_dev_password@localhost:5432/foundry",
)
STORAGE_BACKEND = os.environ.get("STORAGE_BACKEND", "local")
ARTIFACT_DIR = os.environ.get("ARTIFACT_DIR", "./artifacts")
POLL_INTERVAL = float(os.environ.get("POLL_INTERVAL_SECONDS", "2"))

# ---------------------------------------------------------------------------
# DB setup (worker has its own engine — separate from the backend)
# ---------------------------------------------------------------------------
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

storage = get_storage_backend(backend=STORAGE_BACKEND, artifact_dir=ARTIFACT_DIR)


# ---------------------------------------------------------------------------
# Job executor
# ---------------------------------------------------------------------------


async def _execute_job(job_id: str, job_type: str, payload: dict) -> dict:
    """
    Run the circuit simulation for the given job_type and return a result dict.
    All results are JSON-serializable.
    """
    factory = CIRCUIT_REGISTRY.get(job_type)
    if not factory:
        raise ValueError(f"Unknown job_type: {job_type!r}. Available: {list(CIRCUIT_REGISTRY)}")

    # Pass supported payload keys to the factory
    supported = {
        "coin_flip": ["repetitions"],
        "bell_state": ["repetitions"],
        "grover": ["num_qubits", "marked_state", "repetitions"],
        "routing": ["num_cities", "repetitions"],
        "chemistry": ["repetitions"],
    }
    filtered_payload = {k: v for k, v in payload.items() if k in supported.get(job_type, [])}

    circuit_result: CircuitResult = factory(**filtered_payload)

    # Persist circuit text as an artifact
    circuit_bytes = circuit_result.circuit_text.encode()
    artifact_uri = await storage.save(
        content=circuit_bytes,
        filename=f"{job_id}_circuit.txt",
        content_type="text/plain",
    )

    return {
        "circuit_text": circuit_result.circuit_text,
        "histogram": circuit_result.histogram,
        "metadata": circuit_result.metadata,
        "artifact_uri": artifact_uri,
    }


# ---------------------------------------------------------------------------
# Polling loop
# ---------------------------------------------------------------------------


async def poll_once(db: AsyncSession) -> int:
    """
    Pick up PENDING jobs, mark them RUNNING, execute, mark COMPLETED or FAILED.
    Returns the number of jobs processed.
    """
    # Import models here to avoid loading ORM before engine is ready
    from foundry_backend.models.models import Job, JobStatus  # type: ignore[import]

    stmt = (
        select(Job)
        .where(Job.status == JobStatus.pending)
        .order_by(Job.created_at)
        .limit(5)
        .with_for_update(skip_locked=True)
    )
    rows = (await db.execute(stmt)).scalars().all()

    for job in rows:
        job.status = JobStatus.running
        job.started_at = datetime.now(tz=timezone.utc)
        await db.commit()

        try:
            result = await _execute_job(str(job.id), job.job_type.value, job.payload)
            job.result = result
            job.status = JobStatus.completed
            logger.info("Job %s completed (%s)", job.id, job.job_type.value)
        except Exception as exc:
            job.status = JobStatus.failed
            job.error_message = str(exc)
            logger.exception("Job %s failed: %s", job.id, exc)
        finally:
            job.completed_at = datetime.now(tz=timezone.utc)
            await db.commit()

    return len(rows)


async def run_worker() -> None:
    """Main worker loop — polls DB at POLL_INTERVAL seconds."""
    logger.info("Worker started. Poll interval: %ss", POLL_INTERVAL)
    while True:
        try:
            async with SessionLocal() as db:
                processed = await poll_once(db)
                if processed:
                    logger.info("Processed %d job(s).", processed)
        except Exception:
            logger.exception("Worker poll iteration failed — will retry.")
        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    asyncio.run(run_worker())

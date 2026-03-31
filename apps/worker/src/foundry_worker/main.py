"""
Worker main loop — polls the PostgreSQL DB for PENDING jobs, runs circuits, saves results.

This is the DB-backed queue implementation for local development.
TODO(gcp-deploy): replace this polling loop with a Cloud Tasks push handler
                  (HTTP endpoint that receives a task payload and calls _execute_job).
"""

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from foundry_backend.models.models import ArtifactType, JobType
from foundry_backend.services.artifacts import create_export_artifact, serialize_artifact
from foundry_core.storage import get_storage_backend
from foundry_backend.services.hybrid_lab import create_architecture_record, create_circuit_run

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


SUPPORTED_PARAMETERS = {
    "coin_flip": ["repetitions"],
    "bell_state": ["repetitions"],
    "grover": ["num_qubits", "marked_state", "repetitions"],
    "routing": ["num_cities", "repetitions"],
    "chemistry": ["repetitions"],
}


def _safe_uuid(value: object, field_name: str) -> uuid.UUID | None:
    """Parse an optional UUID payload field."""

    if value in (None, ""):
        return None
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except ValueError as exc:
        raise ValueError(f"Invalid {field_name}: {value}") from exc


async def _execute_export_job(db: AsyncSession, *, job_id: str, payload: dict) -> dict:
    """Generate a worker-backed export artifact and return its metadata."""

    # Import models here to avoid eager ORM initialization during module import.
    from foundry_backend.models.models import ArchitectureRecord, CircuitRun, UseCase  # type: ignore[import]

    circuit_run_id = _safe_uuid(payload.get("circuit_run_id"), "circuit_run_id")
    if circuit_run_id is None:
        raise ValueError("circuit_run_id is required for session_summary_export jobs.")

    circuit_run = await db.get(CircuitRun, circuit_run_id)
    if circuit_run is None:
        raise ValueError(f"CircuitRun {circuit_run_id} not found.")

    architecture_record = None
    architecture_record_id = _safe_uuid(payload.get("architecture_record_id"), "architecture_record_id")
    if architecture_record_id is not None:
        architecture_record = await db.get(ArchitectureRecord, architecture_record_id)
        if architecture_record is None:
            raise ValueError(f"ArchitectureRecord {architecture_record_id} not found.")
    else:
        stmt = (
            select(ArchitectureRecord)
            .where(ArchitectureRecord.circuit_run_id == circuit_run.id)
            .order_by(ArchitectureRecord.created_at.desc())
            .limit(1)
        )
        architecture_record = (await db.execute(stmt)).scalar_one_or_none()

    use_case = await db.get(UseCase, circuit_run.use_case_id) if circuit_run.use_case_id else None
    artifact = await create_export_artifact(
        db,
        artifact_type=ArtifactType.session_summary,
        circuit_run=circuit_run,
        architecture_record=architecture_record,
        use_case=use_case,
        job_id=uuid.UUID(job_id),
    )
    serialized = serialize_artifact(artifact)
    return {
        "artifact_id": str(serialized["id"]),
        "artifact_type": serialized["artifact_type"].value,
        "filename": serialized["filename"],
        "download_path": serialized["download_path"],
        "content_type": serialized["content_type"],
        "size_bytes": serialized["size_bytes"],
        "created_at": serialized["created_at"].isoformat(),
    }


async def _execute_circuit_job(db: AsyncSession, *, job_id: str, job_type: str, payload: dict) -> dict:
    """Run the async simulation job and return JSON-safe result metadata."""

    # Import models here to avoid eager ORM initialization during module import.
    from foundry_backend.models.models import Session, UseCase  # type: ignore[import]

    try:
        template_key = JobType(job_type)
    except ValueError as exc:
        raise ValueError(f"Unknown job_type: {job_type!r}.") from exc

    use_case_id = _safe_uuid(payload.get("use_case_id"), "use_case_id")
    session_id = _safe_uuid(payload.get("session_id"), "session_id")

    use_case = None
    if use_case_id is not None:
        use_case = await db.get(UseCase, use_case_id)
        if use_case is None:
            raise ValueError(f"UseCase {use_case_id} not found.")

    if session_id is not None:
        session = await db.get(Session, session_id)
        if session is None:
            raise ValueError(f"Session {session_id} not found.")

    parameter_overrides = {
        key: value for key, value in payload.items() if key in SUPPORTED_PARAMETERS.get(job_type, [])
    }
    prompt = payload.get("prompt")
    if prompt is not None and not isinstance(prompt, str):
        raise ValueError("prompt must be a string when provided.")

    run = await create_circuit_run(
        db=db,
        template_key=template_key,
        prompt=prompt,
        use_case=use_case,
        session_id=session_id,
        parameter_overrides=parameter_overrides,
    )
    architecture_record = await create_architecture_record(
        db,
        circuit_run=run,
        use_case=use_case,
    )

    circuit_bytes = run.circuit_text.encode()
    artifact_uri = await storage.save(
        content=circuit_bytes,
        filename=f"{job_id}_circuit.txt",
        content_type="text/plain",
    )

    return {
        "circuit_run_id": str(run.id),
        "use_case_id": str(run.use_case_id) if run.use_case_id else None,
        "session_id": str(run.session_id) if run.session_id else None,
        "histogram": run.histogram,
        "metadata": run.run_metadata,
        "job_output_artifact_uri": artifact_uri,
        "job_output_size": len(circuit_bytes),
        "architecture": {
            "id": str(architecture_record.id),
            "circuit_run_id": str(architecture_record.circuit_run_id)
            if architecture_record.circuit_run_id
            else None,
            "assessment_id": str(architecture_record.assessment_id)
            if architecture_record.assessment_id
            else None,
            "use_case_id": str(architecture_record.use_case_id)
            if architecture_record.use_case_id
            else None,
            "title": architecture_record.title,
            "summary": architecture_record.summary,
            "components": architecture_record.components,
            "connections": architecture_record.connections,
            "notes": architecture_record.notes,
            "created_at": architecture_record.created_at.isoformat()
            if architecture_record.created_at
            else None,
        },
    }


async def _execute_job(db: AsyncSession, *, job_id: str, job_type: str, payload: dict) -> dict:
    """Dispatch a worker job and return JSON-safe result metadata."""

    if job_type == JobType.session_summary_export.value:
        return await _execute_export_job(db, job_id=job_id, payload=payload)

    return await _execute_circuit_job(db, job_id=job_id, job_type=job_type, payload=payload)


# ---------------------------------------------------------------------------
# Polling loop
# ---------------------------------------------------------------------------


async def poll_once(db: AsyncSession) -> int:
    """
    Pick up PENDING jobs, mark them RUNNING, execute, mark COMPLETED or FAILED.
    Returns the number of jobs processed.
    """
    # Import models here to avoid loading ORM before engine is ready
    from foundry_backend.models.models import Artifact, ArtifactType, Job, JobStatus  # type: ignore[import]

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
            result = await _execute_job(db, job_id=str(job.id), job_type=job.job_type.value, payload=job.payload)
            job.result = result
            if result.get("job_output_artifact_uri"):
                artifact = Artifact(
                    job_id=job.id,
                    artifact_type=ArtifactType.job_output,
                    filename=f"{job.id}_circuit.txt",
                    content_type="text/plain",
                    storage_uri=str(result["job_output_artifact_uri"]),
                    size_bytes=int(result.get("job_output_size", 0)),
                )
                db.add(artifact)
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

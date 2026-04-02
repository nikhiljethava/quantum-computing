"""Jobs route for worker-backed simulations and export generation."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.core.config import settings
from foundry_backend.db.session import get_db
from foundry_backend.models.models import Job, JobStatus, JobType
from foundry_backend.schemas.schemas import JobCreate, JobRead
from foundry_core.jobs import get_job_backend

router = APIRouter()


@router.post("", response_model=JobRead, status_code=202)
async def submit_job(
    body: JobCreate,
    db: AsyncSession = Depends(get_db),
) -> JobRead:
    """
    Submit a new worker-backed job.
    Returns 202 Accepted immediately. Poll GET /jobs/{id} for status.
    """
    if body.job_type == JobType.session_summary_export and not body.payload.get("circuit_run_id"):
        raise HTTPException(
            status_code=400,
            detail="session_summary_export jobs require circuit_run_id in payload.",
        )

    job = Job(job_type=body.job_type, payload=body.payload)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    backend = get_job_backend(
        backend=settings.job_backend,
        project_id=settings.cloud_tasks_project_id,
        location=settings.cloud_tasks_location,
        queue=settings.cloud_tasks_queue,
        worker_url=settings.cloud_tasks_worker_url,
        service_account_email=settings.cloud_tasks_service_account_email,
        audience=settings.cloud_tasks_audience,
    )
    try:
        await backend.dispatch(
            job_id=str(job.id),
            job_type=job.job_type.value,
            payload=job.payload,
        )
    except Exception as exc:
        job.status = JobStatus.failed
        job.error_message = f"Dispatch failed: {exc}"
        await db.commit()
        raise HTTPException(
            status_code=502,
            detail="Unable to dispatch the requested job to the configured execution backend.",
        ) from exc

    return JobRead.model_validate(job)


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> JobRead:
    """Poll for job status and result."""
    row = await db.get(Job, job_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    return JobRead.model_validate(row)


@router.get("", response_model=list[JobRead])
async def list_jobs(
    status: JobStatus | None = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> list[JobRead]:
    """List recent jobs, optionally filtered by status."""
    stmt = select(Job).order_by(Job.created_at.desc()).limit(limit)
    if status:
        stmt = stmt.where(Job.status == status)
    rows = (await db.execute(stmt)).scalars().all()
    return [JobRead.model_validate(r) for r in rows]

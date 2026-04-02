"""Artifact routes for export generation and download."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.core.config import settings
from foundry_backend.db.session import get_db
from foundry_backend.models.models import ArchitectureRecord, Artifact, ArtifactType, CircuitRun, UseCase
from foundry_backend.schemas.schemas import ArtifactCreate, ArtifactRead
from foundry_backend.services.artifacts import create_export_artifact, serialize_artifact
from foundry_core.storage import get_storage_backend

router = APIRouter()


@router.post(
    "",
    response_model=ArtifactRead,
    status_code=201,
    summary="Generate an export artifact",
    description=(
        "Create a downloadable export for the Build workspace, including Cirq code, "
        "assessment JSON, architecture JSON, or a markdown session summary."
    ),
)
async def create_artifact(
    body: ArtifactCreate,
    db: AsyncSession = Depends(get_db),
) -> ArtifactRead:
    """Generate and persist an export artifact."""

    if body.artifact_type == ArtifactType.job_output:
        raise HTTPException(status_code=400, detail="job_output artifacts are created by the worker.")

    if not body.circuit_run_id:
        raise HTTPException(status_code=400, detail="circuit_run_id is required for export generation.")

    circuit_run = await db.get(CircuitRun, body.circuit_run_id)
    if not circuit_run:
        raise HTTPException(status_code=404, detail=f"CircuitRun {body.circuit_run_id} not found.")

    architecture_record = None
    if body.architecture_record_id:
        architecture_record = await db.get(ArchitectureRecord, body.architecture_record_id)
        if not architecture_record:
            raise HTTPException(
                status_code=404,
                detail=f"ArchitectureRecord {body.architecture_record_id} not found.",
            )
    elif body.artifact_type in {ArtifactType.architecture_json, ArtifactType.session_summary}:
        stmt = (
            select(ArchitectureRecord)
            .where(ArchitectureRecord.circuit_run_id == circuit_run.id)
            .order_by(ArchitectureRecord.created_at.desc())
            .limit(1)
        )
        architecture_record = (await db.execute(stmt)).scalar_one_or_none()
        if architecture_record is None and body.artifact_type == ArtifactType.architecture_json:
            raise HTTPException(
                status_code=400,
                detail="architecture_json export requires a persisted architecture record.",
            )

    use_case = await db.get(UseCase, circuit_run.use_case_id) if circuit_run.use_case_id else None

    artifact = await create_export_artifact(
        db,
        artifact_type=body.artifact_type,
        circuit_run=circuit_run,
        architecture_record=architecture_record,
        use_case=use_case,
    )
    return ArtifactRead.model_validate(serialize_artifact(artifact))


@router.get(
    "",
    response_model=list[ArtifactRead],
    summary="List stored artifacts",
    description="List recent artifacts, optionally filtered by circuit run or job.",
)
async def list_artifacts(
    circuit_run_id: uuid.UUID | None = None,
    job_id: uuid.UUID | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> list[ArtifactRead]:
    """List stored artifact metadata."""

    stmt = select(Artifact).order_by(Artifact.created_at.desc()).limit(limit)
    if circuit_run_id:
        stmt = stmt.where(Artifact.circuit_run_id == circuit_run_id)
    if job_id:
        stmt = stmt.where(Artifact.job_id == job_id)

    rows = (await db.execute(stmt)).scalars().all()
    return [ArtifactRead.model_validate(serialize_artifact(row)) for row in rows]


@router.get(
    "/{artifact_id}",
    response_model=ArtifactRead,
    summary="Fetch artifact metadata",
    description="Return metadata for a single stored artifact.",
)
async def get_artifact(
    artifact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ArtifactRead:
    """Fetch a stored artifact by ID."""

    artifact = await db.get(Artifact, artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found.")
    return ArtifactRead.model_validate(serialize_artifact(artifact))


@router.get(
    "/{artifact_id}/download",
    summary="Download artifact bytes",
    description="Stream a stored artifact back to the browser using the configured storage backend.",
)
async def download_artifact(
    artifact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Download a stored artifact."""

    artifact = await db.get(Artifact, artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found.")

    storage = get_storage_backend(
        backend=settings.storage_backend,
        artifact_dir=settings.artifact_dir,
        gcs_bucket=settings.gcs_bucket,
    )
    content = await storage.load(artifact.storage_uri)

    headers = {
        "Content-Disposition": f'attachment; filename="{artifact.filename}"',
    }
    return Response(content=content, media_type=artifact.content_type, headers=headers)

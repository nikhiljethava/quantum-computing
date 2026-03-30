"""Architecture mapper routes for the Build workspace and legacy async jobs."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Assessment, CircuitRun, Job, JobStatus, UseCase
from foundry_backend.schemas.schemas import ArchitectureRead, ArchitectureRequest
from foundry_backend.services.hybrid_lab import (
    architecture_from_context,
    create_architecture_record,
    serialize_architecture_record,
)

router = APIRouter()


@router.post(
    "",
    response_model=ArchitectureRead,
    summary="Generate a rule-based GCP architecture map",
    description=(
        "Create a simulator-first hybrid architecture story from a circuit run, assessment, "
        "use case, or legacy async job. Circuit-run requests are persisted for later export."
    ),
)
async def get_architecture(
    body: ArchitectureRequest,
    db: AsyncSession = Depends(get_db),
) -> ArchitectureRead:
    """Generate a GCP hybrid architecture map for the current workspace context."""

    if body.circuit_run_id:
        circuit_run = await db.get(CircuitRun, body.circuit_run_id)
        if not circuit_run:
            raise HTTPException(status_code=404, detail=f"CircuitRun {body.circuit_run_id} not found.")

        use_case = None
        if body.use_case_id:
            use_case = await db.get(UseCase, body.use_case_id)
            if not use_case:
                raise HTTPException(status_code=404, detail=f"UseCase {body.use_case_id} not found.")
        elif circuit_run.use_case_id:
            use_case = await db.get(UseCase, circuit_run.use_case_id)

        record = await create_architecture_record(
            db,
            circuit_run=circuit_run,
            assessment_id=body.assessment_id,
            use_case=use_case,
        )
        return ArchitectureRead.model_validate(serialize_architecture_record(record))

    context: dict[str, object] = {}

    if body.job_id:
        job = await db.get(Job, body.job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {body.job_id} not found.")
        if job.status != JobStatus.completed:
            raise HTTPException(status_code=400, detail="Job must be COMPLETED before mapping.")
        context["job_type"] = job.job_type.value
        context["job_result"] = job.result or {}

    if body.assessment_id:
        assessment = await db.get(Assessment, body.assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail=f"Assessment {body.assessment_id} not found.")
        context["qals_score"] = assessment.qals_score
        context["verdict"] = assessment.verdict

    if body.use_case_id:
        use_case = await db.get(UseCase, body.use_case_id)
        if not use_case:
            raise HTTPException(status_code=404, detail=f"UseCase {body.use_case_id} not found.")
        context["industry"] = use_case.industry.value
        context["complexity"] = use_case.complexity_score

    if not context:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: circuit_run_id, job_id, assessment_id, use_case_id.",
        )

    architecture = architecture_from_context(context)
    return ArchitectureRead(
        title=architecture.title,
        summary=architecture.summary,
        components=architecture.components,
        connections=[list(connection) for connection in architecture.connections],
        notes=architecture.notes,
        assessment_id=body.assessment_id,
        use_case_id=body.use_case_id,
    )

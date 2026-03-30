"""
Architecture Mapper route — generates a GCP hybrid architecture diagram
description from a completed job or assessment.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Assessment, Job, JobStatus, UseCase
from foundry_backend.schemas.schemas import ArchitectureRead, ArchitectureRequest
from foundry_core.mapping.gcp_mapper import build_architecture_map

router = APIRouter()


@router.post("", response_model=ArchitectureRead)
async def get_architecture(
    body: ArchitectureRequest,
    db: AsyncSession = Depends(get_db),
) -> ArchitectureRead:
    """
    Generate a GCP hybrid architecture map.
    Accepts a job_id (from a completed simulation) or an assessment_id / use_case_id.
    """
    context: dict = {}

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
            status_code=400, detail="Provide at least one of: job_id, assessment_id, use_case_id."
        )

    arch = build_architecture_map(context)
    return arch

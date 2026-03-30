"""
Assessments route — accepts user inputs, runs QALS-lite heuristic, persists result.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Assessment, UseCase
from foundry_backend.schemas.schemas import AssessmentCreate, AssessmentRead
from foundry_core.assessment.heuristic import run_qals_lite

router = APIRouter()


@router.post("", response_model=AssessmentRead, status_code=201)
async def create_assessment(
    body: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
) -> AssessmentRead:
    """
    Run the QALS-lite heuristic against user inputs and persist the result.
    QALS-lite is a transparent readiness score — NOT a claim of true quantum advantage.
    """
    use_case = await db.get(UseCase, body.use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail=f"UseCase {body.use_case_id} not found.")

    qals_result = run_qals_lite(user_inputs=body.user_inputs, use_case_complexity=use_case.complexity_score)

    assessment = Assessment(
        use_case_id=body.use_case_id,
        user_inputs=body.user_inputs,
        qals_score=qals_result.score,
        verdict=qals_result.verdict,
        score_breakdown=qals_result.breakdown,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return AssessmentRead.model_validate(assessment)

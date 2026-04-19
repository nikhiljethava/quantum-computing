"""
Assessments route — accepts user inputs, runs QALS-lite heuristic, persists result.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Assessment, UseCase
from foundry_backend.schemas.schemas import AssessmentCreate, AssessmentRead
from foundry_core.assessment.heuristic import run_assessment

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

    assessment_result = run_assessment(
        user_inputs=body.user_inputs,
        use_case_complexity=use_case.complexity_score,
        use_case_horizon=use_case.horizon,
        use_case_blueprint=use_case.blueprint,
        use_case_evidence_items=use_case.evidence_items,
    )

    assessment = Assessment(
        use_case_id=body.use_case_id,
        user_inputs=body.user_inputs,
        qals_score=assessment_result.qals_score,
        verdict=assessment_result.verdict,
        score_breakdown=assessment_result.score_breakdown,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return AssessmentRead(
        id=assessment.id,
        use_case_id=assessment.use_case_id,
        user_inputs=assessment.user_inputs,
        qals_score=assessment.qals_score,
        verdict=assessment.verdict,
        score_breakdown=assessment.score_breakdown,
        recommendation=assessment_result.recommendation,
        why_promising=assessment_result.why_promising,
        why_not_now=assessment_result.why_not_now,
        top_blockers=assessment_result.top_blockers,
        next_90_days=assessment_result.next_90_days,
        created_at=assessment.created_at,
    )

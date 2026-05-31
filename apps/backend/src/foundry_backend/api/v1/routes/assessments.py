"""Assessment routes for the QALS 2.0 opportunity workbench."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Assessment, Job, JobStatus, JobType, UseCase
from foundry_backend.schemas.schemas import (
    AssessmentCreate,
    AssessmentRead,
    AssessmentUpdate,
    ExperimentBundleCreate,
    ExperimentBundleRead,
    ArtifactRead,
    JobRead,
    MemoExportRead,
)
from foundry_backend.services.artifacts import (
    create_assessment_memo_artifact,
    serialize_artifact,
)
from foundry_backend.services.opportunity import (
    apply_qals_to_assessment,
    create_experiment_bundle,
    run_qals_for_use_case,
    serialize_assessment,
    serialize_experiment_bundle,
)

router = APIRouter()


async def _get_assessment_or_404(db: AsyncSession, assessment_id: uuid.UUID) -> Assessment:
    assessment = await db.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found.")
    return assessment


@router.post("", response_model=AssessmentRead, status_code=201)
async def create_assessment(
    body: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
) -> AssessmentRead:
    """
    Run QALS 2.0 against user inputs and persist the evidence-backed verdict.

    The readiness score is secondary to verdict, confidence, time horizon, evidence,
    missing evidence, assumptions, caveats, and trust labels.
    """
    use_case = await db.get(UseCase, body.use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail=f"UseCase {body.use_case_id} not found.")

    assessment_id = uuid.uuid4()
    qals_output = run_qals_for_use_case(
        use_case=use_case,
        user_inputs=body.user_inputs,
        assessment_id=assessment_id,
    )
    assessment = Assessment(
        id=assessment_id,
        use_case_id=body.use_case_id,
        user_inputs=body.user_inputs,
        qals_score=0.0,
        verdict=qals_output["verdict"],
        score_breakdown={},
    )
    apply_qals_to_assessment(assessment=assessment, qals_output=qals_output)

    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return AssessmentRead.model_validate(serialize_assessment(assessment))


@router.get("/{assessment_id}", response_model=AssessmentRead)
async def get_assessment(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AssessmentRead:
    """Fetch a persisted readiness assessment."""

    assessment = await _get_assessment_or_404(db, assessment_id)
    return AssessmentRead.model_validate(serialize_assessment(assessment))


@router.patch("/{assessment_id}", response_model=AssessmentRead)
async def update_assessment(
    assessment_id: uuid.UUID,
    body: AssessmentUpdate,
    db: AsyncSession = Depends(get_db),
) -> AssessmentRead:
    """Merge revised intake fields and rerun QALS 2.0 deterministically."""

    assessment = await _get_assessment_or_404(db, assessment_id)
    use_case = await db.get(UseCase, assessment.use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail=f"UseCase {assessment.use_case_id} not found.")

    next_inputs = {**assessment.user_inputs, **body.user_inputs}
    qals_output = run_qals_for_use_case(
        use_case=use_case,
        user_inputs=next_inputs,
        assessment_id=assessment.id,
    )
    assessment.user_inputs = next_inputs
    apply_qals_to_assessment(assessment=assessment, qals_output=qals_output)
    await db.commit()
    await db.refresh(assessment)
    return AssessmentRead.model_validate(serialize_assessment(assessment))


@router.post(
    "/{assessment_id}/experiment-bundles",
    response_model=ExperimentBundleRead,
    status_code=201,
)
async def create_assessment_experiment_bundle(
    assessment_id: uuid.UUID,
    body: ExperimentBundleCreate,
    db: AsyncSession = Depends(get_db),
) -> ExperimentBundleRead:
    """Create an Experiment Bundle only after a persisted assessment exists."""

    assessment = await _get_assessment_or_404(db, assessment_id)
    try:
        bundle = await create_experiment_bundle(
            db,
            assessment=assessment,
            queue_simulation=body.queue_simulation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return ExperimentBundleRead.model_validate(serialize_experiment_bundle(bundle))


@router.post("/{assessment_id}/export-memo", response_model=MemoExportRead, status_code=202)
async def export_assessment_memo(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MemoExportRead:
    """Represent Quantum Opportunity Memo export as a completed job plus artifact."""

    assessment = await _get_assessment_or_404(db, assessment_id)
    job = Job(
        job_type=JobType.opportunity_memo_export,
        status=JobStatus.running,
        payload={"assessment_id": str(assessment.id)},
        logs=["Preparing Quantum Opportunity Memo export."],
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    try:
        artifact = await create_assessment_memo_artifact(db, assessment=assessment, job_id=job.id)
    except ValueError as exc:
        job.status = JobStatus.failed
        job.error_message = str(exc)
        await db.commit()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    job.status = JobStatus.completed
    job.result_artifact_id = artifact.id
    job.result = {
        "artifact_id": str(artifact.id),
        "filename": artifact.filename,
        "download_path": f"/api/v1/artifacts/{artifact.id}/download",
    }
    job.logs = [*job.logs, "Quantum Opportunity Memo export succeeded."]
    await db.commit()
    await db.refresh(job)
    await db.refresh(artifact)

    return MemoExportRead(
        job=JobRead.model_validate(job),
        artifact=ArtifactRead.model_validate(serialize_artifact(artifact)),
    )

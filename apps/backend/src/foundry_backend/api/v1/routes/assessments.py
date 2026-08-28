"""Assessment routes for the QALS 3.0 Algorithm Contract workbench."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Assessment, Job, JobStatus, JobType, UseCase
from foundry_backend.schemas.schemas import (
    AssessmentCreate,
    AssessmentRead,
    AssessmentUpdate,
    AlgorithmContractRead,
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
    create_algorithm_contract,
    create_experiment_bundle,
    run_qals_for_use_case,
    serialize_algorithm_contract,
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
    Run QALS 3.0 against user inputs and persist the Algorithm Contract verdict.

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
    """Merge revised intake fields and rerun QALS 3.0 deterministically."""

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
    "/{assessment_id}/contracts",
    response_model=AlgorithmContractRead,
    status_code=201,
)
async def create_assessment_contract(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AlgorithmContractRead:
    """Create the recommended Algorithm Contract from a persisted assessment."""

    assessment = await _get_assessment_or_404(db, assessment_id)
    contract = await create_algorithm_contract(db, assessment=assessment)
    return AlgorithmContractRead.model_validate(serialize_algorithm_contract(contract))


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
    """Create an Algorithm Contract-backed Experiment Bundle from a persisted assessment."""

    assessment = await _get_assessment_or_404(db, assessment_id)
    try:
        contract = await create_algorithm_contract(db, assessment=assessment)
        bundle = await create_experiment_bundle(
            db,
            assessment=assessment,
            contract=contract,
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
    """Represent Quantum Algorithm Brief or PQC Migration Memo export as a completed job."""

    assessment = await _get_assessment_or_404(db, assessment_id)
    contract = await create_algorithm_contract(db, assessment=assessment)
    contract_type = str(assessment.qals_output.get("recommended_contract_type", ""))
    export_label = "PQC Migration Memo" if contract_type == "PQC_RISK" else "Quantum Algorithm Brief"
    job = Job(
        job_type=JobType.opportunity_memo_export,
        status=JobStatus.running,
        payload={
            "assessment_id": str(assessment.id),
            "contract_id": str(contract.id),
        },
        logs=[f"Preparing {export_label} export."],
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    try:
        artifact = await create_assessment_memo_artifact(
            db,
            assessment=assessment,
            contract=contract,
            job_id=job.id,
        )
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
    job.logs = [*job.logs, f"{export_label} export succeeded."]
    await db.commit()
    await db.refresh(job)
    await db.refresh(artifact)

    return MemoExportRead(
        job=JobRead.model_validate(job),
        artifact=ArtifactRead.model_validate(serialize_artifact(artifact)),
    )


@router.post("/{assessment_id}/export-brief", response_model=MemoExportRead, status_code=202)
async def export_assessment_brief(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MemoExportRead:
    """Export the Quantum Algorithm Brief or PQC Migration Memo for an assessment."""

    return await export_assessment_memo(assessment_id=assessment_id, db=db)

"""Architecture mapper routes for the Build workspace and legacy async jobs."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import (
    AlgorithmContract,
    Assessment,
    CircuitRun,
    Job,
    JobStatus,
    UseCase,
)
from foundry_backend.schemas.schemas import ArchitectureRead, ArchitectureRequest
from foundry_backend.services.hybrid_lab import (
    architecture_from_context,
    create_architecture_record,
    serialize_architecture_record,
)
from foundry_backend.services.result_trust import architecture_result_trust

router = APIRouter()


@router.post(
    "",
    response_model=ArchitectureRead,
    summary="Generate a rule-based Google Cloud architecture map",
    description=(
        "Create a simulator-first hybrid architecture story from a circuit run, assessment, "
        "use case, or legacy async job. Circuit-run requests are persisted for later export."
    ),
)
async def get_architecture(
    body: ArchitectureRequest,
    db: AsyncSession = Depends(get_db),
) -> ArchitectureRead:
    """Generate a Google Cloud hybrid architecture map for the current workspace context."""

    assessment = None
    if body.assessment_id:
        assessment = await db.get(Assessment, body.assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail=f"Assessment {body.assessment_id} not found.")

    contract = None
    if body.contract_id:
        contract = await db.get(AlgorithmContract, body.contract_id)
        if not contract:
            raise HTTPException(
                status_code=404,
                detail=f"AlgorithmContract {body.contract_id} not found.",
            )
        if assessment and contract.assessment_id != assessment.id:
            raise HTTPException(
                status_code=409,
                detail="The Algorithm Contract does not belong to the supplied assessment.",
            )
        if assessment is None:
            assessment = await db.get(Assessment, contract.assessment_id)
            if not assessment:
                raise HTTPException(
                    status_code=404,
                    detail=f"Assessment {contract.assessment_id} not found.",
                )
    elif assessment:
        stmt = (
            select(AlgorithmContract)
            .where(AlgorithmContract.assessment_id == assessment.id)
            .order_by(AlgorithmContract.created_at.desc())
            .limit(1)
        )
        contract = (await db.execute(stmt)).scalar_one_or_none()

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
        elif assessment:
            use_case = await db.get(UseCase, assessment.use_case_id)

        record = await create_architecture_record(
            db,
            circuit_run=circuit_run,
            assessment=assessment,
            contract=contract,
            use_case=use_case,
        )
        return ArchitectureRead.model_validate(serialize_architecture_record(record))

    if assessment and not body.job_id:
        use_case = None
        target_use_case_id = body.use_case_id or assessment.use_case_id
        if target_use_case_id:
            use_case = await db.get(UseCase, target_use_case_id)
            if not use_case:
                raise HTTPException(
                    status_code=404,
                    detail=f"UseCase {target_use_case_id} not found.",
                )
        record = await create_architecture_record(
            db,
            assessment=assessment,
            contract=contract,
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

    if assessment:
        output = assessment.qals_output or {}
        context["qals_score"] = assessment.qals_score
        context["verdict"] = output.get("verdict", assessment.verdict)
        context["problem_class"] = output.get("problem_class", assessment.problem_class)
        context["contract_type"] = output.get("recommended_contract_type", "TUTORIAL")
        context["time_horizon"] = output.get("time_horizon", assessment.time_horizon)
        context["confidence"] = output.get("confidence", assessment.confidence)
        context["classical_baseline"] = output.get("classical_baseline_summary", "")
        context["contract_validity_status"] = output.get("contract_validity_status", "")
        context["trust_labels"] = output.get("trust_labels", assessment.trust_labels or [])
        context["assumptions"] = output.get("assumptions", [])
        context["missing_evidence"] = output.get("missing_evidence", [])
        context["caveats"] = output.get("caveats", [])

    if contract:
        context["contract_type"] = contract.contract_type
        context["contract_validity_status"] = contract.validity_status
        context["classical_baseline"] = contract.classical_baseline
        context["trust_labels"] = contract.trust_labels
        context["assumptions"] = contract.assumptions
        context["caveats"] = contract.caveats

    if body.use_case_id:
        use_case = await db.get(UseCase, body.use_case_id)
        if not use_case:
            raise HTTPException(status_code=404, detail=f"UseCase {body.use_case_id} not found.")
        context["industry"] = use_case.industry.value
        context["complexity"] = use_case.complexity_score

    if not context:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: circuit_run_id, job_id, assessment_id, contract_id, use_case_id.",
        )

    architecture = architecture_from_context(context)
    trust = architecture_result_trust(
        assessment=assessment,
        contract=contract,
        context=context,
    )
    return ArchitectureRead(
        title=architecture.title,
        summary=architecture.summary,
        components=architecture.components,
        connections=[list(connection) for connection in architecture.connections],
        notes=architecture.notes,
        assessment_id=assessment.id if assessment else body.assessment_id,
        contract_id=contract.id if contract else body.contract_id,
        use_case_id=body.use_case_id,
        problem_class=architecture.problem_class,
        contract_type=architecture.contract_type,
        time_horizon=architecture.time_horizon,
        assumptions=architecture.assumptions,
        trust_labels=architecture.trust_labels,
        result_trust=trust,
    )

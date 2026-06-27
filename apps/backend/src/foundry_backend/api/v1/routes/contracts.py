"""Algorithm Contract routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import AlgorithmContract, Assessment
from foundry_backend.schemas.schemas import (
    AlgorithmContractRead,
    AlgorithmContractUpdate,
    ExperimentBundleCreate,
    ExperimentBundleRead,
)
from foundry_backend.services.opportunity import (
    create_experiment_bundle,
    serialize_algorithm_contract,
    serialize_experiment_bundle,
)

router = APIRouter()


async def _get_contract_or_404(db: AsyncSession, contract_id: uuid.UUID) -> AlgorithmContract:
    contract = await db.get(AlgorithmContract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail=f"AlgorithmContract {contract_id} not found.")
    return contract


@router.get("/{contract_id}", response_model=AlgorithmContractRead)
async def get_contract(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AlgorithmContractRead:
    """Fetch a persisted Algorithm Contract."""

    contract = await _get_contract_or_404(db, contract_id)
    return AlgorithmContractRead.model_validate(serialize_algorithm_contract(contract))


@router.patch("/{contract_id}", response_model=AlgorithmContractRead)
async def update_contract(
    contract_id: uuid.UUID,
    body: AlgorithmContractUpdate,
    db: AsyncSession = Depends(get_db),
) -> AlgorithmContractRead:
    """Patch user-supplied Algorithm Contract refinements."""

    contract = await _get_contract_or_404(db, contract_id)
    update = body.model_dump(exclude_unset=True)
    for field, value in update.items():
        setattr(contract, field, value)
    await db.commit()
    await db.refresh(contract)
    return AlgorithmContractRead.model_validate(serialize_algorithm_contract(contract))


@router.post(
    "/{contract_id}/experiment-bundles",
    response_model=ExperimentBundleRead,
    status_code=201,
)
async def create_contract_experiment_bundle(
    contract_id: uuid.UUID,
    body: ExperimentBundleCreate,
    db: AsyncSession = Depends(get_db),
) -> ExperimentBundleRead:
    """Create an Algorithm Experiment Bundle only after a contract exists."""

    contract = await _get_contract_or_404(db, contract_id)
    assessment = await db.get(Assessment, contract.assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Assessment {contract.assessment_id} not found.")
    try:
        bundle = await create_experiment_bundle(
            db,
            assessment=assessment,
            contract=contract,
            queue_simulation=body.queue_simulation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return ExperimentBundleRead.model_validate(serialize_experiment_bundle(bundle))

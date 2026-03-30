"""Circuit routes for the Build workspace."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import CircuitRun, UseCase
from foundry_backend.schemas.schemas import CircuitRunCreate, CircuitRunRead, CircuitTemplateRead
from foundry_backend.services.hybrid_lab import create_circuit_run, list_templates, serialize_circuit_run

router = APIRouter()


@router.get(
    "/templates",
    response_model=list[CircuitTemplateRead],
    summary="List starter circuit templates",
    description="Return the simulation-first starter templates shown in the Hybrid Lab.",
)
async def get_circuit_templates() -> list[CircuitTemplateRead]:
    """Return starter templates for the Build workspace prompt rail."""

    return [CircuitTemplateRead.model_validate(template) for template in list_templates()]


@router.post(
    "/run",
    response_model=CircuitRunRead,
    status_code=201,
    summary="Generate and run a starter circuit",
    description=(
        "Synchronously generate a toy circuit, simulate it locally, and return the explanation, "
        "Cirq code, measurement histogram, and QALS-lite preview used by the Build workspace."
    ),
)
async def run_circuit(
    body: CircuitRunCreate,
    db: AsyncSession = Depends(get_db),
) -> CircuitRunRead:
    """Create a synchronous circuit run for the interactive Build view."""

    use_case = None
    if body.use_case_id:
        use_case = await db.get(UseCase, body.use_case_id)
        if not use_case:
            raise HTTPException(status_code=404, detail=f"UseCase {body.use_case_id} not found.")

    run = await create_circuit_run(
        db=db,
        template_key=body.template_key,
        prompt=body.prompt,
        use_case=use_case,
        session_id=body.session_id,
    )
    return CircuitRunRead.model_validate(serialize_circuit_run(run))


@router.get(
    "/runs/{run_id}",
    response_model=CircuitRunRead,
    summary="Fetch a stored circuit run",
    description="Return a previously generated circuit run by ID.",
)
async def get_circuit_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> CircuitRunRead:
    """Fetch a persisted circuit run."""

    run = await db.get(CircuitRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"CircuitRun {run_id} not found.")
    return CircuitRunRead.model_validate(serialize_circuit_run(run))

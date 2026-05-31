"""Experiment bundle routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import ExperimentBundle
from foundry_backend.schemas.schemas import ExperimentBundleRead
from foundry_backend.services.opportunity import serialize_experiment_bundle

router = APIRouter()


@router.get("/{bundle_id}", response_model=ExperimentBundleRead)
async def get_experiment_bundle(
    bundle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ExperimentBundleRead:
    """Fetch an assessment-anchored Experiment Bundle."""

    bundle = await db.get(ExperimentBundle, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail=f"ExperimentBundle {bundle_id} not found.")
    return ExperimentBundleRead.model_validate(serialize_experiment_bundle(bundle))

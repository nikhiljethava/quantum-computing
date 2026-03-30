"""
Use Cases route — read-only endpoints for the Industry Atlas.
Data is populated by seed scripts, not by user POST requests.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import IndustryTag, UseCase
from foundry_backend.schemas.schemas import UseCaseList, UseCaseRead

router = APIRouter()


@router.get("", response_model=UseCaseList)
async def list_use_cases(
    industry: IndustryTag | None = Query(None, description="Filter by industry tag."),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> UseCaseList:
    """Return a paginated list of seeded industry use cases."""
    stmt = select(UseCase).order_by(UseCase.complexity_score)
    if industry:
        stmt = stmt.where(UseCase.industry == industry)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()

    return UseCaseList(items=[UseCaseRead.model_validate(r) for r in rows], total=total)


@router.get("/{use_case_id}", response_model=UseCaseRead)
async def get_use_case(
    use_case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> UseCaseRead:
    """Return a single use case by ID."""
    row = await db.get(UseCase, use_case_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"UseCase {use_case_id} not found.")
    return UseCaseRead.model_validate(row)

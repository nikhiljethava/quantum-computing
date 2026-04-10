"""Usage tracking routes."""

from datetime import timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import PageUsage
from foundry_backend.schemas.schemas import CityUsageSummary, PageUsageCreate, PageUsageRead, PageUsageSummary

router = APIRouter()


@router.post("", response_model=PageUsageRead, summary="Record a page view")
async def record_usage(
    usage_in: PageUsageCreate, db: AsyncSession = Depends(get_db)
) -> PageUsage:
    """Record a page view with path and city."""
    usage = PageUsage(page_path=usage_in.page_path, city=usage_in.city)
    db.add(usage)
    await db.commit()
    await db.refresh(usage)
    return usage


@router.get("", response_model=PageUsageSummary, summary="Get usage summary for the last 30 days")
async def get_usage_summary(
    page_path: str | None = None, db: AsyncSession = Depends(get_db)
) -> PageUsageSummary:
    """Get aggregated usage data for the last 30 days."""
    thirty_days_ago = func.now() - timedelta(days=30)

    # Total loads
    total_query = select(func.count()).select_from(PageUsage).where(PageUsage.created_at >= thirty_days_ago)
    if page_path:
        total_query = total_query.where(PageUsage.page_path == page_path)

    total_result = await db.execute(total_query)
    total_loads = total_result.scalar() or 0

    # Group by city
    city_query = (
        select(PageUsage.city, func.count().label("count"))
        .where(PageUsage.created_at >= thirty_days_ago)
        .group_by(PageUsage.city)
        .order_by(desc("count"))
    )
    if page_path:
        city_query = city_query.where(PageUsage.page_path == page_path)

    city_result = await db.execute(city_query)
    by_city = [
        CityUsageSummary(city=row[0], count=row[1])
        for row in city_result.all()
    ]

    return PageUsageSummary(total_loads=total_loads, by_city=by_city)

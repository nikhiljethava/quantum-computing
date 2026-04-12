"""Usage tracking routes."""

from datetime import timedelta
from fastapi import APIRouter, Depends, Request
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import PageUsage
from foundry_backend.schemas.schemas import CityUsageSummary, PageUsageCreate, PageUsageRead, PageUsageSummary
from foundry_backend.services.usage import extract_city_from_headers

router = APIRouter()


@router.post("", response_model=PageUsageRead, summary="Record a page view")
async def record_usage(
    usage_in: PageUsageCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> PageUsage:
    """Record a page view with path, visitor ID, and resolved city."""

    usage = PageUsage(
        page_path=usage_in.page_path,
        visitor_id=usage_in.visitor_id,
        city=extract_city_from_headers(request.headers),
    )
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

    filters = [
        PageUsage.created_at >= thirty_days_ago,
        PageUsage.visitor_id.is_not(None),
    ]
    if page_path:
        filters.append(PageUsage.page_path == page_path)

    total_query = select(func.count()).select_from(PageUsage).where(*filters)
    total_result = await db.execute(total_query)
    total_visits = total_result.scalar() or 0

    unique_query = select(func.count(func.distinct(PageUsage.visitor_id))).where(*filters)
    unique_result = await db.execute(unique_query)
    unique_visitors = unique_result.scalar() or 0

    city_query = (
        select(PageUsage.city, func.count().label("count"))
        .where(*filters)
        .group_by(PageUsage.city)
        .order_by(desc("count"))
    )

    city_result = await db.execute(city_query)
    by_city = [CityUsageSummary(city=row[0], count=row[1]) for row in city_result.all()]

    return PageUsageSummary(
        total_visits=total_visits,
        unique_visitors=unique_visitors,
        by_city=by_city,
    )

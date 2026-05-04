"""Context-aware guide tutor route."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.schemas.schemas import GuideAskRequest, GuideAskResponse
from foundry_backend.services.guide_tutor import ask_guide

router = APIRouter()


@router.post(
    "/ask",
    response_model=GuideAskResponse,
    summary="Ask the Quantum Foundry Guide",
    description="Return a context-aware explanation with citations and next actions.",
)
async def ask(
    body: GuideAskRequest,
    db: AsyncSession = Depends(get_db),
) -> GuideAskResponse:
    """Answer a guide question using local context or a configured Vertex provider."""

    response = await ask_guide(db, body)
    return GuideAskResponse.model_validate(response)

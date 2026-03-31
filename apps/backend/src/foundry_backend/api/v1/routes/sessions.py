"""Session routes for saved Build workspace state."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Project, Session, UseCase
from foundry_backend.schemas.schemas import (
    SessionCreate,
    SessionDetailRead,
    SessionList,
    SessionRead,
    SessionUpdate,
)
from foundry_backend.services.workspace import create_session, get_session_detail, list_sessions, serialize_session, update_session

router = APIRouter()


@router.get(
    "",
    response_model=SessionList,
    summary="List saved sessions",
    description="Return recent saved Build workspace sessions, optionally filtered by project.",
)
async def get_sessions(
    project_id: uuid.UUID | None = None,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> SessionList:
    """List saved sessions."""

    items, total = await list_sessions(db, limit=limit, offset=offset, project_id=project_id)
    return SessionList(items=[SessionRead.model_validate(item) for item in items], total=total)


@router.post(
    "",
    response_model=SessionRead,
    status_code=201,
    summary="Create a saved session",
    description="Persist the current Build workspace as a saved session.",
)
async def post_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
) -> SessionRead:
    """Create a saved session."""

    if body.project_id:
        project = await db.get(Project, body.project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {body.project_id} not found.")

    if body.selected_use_case_id:
        use_case = await db.get(UseCase, body.selected_use_case_id)
        if not use_case:
            raise HTTPException(status_code=404, detail=f"UseCase {body.selected_use_case_id} not found.")

    try:
        session = await create_session(
            db,
            project_id=body.project_id,
            selected_use_case_id=body.selected_use_case_id,
            title=body.title,
            current_mode=body.current_mode,
            starter_key=body.starter_key,
            notes=body.notes,
            latest_circuit_run_id=body.latest_circuit_run_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return SessionRead.model_validate(serialize_session(session))


@router.get(
    "/{session_id}",
    response_model=SessionDetailRead,
    summary="Fetch a saved session",
    description="Return the saved workspace session plus its latest circuit run, architecture, and artifacts.",
)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> SessionDetailRead:
    """Fetch a saved session by ID."""

    detail = await get_session_detail(db, session_id=session_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")
    return SessionDetailRead.model_validate(detail)


@router.patch(
    "/{session_id}",
    response_model=SessionRead,
    summary="Update a saved session",
    description="Patch a saved session and optionally attach the latest circuit run to it.",
)
async def patch_session(
    session_id: uuid.UUID,
    body: SessionUpdate,
    db: AsyncSession = Depends(get_db),
) -> SessionRead:
    """Update a saved session."""

    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    if body.project_id:
        project = await db.get(Project, body.project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {body.project_id} not found.")

    if body.selected_use_case_id:
        use_case = await db.get(UseCase, body.selected_use_case_id)
        if not use_case:
            raise HTTPException(status_code=404, detail=f"UseCase {body.selected_use_case_id} not found.")

    try:
        updated = await update_session(
            db,
            session=session,
            project_id=body.project_id,
            selected_use_case_id=body.selected_use_case_id,
            title=body.title,
            current_mode=body.current_mode,
            starter_key=body.starter_key,
            notes=body.notes,
            latest_circuit_run_id=body.latest_circuit_run_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return SessionRead.model_validate(serialize_session(updated))

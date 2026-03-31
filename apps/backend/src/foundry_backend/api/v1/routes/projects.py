"""Project routes for saved workspaces."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.db.session import get_db
from foundry_backend.models.models import Project, Session
from foundry_backend.schemas.schemas import ProjectCreate, ProjectList, ProjectRead, ProjectUpdate
from foundry_backend.services.workspace import create_project, list_projects, serialize_project, update_project

router = APIRouter()


@router.get(
    "",
    response_model=ProjectList,
    summary="List saved projects",
    description="Return recent saved workspace projects with their session counts.",
)
async def get_projects(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> ProjectList:
    """List saved projects."""

    items, total = await list_projects(db, limit=limit, offset=offset)
    return ProjectList(items=[ProjectRead.model_validate(item) for item in items], total=total)


@router.post(
    "",
    response_model=ProjectRead,
    status_code=201,
    summary="Create a saved project",
    description="Create a new project container for saved Hybrid Lab sessions.",
)
async def post_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
) -> ProjectRead:
    """Create a saved project."""

    project = await create_project(
        db,
        name=body.name,
        description=body.description,
        status=body.status,
    )
    return ProjectRead.model_validate(serialize_project(project, session_count=0))


@router.patch(
    "/{project_id}",
    response_model=ProjectRead,
    summary="Update a saved project",
    description="Patch a project's name, description, or status.",
)
async def patch_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
) -> ProjectRead:
    """Update a saved project."""

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found.")

    updated = await update_project(
        db,
        project=project,
        name=body.name,
        description=body.description,
        status=body.status,
    )
    count_stmt = select(func.count()).select_from(Session).where(Session.project_id == updated.id)
    session_count = (await db.execute(count_stmt)).scalar_one()
    return ProjectRead.model_validate(serialize_project(updated, session_count=session_count))

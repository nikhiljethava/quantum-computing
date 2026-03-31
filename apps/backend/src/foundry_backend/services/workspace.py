"""Workspace persistence helpers for projects and sessions."""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from foundry_backend.models.models import ArchitectureRecord, Artifact, CircuitRun, Project, Session, UseCase
from foundry_backend.services.artifacts import serialize_artifact
from foundry_backend.services.hybrid_lab import serialize_architecture_record, serialize_circuit_run


def serialize_project(project: Project, *, session_count: int = 0) -> dict[str, Any]:
    """Map a Project row into the API response contract."""

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "session_count": session_count,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


def serialize_session(session: Session) -> dict[str, Any]:
    """Map a Session row into the API response contract."""

    return {
        "id": session.id,
        "project_id": session.project_id,
        "project_name": session.project.name if session.project else None,
        "selected_use_case_id": session.selected_use_case_id,
        "title": session.title,
        "current_mode": session.current_mode,
        "starter_key": session.starter_key,
        "notes": session.notes,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


async def attach_circuit_run_to_session(
    db: AsyncSession,
    *,
    session: Session,
    circuit_run_id,
) -> None:
    """Attach a circuit run to the given session if present."""

    if circuit_run_id is None:
        return

    run = await db.get(CircuitRun, circuit_run_id)
    if not run:
        raise ValueError(f"CircuitRun {circuit_run_id} not found.")

    run.session_id = session.id
    if run.use_case_id and session.selected_use_case_id is None:
        session.selected_use_case_id = run.use_case_id


async def create_project(
    db: AsyncSession,
    *,
    name: str,
    description: str,
    status,
) -> Project:
    """Persist a new project."""

    project = Project(name=name, description=description, status=status)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def update_project(
    db: AsyncSession,
    *,
    project: Project,
    name: str | None,
    description: str | None,
    status,
) -> Project:
    """Update an existing project."""

    if name is not None:
        project.name = name
    if description is not None:
        project.description = description
    if status is not None:
        project.status = status

    await db.commit()
    await db.refresh(project)
    return project


async def list_projects(db: AsyncSession, *, limit: int, offset: int) -> tuple[list[dict[str, Any]], int]:
    """Return paginated project summaries with session counts."""

    count_stmt = select(func.count()).select_from(Project)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = (
        select(Project, func.count(Session.id).label("session_count"))
        .outerjoin(Session, Session.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(stmt)).all()

    items = [serialize_project(project, session_count=session_count) for project, session_count in rows]
    return items, total


async def create_session(
    db: AsyncSession,
    *,
    project_id,
    selected_use_case_id,
    title: str,
    current_mode: str,
    starter_key: str,
    notes: dict[str, Any],
    latest_circuit_run_id,
) -> Session:
    """Persist a new saved workspace session."""

    session = Session(
        project_id=project_id,
        selected_use_case_id=selected_use_case_id,
        title=title,
        current_mode=current_mode,
        starter_key=starter_key,
        notes=notes,
    )
    db.add(session)
    await db.flush()

    await attach_circuit_run_to_session(db, session=session, circuit_run_id=latest_circuit_run_id)

    await db.commit()

    stmt = (
        select(Session)
        .options(selectinload(Session.project))
        .where(Session.id == session.id)
    )
    return (await db.execute(stmt)).scalar_one()


async def update_session(
    db: AsyncSession,
    *,
    session: Session,
    project_id,
    selected_use_case_id,
    title: str | None,
    current_mode: str | None,
    starter_key: str | None,
    notes: dict[str, Any] | None,
    latest_circuit_run_id,
) -> Session:
    """Update an existing saved workspace session."""

    if project_id is not None:
        session.project_id = project_id
    if selected_use_case_id is not None:
        session.selected_use_case_id = selected_use_case_id
    if title is not None:
        session.title = title
    if current_mode is not None:
        session.current_mode = current_mode
    if starter_key is not None:
        session.starter_key = starter_key
    if notes is not None:
        session.notes = {**(session.notes or {}), **notes}

    await attach_circuit_run_to_session(db, session=session, circuit_run_id=latest_circuit_run_id)

    await db.commit()

    stmt = (
        select(Session)
        .options(selectinload(Session.project))
        .where(Session.id == session.id)
    )
    return (await db.execute(stmt)).scalar_one()


async def list_sessions(
    db: AsyncSession,
    *,
    limit: int,
    offset: int,
    project_id=None,
) -> tuple[list[dict[str, Any]], int]:
    """Return paginated recent sessions."""

    count_stmt = select(func.count()).select_from(Session)
    if project_id:
        count_stmt = count_stmt.where(Session.project_id == project_id)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = select(Session).options(selectinload(Session.project)).order_by(Session.updated_at.desc()).limit(limit).offset(offset)
    if project_id:
        stmt = stmt.where(Session.project_id == project_id)

    rows = (await db.execute(stmt)).scalars().all()
    return [serialize_session(session) for session in rows], total


async def get_session_detail(db: AsyncSession, *, session_id) -> dict[str, Any] | None:
    """Return a session plus its latest circuit run, architecture, and artifacts."""

    stmt = (
        select(Session)
        .options(selectinload(Session.project), selectinload(Session.selected_use_case))
        .where(Session.id == session_id)
    )
    session = (await db.execute(stmt)).scalar_one_or_none()
    if session is None:
        return None

    latest_run_stmt = (
        select(CircuitRun)
        .where(CircuitRun.session_id == session.id)
        .order_by(CircuitRun.created_at.desc())
        .limit(1)
    )
    latest_run = (await db.execute(latest_run_stmt)).scalar_one_or_none()

    latest_architecture = None
    artifacts: list[Artifact] = []
    if latest_run is not None:
        latest_arch_stmt = (
            select(ArchitectureRecord)
            .where(ArchitectureRecord.circuit_run_id == latest_run.id)
            .order_by(ArchitectureRecord.created_at.desc())
            .limit(1)
        )
        latest_architecture = (await db.execute(latest_arch_stmt)).scalar_one_or_none()

        artifact_stmt = (
            select(Artifact)
            .where(Artifact.circuit_run_id == latest_run.id)
            .order_by(Artifact.created_at.desc())
        )
        artifacts = (await db.execute(artifact_stmt)).scalars().all()

    return {
        **serialize_session(session),
        "latest_circuit_run": serialize_circuit_run(latest_run) if latest_run else None,
        "latest_architecture": (
            serialize_architecture_record(latest_architecture) if latest_architecture else None
        ),
        "artifacts": [serialize_artifact(artifact) for artifact in artifacts],
    }

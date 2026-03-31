"""Tests for workspace persistence helpers."""

from types import SimpleNamespace

from foundry_backend.models.models import ProjectStatus
from foundry_backend.services.workspace import serialize_project, serialize_session


def test_serialize_project_includes_session_count() -> None:
    project = SimpleNamespace(
        id="project-1",
        name="Quantum demos",
        description="Saved workspace sessions.",
        status=ProjectStatus.active,
        created_at="2026-03-30T12:00:00Z",
        updated_at="2026-03-30T12:05:00Z",
    )

    serialized = serialize_project(project, session_count=3)

    assert serialized["name"] == "Quantum demos"
    assert serialized["session_count"] == 3
    assert serialized["status"] == ProjectStatus.active


def test_serialize_session_includes_project_name() -> None:
    session = SimpleNamespace(
        id="session-1",
        project_id="project-1",
        project=SimpleNamespace(name="Quantum demos"),
        selected_use_case_id="use-case-1",
        title="Battery materials workspace",
        current_mode="build",
        starter_key="routing",
        notes={"last_saved_at": "2026-03-30T12:05:00Z"},
        created_at="2026-03-30T12:00:00Z",
        updated_at="2026-03-30T12:05:00Z",
    )

    serialized = serialize_session(session)

    assert serialized["project_name"] == "Quantum demos"
    assert serialized["starter_key"] == "routing"
    assert serialized["notes"]["last_saved_at"] == "2026-03-30T12:05:00Z"

"""Tests for worker job lifecycle and export execution."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest

from foundry_backend.core.config import settings
from foundry_backend.models.models import (
    ArchitectureRecord,
    Artifact,
    ArtifactType,
    CircuitRun,
    Job,
    JobStatus,
    JobType,
)
from foundry_worker import main as worker_main


class _FakeScalarResult:
    def __init__(self, rows: list[object]) -> None:
        self._rows = rows

    def scalars(self) -> _FakeScalarResult:
        return self

    def all(self) -> list[object]:
        return list(self._rows)

    def scalar_one_or_none(self) -> object | None:
        return self._rows[0] if self._rows else None


class _FakeAsyncSession:
    def __init__(
        self,
        *,
        execute_rows: list[object] | None = None,
        get_map: dict[tuple[type[object], uuid.UUID], object] | None = None,
    ) -> None:
        self.execute_rows = execute_rows or []
        self.get_map = get_map or {}
        self.added: list[object] = []
        self.commit_calls = 0
        self.refreshed: list[object] = []

    async def execute(self, _stmt) -> _FakeScalarResult:
        return _FakeScalarResult(self.execute_rows)

    async def get(self, model: type[object], key: uuid.UUID) -> object | None:
        return self.get_map.get((model, key))

    def add(self, obj: object) -> None:
        self.added.append(obj)

    async def commit(self) -> None:
        self.commit_calls += 1

    async def refresh(self, obj: object) -> None:
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(tz=timezone.utc)
        self.refreshed.append(obj)


def _build_circuit_run() -> CircuitRun:
    return CircuitRun(
        id=uuid.uuid4(),
        template_key=JobType.coin_flip,
        prompt="Create a coin flip.",
        guide_response="I will generate a single-qubit circuit.",
        explanation="Hadamard creates an even split before measurement.",
        circuit_text="0: ---H---M---",
        cirq_code="print('hello quantum')",
        histogram=[{"state": "0", "probability": 50, "count": 500}],
        measurements={"result": [0, 1]},
        run_metadata={"concept": "Superposition"},
        assessment_preview={
            "score": 72,
            "verdict": "Credible prototype candidate now",
            "horizon": "Hybrid experiment now",
            "confidence": "Medium confidence",
            "explanation": ["Simulation-first path."],
            "assumptions": ["Educational framing."],
        },
    )


def _build_architecture(circuit_run: CircuitRun) -> ArchitectureRecord:
    return ArchitectureRecord(
        id=uuid.uuid4(),
        circuit_run_id=circuit_run.id,
        title="Simulation-first architecture",
        summary="Cloud Run calls a simulator worker and packages exports.",
        components=[{"id": "cloud_run", "name": "Cloud Run"}],
        connections=[["frontend", "cloud_run"]],
        notes=["Hardware remains optional."],
    )


@pytest.mark.asyncio
async def test_poll_once_completes_job_and_persists_job_output_artifact(monkeypatch) -> None:
    job = Job(
        id=uuid.uuid4(),
        job_type=JobType.coin_flip,
        status=JobStatus.pending,
        payload={"prompt": "Create a coin flip."},
    )
    db = _FakeAsyncSession(execute_rows=[job])

    async def fake_execute_job(*_args, **_kwargs) -> dict[str, object]:
        return {
            "circuit_run_id": str(uuid.uuid4()),
            "job_output_artifact_uri": "local:///tmp/coin_flip_circuit.txt",
            "job_output_size": 42,
        }

    monkeypatch.setattr(worker_main, "_execute_job", fake_execute_job)

    processed = await worker_main.poll_once(db)

    assert processed == 1
    assert job.status == JobStatus.completed
    assert job.started_at is not None
    assert job.completed_at is not None
    assert job.error_message is None
    assert job.result is not None
    assert db.commit_calls == 2
    assert len(db.added) == 1
    artifact = db.added[0]
    assert isinstance(artifact, Artifact)
    assert artifact.job_id == job.id
    assert artifact.artifact_type == ArtifactType.job_output
    assert artifact.size_bytes == 42


@pytest.mark.asyncio
async def test_poll_once_marks_failed_jobs_and_skips_artifact_creation(monkeypatch) -> None:
    job = Job(
        id=uuid.uuid4(),
        job_type=JobType.routing,
        status=JobStatus.pending,
        payload={"prompt": "Show a routing example."},
    )
    db = _FakeAsyncSession(execute_rows=[job])

    async def fake_execute_job(*_args, **_kwargs) -> dict[str, object]:
        raise RuntimeError("worker exploded")

    monkeypatch.setattr(worker_main, "_execute_job", fake_execute_job)

    processed = await worker_main.poll_once(db)

    assert processed == 1
    assert job.status == JobStatus.failed
    assert job.started_at is not None
    assert job.completed_at is not None
    assert job.error_message == "worker exploded"
    assert db.commit_calls == 2
    assert db.added == []


@pytest.mark.asyncio
async def test_execute_export_job_creates_session_summary_artifact(tmp_path, monkeypatch) -> None:
    circuit_run = _build_circuit_run()
    architecture = _build_architecture(circuit_run)
    db = _FakeAsyncSession(
        get_map={
            (CircuitRun, circuit_run.id): circuit_run,
            (ArchitectureRecord, architecture.id): architecture,
        }
    )

    monkeypatch.setattr(settings, "storage_backend", "local")
    monkeypatch.setattr(settings, "artifact_dir", str(tmp_path))

    job_id = uuid.uuid4()
    result = await worker_main._execute_export_job(
        db,
        job_id=str(job_id),
        payload={
            "circuit_run_id": str(circuit_run.id),
            "architecture_record_id": str(architecture.id),
        },
    )

    assert result["artifact_type"] == ArtifactType.session_summary.value
    assert result["artifact_id"]
    assert result["filename"].endswith("_session_summary.md")
    assert result["content_type"] == "text/markdown"
    assert result["size_bytes"] > 0
    assert len(db.added) == 1
    artifact = db.added[0]
    assert isinstance(artifact, Artifact)
    assert artifact.job_id == job_id
    output_path = Path(artifact.storage_uri.removeprefix("local://"))
    assert output_path.exists()
    contents = output_path.read_text(encoding="utf-8")
    assert "Simulation-first output only." in contents
    assert "QALS-lite is a heuristic readiness aid" in contents

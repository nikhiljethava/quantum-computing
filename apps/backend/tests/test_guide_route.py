"""Route tests for the local Quantum Foundry guide provider."""

from datetime import datetime, timezone
import uuid

from fastapi.testclient import TestClient

from foundry_backend.db.session import get_db
from foundry_backend.main import app
from foundry_backend.models.models import (
    ArchitectureRecord,
    CircuitRun,
    IndustryTag,
    JobType,
    UseCase,
)
from foundry_backend.services.guide_tutor import HARDWARE_ACCESS_GUARDRAIL


class _FakeAsyncSession:
    def __init__(self, rows: dict[tuple[type, uuid.UUID], object]):
        self._rows = rows

    async def get(self, model, row_id):
        return self._rows.get((model, row_id))


def _use_case(use_case_id: uuid.UUID) -> UseCase:
    return UseCase(
        id=use_case_id,
        slug="portfolio-optimization",
        title="Portfolio Optimization",
        industry=IndustryTag.finance,
        description="Constrained allocation workflow.",
        quantum_approach="QAOA-style toy optimization.",
        complexity_score=4.0,
        horizon="near-term",
        featured=True,
        featured_rank=1,
        blueprint={
            "classical_baseline": "Classical optimizers remain the production baseline.",
            "google_stack": ["Cirq", "qsim", "Cloud Run Jobs", "Cloud Storage"],
            "maturity_label": "simulate_now",
        },
        evidence_items=[
            {
                "title": "Evidence",
                "publisher": "Publisher",
                "published_at": "2024-01-01",
                "claim": "Optimization is a common public benchmark category.",
                "source_url": "https://example.com",
            }
        ],
        created_at=datetime.now(timezone.utc),
    )


def _circuit_run(run_id: uuid.UUID, use_case_id: uuid.UUID) -> CircuitRun:
    return CircuitRun(
        id=run_id,
        use_case_id=use_case_id,
        template_key=JobType.bell_state,
        prompt="Show a Bell state.",
        guide_response="Create a Bell pair.",
        explanation="A Hadamard plus CNOT creates correlated measurement outcomes.",
        circuit_text="q0: H @q1",
        cirq_code="import cirq",
        histogram=[],
        measurements={},
        run_metadata={
            "simulator_backend": "cirq",
            "num_qubits": 2,
            "gate_count": 2,
            "circuit_depth": 2,
        },
        assessment_preview={},
        created_at=datetime.now(timezone.utc),
    )


def _architecture(architecture_id: uuid.UUID, run_id: uuid.UUID) -> ArchitectureRecord:
    return ArchitectureRecord(
        id=architecture_id,
        circuit_run_id=run_id,
        title="Hybrid workflow",
        summary="Cloud Run API, worker simulation, and Cloud Storage exports.",
        components=[],
        connections=[],
        notes=[HARDWARE_ACCESS_GUARDRAIL],
        created_at=datetime.now(timezone.utc),
    )


def test_local_guide_includes_hardware_disclaimer() -> None:
    async def override_db():
        yield _FakeAsyncSession({})

    app.dependency_overrides[get_db] = override_db

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/guide/ask",
            json={
                "question": "Can I run this on hardware?",
                "page_context": "build",
            },
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert HARDWARE_ACCESS_GUARDRAIL in body["answer"]
    assert HARDWARE_ACCESS_GUARDRAIL in body["safety_notes"]


def test_local_guide_uses_use_case_and_circuit_context() -> None:
    use_case_id = uuid.uuid4()
    run_id = uuid.uuid4()
    architecture_id = uuid.uuid4()
    rows = {
        (UseCase, use_case_id): _use_case(use_case_id),
        (CircuitRun, run_id): _circuit_run(run_id, use_case_id),
        (ArchitectureRecord, architecture_id): _architecture(architecture_id, run_id),
    }

    async def override_db():
        yield _FakeAsyncSession(rows)

    app.dependency_overrides[get_db] = override_db

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/guide/ask",
            json={
                "question": "What should I inspect next?",
                "page_context": "build",
                "use_case_id": str(use_case_id),
                "circuit_run_id": str(run_id),
                "architecture_id": str(architecture_id),
            },
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert "Portfolio Optimization" in body["answer"]
    assert "bell_state" in body["answer"]
    assert any(source["source_type"] == "app_use_case" for source in body["cited_sources"])
    assert any(action["action_type"] == "assess" for action in body["recommended_next_actions"])

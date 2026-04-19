"""Route tests for the richer assessment response contract."""

from datetime import datetime, timezone
import uuid

from fastapi.testclient import TestClient

from foundry_backend.db.session import get_db
from foundry_backend.main import app
from foundry_backend.models.models import Assessment, IndustryTag, UseCase


class _FakeAsyncSession:
    def __init__(self, use_case: UseCase):
        self.use_case = use_case
        self.saved_assessment: Assessment | None = None

    async def get(self, model, identity):
        if model is UseCase and identity == self.use_case.id:
            return self.use_case
        return None

    def add(self, instance: Assessment) -> None:
        self.saved_assessment = instance

    async def commit(self) -> None:
        return None

    async def refresh(self, instance: Assessment) -> None:
        if getattr(instance, "id", None) is None:
            instance.id = uuid.uuid4()
        if getattr(instance, "created_at", None) is None:
            instance.created_at = datetime.now(timezone.utc)


def _make_use_case() -> UseCase:
    return UseCase(
        id=uuid.uuid4(),
        title="Vehicle Routing Optimization",
        industry=IndustryTag.logistics,
        description="Route vehicles under time and capacity constraints.",
        quantum_approach="Hybrid QAOA-style search for hard route subproblems.",
        complexity_score=3.5,
        horizon="near-term",
        featured=True,
        featured_rank=1,
        blueprint={
            "persona": "Routing lead",
            "business_kpi": "Reduce late deliveries",
            "hybrid_pattern": "Classical clustering -> hybrid solver -> dispatcher review",
            "next_90_days": [
                "Freeze one routing region and benchmark dataset.",
                "Compare classical heuristics and simulated hybrid runs.",
                "Review results with dispatch stakeholders.",
            ],
        },
        evidence_items=[
            {"title": "Paper 1", "claim": "Hybrid routing is benchmarkable today."},
            {"title": "Paper 2", "claim": "Simulator-first logistics pilots are credible."},
        ],
        created_at=datetime.now(timezone.utc),
    )


def test_create_assessment_returns_recommendation_fields() -> None:
    use_case = _make_use_case()

    async def override_db():
        yield _FakeAsyncSession(use_case)

    app.dependency_overrides[get_db] = override_db

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/assessments",
            json={
                "use_case_id": str(use_case.id),
                "user_inputs": {
                    "problem_size": "large",
                    "data_structure": "structured",
                    "classical_hardness": "hard",
                    "timeline": "1-2 years",
                },
            },
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 201
    body = response.json()
    assert body["qals_score"] >= 0.55
    assert body["recommendation"] == "hybrid_pilot_now"
    assert body["why_promising"]
    assert body["why_not_now"]
    assert body["top_blockers"]
    assert body["next_90_days"]
    assert "score_breakdown" in body

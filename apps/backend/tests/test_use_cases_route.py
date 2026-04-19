"""Route tests for the featured Explore use-case filter."""

from datetime import datetime, timezone
import uuid

from fastapi.testclient import TestClient

from foundry_backend.db.session import get_db
from foundry_backend.main import app
from foundry_backend.models.models import IndustryTag, UseCase


class _ScalarResult:
    def __init__(self, value: int):
        self._value = value

    def scalar_one(self) -> int:
        return self._value


class _RowsResult:
    def __init__(self, rows: list[UseCase]):
        self._rows = rows

    def scalars(self) -> "_RowsResult":
        return self

    def all(self) -> list[UseCase]:
        return self._rows


class _FakeAsyncSession:
    def __init__(self, rows: list[UseCase]):
        self._rows = rows

    async def execute(self, statement):
        sql = str(statement).lower()
        rows = self._rows

        if "use_cases.featured is true" in sql:
            rows = [row for row in rows if row.featured]

        if "count(" in sql:
            return _ScalarResult(len(rows))

        ranked_rows = sorted(
            rows,
            key=lambda row: (
                not row.featured,
                row.featured_rank if row.featured_rank is not None else 999,
                row.complexity_score,
                row.title,
            ),
        )
        return _RowsResult(ranked_rows)


def _make_use_case(title: str, *, featured: bool, featured_rank: int | None) -> UseCase:
    return UseCase(
        id=uuid.uuid4(),
        title=title,
        industry=IndustryTag.finance,
        description=f"{title} description",
        quantum_approach=f"{title} quantum approach",
        complexity_score=3.0,
        horizon="near-term",
        featured=featured,
        featured_rank=featured_rank,
        blueprint={
            "persona": "Test persona",
            "business_kpi": "Test KPI",
            "classical_baseline": "Test baseline",
            "hybrid_pattern": "Test pattern",
            "pilot_scope_weeks": 8,
            "sample_input": "Test input",
            "success_thresholds": ["Threshold"],
            "next_90_days": ["Next step"],
        },
        evidence_items=[
            {
                "title": "Evidence",
                "publisher": "Publisher",
                "published_at": "2024-01-01",
                "claim": "Claim",
                "source_url": "https://example.com",
            }
        ],
        created_at=datetime.now(timezone.utc),
    )


def test_use_cases_featured_only_filters_and_preserves_rank_order() -> None:
    rows = [
        _make_use_case("Portfolio Optimization", featured=True, featured_rank=1),
        _make_use_case("Vehicle Routing Optimization", featured=True, featured_rank=3),
        _make_use_case("Supply Chain Network Design", featured=False, featured_rank=None),
    ]

    async def override_db():
        yield _FakeAsyncSession(rows)

    app.dependency_overrides[get_db] = override_db

    try:
        client = TestClient(app)
        response = client.get("/api/v1/use-cases?featured_only=true")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert [item["title"] for item in body["items"]] == [
        "Portfolio Optimization",
        "Vehicle Routing Optimization",
    ]
    assert all(item["featured"] is True for item in body["items"])

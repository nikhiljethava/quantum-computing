"""Tests for Gemini-assisted draft circuit updates."""

from fastapi.testclient import TestClient

from foundry_backend.api.v1.routes import circuits
from foundry_backend.main import app
from foundry_backend.schemas.schemas import CircuitVisualNodeRead, GeminiCircuitUpdateResponse
from foundry_backend.services.gemini_circuit_assistant import (
    _ensure_control_targets,
    _extract_json_text,
)

client = TestClient(app)


def test_extract_json_text_strips_code_fence() -> None:
    payload = """```json
{"guide_response":"hi","explanation":"hello","nodes":[]}
```"""

    assert _extract_json_text(payload) == '{"guide_response":"hi","explanation":"hello","nodes":[]}'


def test_ensure_control_targets_adds_missing_target() -> None:
    nodes = _ensure_control_targets(
        [
            CircuitVisualNodeRead(
                type="gate",
                lane=0,
                column=0,
                label="H",
                tone="primary",
            ),
            CircuitVisualNodeRead(
                type="control",
                lane=0,
                column=2,
                target_lane=1,
                tone="accent",
            ),
        ],
        ["q0", "q1", "c0"],
    )

    assert len(nodes) == 3
    assert any(node.type == "target" and node.lane == 1 and node.column == 2 for node in nodes)


def test_gemini_update_route_returns_validated_draft(monkeypatch) -> None:
    async def fake_update(_body):
        return GeminiCircuitUpdateResponse(
            model_name="gemini-2.5-flash",
            guide_response="I turned the coin flip into a Bell-state style draft.",
            explanation="This remains a simulator-first teaching draft with one entangling step.",
            nodes=[
                {
                    "type": "gate",
                    "lane": 0,
                    "column": 0,
                    "label": "H",
                    "tone": "primary",
                },
                {
                    "type": "control",
                    "lane": 0,
                    "column": 2,
                    "target_lane": 1,
                    "tone": "accent",
                },
                {
                    "type": "target",
                    "lane": 1,
                    "column": 2,
                    "tone": "accent",
                },
            ],
        )

    monkeypatch.setattr(circuits, "update_circuit_with_gemini", fake_update)

    response = client.post(
        "/api/v1/circuits/gemini-update",
        json={
            "api_key": "test-api-key-1234567890",
            "instruction": "Turn this into a Bell-state style draft.",
            "wires": ["q0", "q1", "c0"],
            "nodes": [
                {
                    "type": "gate",
                    "lane": 0,
                    "column": 0,
                    "label": "H",
                    "tone": "primary",
                }
            ],
            "starter_key": "coin_flip",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model_name"] == "gemini-2.5-flash"
    assert len(body["nodes"]) == 3
    assert body["nodes"][1]["type"] == "control"

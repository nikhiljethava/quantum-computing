"""Route tests for Cirq Lab circuit run responses."""

from datetime import datetime, timezone
import uuid

from fastapi.testclient import TestClient

from foundry_backend.db.session import get_db
from foundry_backend.main import app


class _FakeAsyncSession:
    def __init__(self) -> None:
        self.saved = None

    async def get(self, model, identity):
        return None

    def add(self, instance) -> None:
        self.saved = instance

    async def commit(self) -> None:
        return None

    async def refresh(self, instance) -> None:
        if getattr(instance, "id", None) is None:
            instance.id = uuid.uuid4()
        if getattr(instance, "created_at", None) is None:
            instance.created_at = datetime.now(timezone.utc)


def _client_with_fake_db() -> TestClient:
    async def override_db():
        yield _FakeAsyncSession()

    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


def test_run_circuit_without_lab_controls_still_works() -> None:
    client = _client_with_fake_db()

    try:
        response = client.post("/api/v1/circuits/run", json={"template_key": "coin_flip"})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 201
    body = response.json()
    assert body["histogram"]
    assert body["simulator_backend"] == "cirq"
    assert body["num_qubits"] == 1
    assert body["gate_count"] == 2
    assert body["circuit_depth"] >= 2
    assert body["measurement_keys"] == ["result"]
    assert body["result_trust"]["evidence_category"] == "tutorial"
    assert body["result_trust"]["contract_validity_status"] == "TUTORIAL_ONLY"
    assert {"TUTORIAL", "TOY_SIMULATION"} <= set(body["result_trust"]["trust_labels"])
    assert "declared classical baseline" in body["result_trust"]["missing_evidence"]


def test_run_circuit_with_noise_returns_noisy_histogram() -> None:
    client = _client_with_fake_db()

    try:
        response = client.post(
            "/api/v1/circuits/run",
            json={
                "template_key": "coin_flip",
                "repetitions": 100,
                "noise_enabled": True,
                "noise_level": 0.05,
            },
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 201
    body = response.json()
    assert body["ideal_histogram"]
    assert body["noisy_histogram"]
    assert body["metadata"]["noise_enabled"] is True
    assert "Educational approximation" in body["result_trust"]["noise_model_description"]
    assert body["result_trust"]["evidence_category"] != "measured hardware result"


def test_run_circuit_qsim_falls_back_gracefully_when_unavailable(monkeypatch) -> None:
    import builtins

    real_import = builtins.__import__

    def import_without_qsim(name, *args, **kwargs):
        if name == "qsimcirq":
            raise ImportError("qsimcirq unavailable in test")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", import_without_qsim)
    client = _client_with_fake_db()

    try:
        response = client.post(
            "/api/v1/circuits/run",
            json={
                "template_key": "bell_state",
                "repetitions": 100,
                "simulator_backend": "qsim",
            },
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 201
    body = response.json()
    assert body["simulator_backend"] == "cirq"
    assert body["simulator_warning"] == "qsimcirq is not installed; used Cirq simulator instead."

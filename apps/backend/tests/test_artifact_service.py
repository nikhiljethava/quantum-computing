"""Tests for export artifact rendering helpers."""

from types import SimpleNamespace

from foundry_backend.models.models import ArtifactType, JobType
from foundry_backend.services.artifacts import _render_export, build_download_path


def _mock_circuit_run() -> SimpleNamespace:
    return SimpleNamespace(
        template_key=JobType.coin_flip,
        prompt="Create a coin flip.",
        explanation="Hadamard creates an even split before measurement.",
        cirq_code="print('hello quantum')",
        histogram=[{"state": "0", "probability": 50, "count": 500}],
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


def _mock_architecture() -> SimpleNamespace:
    return SimpleNamespace(
        id="arch-1",
        title="Architecture",
        summary="Simulation-first architecture.",
        components=[{"id": "cloud_run"}],
        connections=[["frontend", "cloud_run"]],
        notes=["Hardware optional."],
    )


def test_render_cirq_code_export() -> None:
    filename, content_type, content = _render_export(
        ArtifactType.cirq_code,
        _mock_circuit_run(),
        _mock_architecture(),
        None,
    )

    assert filename.endswith("_circuit.py")
    assert content_type == "text/x-python"
    assert b"hello quantum" in content


def test_render_session_summary_mentions_guardrails() -> None:
    filename, content_type, content = _render_export(
        ArtifactType.session_summary,
        _mock_circuit_run(),
        _mock_architecture(),
        None,
    )

    text = content.decode("utf-8")

    assert filename.endswith("_session_summary.md")
    assert content_type == "text/markdown"
    assert "Simulation-first output only." in text
    assert "QALS-lite is a heuristic readiness aid" in text


def test_build_download_path() -> None:
    assert build_download_path("artifact-123").endswith("/artifact-123/download")

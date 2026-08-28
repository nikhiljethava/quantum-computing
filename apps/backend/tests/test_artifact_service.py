"""Tests for export artifact rendering helpers."""

import json
from types import SimpleNamespace

from foundry_backend.models.models import ArtifactType, JobType
from foundry_backend.services.artifacts import _render_export, build_download_path

HARDWARE_ACCESS_GUARDRAIL = (
    "Google quantum hardware access is restricted to approved groups. "
    "Quantum Foundry is simulation-first unless approved access is configured."
)


def _mock_circuit_run() -> SimpleNamespace:
    return SimpleNamespace(
        template_key=JobType.coin_flip,
        prompt="Create a coin flip.",
        explanation="Hadamard creates an even split before measurement.",
        cirq_code="print('hello quantum')",
        histogram=[{"state": "0", "probability": 50, "count": 500}],
        run_metadata={
            "concept": "Superposition",
            "simulator_backend": "cirq",
            "ideal_histogram": [{"state": "0", "probability": 50, "count": 500}],
            "noisy_histogram": None,
            "state_preview": {"available": True, "top_amplitudes": []},
        },
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
        notes=[HARDWARE_ACCESS_GUARDRAIL],
    )


def _mock_contract_architecture() -> SimpleNamespace:
    architecture = _mock_architecture()
    architecture.assessment_id = "assessment-1"
    architecture.contract_id = "contract-1"
    architecture.problem_class = "OPTIMIZATION"
    architecture.contract_type = "QAOA"
    architecture.trust_context = {
        "evidence_category": "estimate",
        "backend": "deterministic architecture mapper",
        "execution_status": "contract architecture with simulator result",
        "classical_baseline": "OR-Tools with objective and runtime metrics",
        "classical_baseline_status": "declared",
        "contract_validity_status": "VALID",
        "readiness_verdict": "SIMULATOR_PROTOTYPE_NOW",
        "confidence": "MEDIUM",
        "time_horizon": "SIMULATOR_NOW",
        "trust_labels": ["BENCHMARK_CANDIDATE"],
        "assumptions": ["The same routing instance is used by both candidates."],
        "missing_evidence": ["Repeated benchmark runs"],
        "caveats": ["Production advantage unproven."],
        "provenance": ["Assessment assessment-1"],
        "generated_at": "2026-08-26T12:00:00+00:00",
        "software_or_model_version": "Quantum Foundry Result Trust v1",
    }
    return architecture


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
    assert "QALS 3.0 Algorithm Contract" in text
    assert "not a business recommendation" in text
    assert "Educational noise is not calibrated hardware noise" in text
    assert "## Result Trust" in text
    assert HARDWARE_ACCESS_GUARDRAIL in text


def test_render_colab_notebook_export() -> None:
    filename, content_type, content = _render_export(
        ArtifactType.colab_notebook,
        _mock_circuit_run(),
        _mock_architecture(),
        None,
    )

    notebook = json.loads(content.decode("utf-8"))
    joined_source = "\n".join(
        "".join(cell.get("source", [])) for cell in notebook["cells"]
    )

    assert filename.endswith("_colab_notebook.ipynb")
    assert content_type == "application/x-ipynb+json"
    assert notebook["nbformat"] == 4
    assert len(notebook["cells"]) == 8
    assert "Quantum Foundry: Tutorial-mode Notebook" in joined_source
    assert "print('hello quantum')" in joined_source
    assert "matplotlib.pyplot" in joined_source
    assert "plt.bar" in joined_source
    assert HARDWARE_ACCESS_GUARDRAIL in joined_source


def test_contract_exports_carry_assessment_contract_baseline_horizon_and_trust() -> None:
    architecture = _mock_contract_architecture()
    run = _mock_circuit_run()

    _, _, code = _render_export(ArtifactType.cirq_code, run, architecture, None)
    _, _, summary = _render_export(ArtifactType.session_summary, run, architecture, None)
    _, _, assessment_json = _render_export(ArtifactType.assessment_json, run, architecture, None)
    _, _, notebook_bytes = _render_export(ArtifactType.colab_notebook, run, architecture, None)

    code_text = code.decode("utf-8")
    summary_text = summary.decode("utf-8")
    assessment_payload = json.loads(assessment_json.decode("utf-8"))
    notebook = json.loads(notebook_bytes.decode("utf-8"))
    notebook_text = "\n".join(
        "".join(cell.get("source", [])) for cell in notebook["cells"]
    )

    for text in (code_text, summary_text, notebook_text):
        assert "assessment-1" in text
        assert "contract-1" in text
        assert "OR-Tools with objective and runtime metrics" in text
        assert "SIMULATOR_NOW" in text
        assert "BENCHMARK_CANDIDATE" in text
    assert assessment_payload["mode"] == "CONTRACT_EXPERIMENT"
    assert assessment_payload["contract_id"] == "contract-1"
    assert assessment_payload["result_trust"]["contract_validity_status"] == "VALID"


def test_build_download_path() -> None:
    assert build_download_path("artifact-123").endswith("/artifact-123/download")

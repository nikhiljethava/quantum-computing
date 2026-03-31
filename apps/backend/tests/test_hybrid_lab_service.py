"""Service-layer tests for the Hybrid Lab helpers."""

from foundry_backend.models.models import JobType
from foundry_backend.services.hybrid_lab import (
    architecture_from_context,
    build_assessment_preview,
    list_templates,
)


def test_list_templates_includes_expected_starters() -> None:
    templates = list_templates()

    keys = {template["key"] for template in templates}

    assert len(templates) == 5
    assert keys == {
        "coin_flip",
        "bell_state",
        "grover",
        "routing",
        "chemistry",
    }


def test_build_assessment_preview_is_deterministic() -> None:
    preview = build_assessment_preview(JobType.routing, use_case=None)

    assert 0 <= preview["score"] <= 100
    assert preview["horizon"] == "Prototype now"
    assert "simulation-first" in preview["explanation"][1].lower()
    assert preview["next_action"]


def test_architecture_mapper_keeps_hardware_optional() -> None:
    architecture = architecture_from_context(
        {
            "job_type": "routing",
            "qals_score": 0.61,
            "verdict": "Credible prototype candidate now",
        }
    )

    component_ids = {component.id for component in architecture.components}

    assert "circuit_runner" in component_ids
    assert "vertex_ai" in component_ids
    assert "quantum_computing_service" not in component_ids
    assert any("simulation" in note.lower() for note in architecture.notes)

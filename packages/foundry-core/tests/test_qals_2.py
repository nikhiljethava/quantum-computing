"""Unit tests for the QALS 2.0 deterministic rule/evidence engine."""

from foundry_core.assessment import run_qals_2, serialize_assessment_output


def _serialize(user_inputs: dict, **kwargs) -> dict:
    return serialize_assessment_output(run_qals_2(user_inputs=user_inputs, **kwargs))


def test_missing_baseline_caps_readiness_and_returns_benchmark_first() -> None:
    result = _serialize(
        {
            "industry": "logistics",
            "problemClass": "OPTIMIZATION",
            "problemDescription": "Routing and scheduling under capacity constraints",
            "problemSize": "hundreds of stops",
        }
    )

    assert result["verdict"] == "BENCHMARK_FIRST"
    assert result["confidence"] == "LOW"
    assert result["readiness_score"] <= 40
    assert result["build_eligibility"] == "LIMITED"
    assert "current classical baseline" in result["missing_evidence"]


def test_use_case_blueprint_baseline_does_not_count_as_user_declared_baseline() -> None:
    result = _serialize(
        {
            "industry": "logistics",
            "problemClass": "OPTIMIZATION",
            "problemDescription": "Routing and scheduling under capacity constraints",
            "problemSize": "hundreds of stops",
            "baselineMetrics": "Planner reports weekly route cost only",
        },
        use_case_blueprint={"classical_baseline": "OR-Tools seeded example baseline"},
    )

    assert result["verdict"] == "BENCHMARK_FIRST"
    assert result["confidence"] == "LOW"
    assert result["readiness_score"] <= 40
    assert result["build_eligibility"] == "LIMITED"
    assert "current classical baseline" in result["missing_evidence"]
    assert "OR-Tools seeded example baseline" not in result["classical_baseline_summary"]


def test_logistics_with_baseline_keeps_production_advantage_caveat() -> None:
    result = _serialize(
        {
            "industry": "logistics",
            "problemClass": "OPTIMIZATION",
            "problemDescription": "Vehicle routing with time windows and disruption handling",
            "problemSize": "80 stops in one region",
            "currentClassicalBaseline": "OR-Tools routing solver",
            "baselineMetrics": "12 minute solve time; 3 percent late delivery rate",
            "constraints": "capacity, shift length, time windows",
        }
    )

    assert result["verdict"] in {"SIMULATOR_PROTOTYPE_NOW", "BENCHMARK_FIRST"}
    assert any("Production advantage unproven" in caveat for caveat in result["caveats"])
    assert "BENCHMARK_CANDIDATE" in result["trust_labels"]


def test_battery_materials_returns_simulator_or_research_candidate() -> None:
    result = _serialize(
        {
            "industry": "energy",
            "objective": "Screen battery cathode materials",
            "problemClass": "QUANTUM_SIMULATION",
            "problemDescription": "Battery materials simulation for transition metal oxide fragments",
            "problemSize": "fragment active-space starter",
            "currentClassicalBaseline": "DFT / classical HPC workflow",
            "baselineMetrics": "48 hour batch cycle for shortlisted candidates",
            "constraints": "active-space selection and accuracy validation",
        },
        use_case_evidence_items=[{"title": "Materials study", "claim": "Simulator-first chemistry benchmark"}],
    )

    assert result["verdict"] in {"SIMULATOR_PROTOTYPE_NOW", "RESEARCH_PARTNERSHIP"}
    assert any(label in result["trust_labels"] for label in ["RESEARCH_CANDIDATE", "TOY_SIMULATION"])
    assert any("Future-hardware upside" in caveat for caveat in result["caveats"])


def test_crypto_with_classic_public_key_inventory_returns_pqc_now() -> None:
    result = _serialize(
        {
            "industry": "financial services",
            "problemClass": "CRYPTO_SECURITY",
            "problemDescription": "Inventory RSA, ECC, Diffie-Hellman, and ECDSA usage",
            "securityCryptoInventory": {
                "certificate_lifetime": "five years",
                "sensitivity": "regulated data and long-lived secrets",
            },
        }
    )

    assert result["verdict"] == "PQC_MIGRATION_NOW"
    assert result["time_horizon"] == "NOW_CLASSICAL"
    assert result["trust_labels"] == ["ACTION_NOW"]
    assert "QKD" in " ".join(result["caveats"])


def test_grover_search_includes_data_loading_caveat() -> None:
    result = _serialize(
        {
            "problemClass": "SEARCH",
            "problemDescription": "Grover-like search over records in a business database",
            "problemSize": "large index",
        }
    )

    assert result["verdict"] in {"EDUCATION_ONLY", "BENCHMARK_FIRST"}
    assert any("Data-loading" in caveat for caveat in result["caveats"])
    assert "data-loading or oracle construction path" in result["missing_evidence"]


def test_grover_search_treats_unclear_data_loading_as_missing() -> None:
    result = _serialize(
        {
            "problemClass": "SEARCH",
            "problemDescription": "Grover-like search with unclear data loading path",
            "constraints": "No oracle construction path has been defined.",
            "currentClassicalBaseline": "Elasticsearch / vector search",
            "baselineMetrics": "Sub-second lookup",
        }
    )

    assert result["verdict"] == "EDUCATION_ONLY"
    assert result["build_eligibility"] == "TUTORIAL_ONLY"
    assert "data-loading or oracle construction path" in result["missing_evidence"]
    assert any("vector-search replacement" in caveat for caveat in result["caveats"])


def test_all_assessment_outputs_include_required_contract_fields() -> None:
    result = _serialize(
        {
            "problemClass": "OPTIMIZATION",
            "problemDescription": "Portfolio optimization benchmark",
            "currentClassicalBaseline": "MILP solver",
            "baselineMetrics": "Objective gap and runtime recorded",
        }
    )

    required = {
        "verdict",
        "confidence",
        "time_horizon",
        "evidence_used",
        "missing_evidence",
        "assumptions",
        "trust_labels",
    }
    assert required.issubset(result)
    assert result["trust_labels"]
    assert result["assumptions"]

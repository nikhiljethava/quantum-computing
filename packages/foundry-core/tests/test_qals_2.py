"""Unit tests for the QALS 3.0 deterministic Algorithm Contract engine."""

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
    assert result["build_eligibility"] == "LIMITED_TUTORIAL_ONLY"
    assert result["recommended_contract_type"] in {"QUBO_ISING", "QAOA"}
    assert "BASELINE_REQUIRED" in result["trust_labels"]
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
    assert result["build_eligibility"] == "LIMITED_TUTORIAL_ONLY"
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
    assert "CONVERGENCE_UNCERTAIN" in result["trust_labels"]
    assert result["build_eligibility"] == "ELIGIBLE_FOR_BENCHMARK"


def test_chemistry_without_hamiltonian_path_requires_research_scoping() -> None:
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

    assert result["verdict"] == "RESEARCH_SCOPING_REQUIRED"
    assert result["recommended_contract_type"] == "HAMILTONIAN"
    assert result["build_eligibility"] == "LIMITED_TUTORIAL_ONLY"
    assert "HAMILTONIAN_DEPENDENT" in result["trust_labels"]
    assert "INSUFFICIENT_CONTRACT" in result["trust_labels"]
    assert "Hamiltonian path" in result["missing_inputs"]
    assert any("Future-hardware upside" in caveat for caveat in result["caveats"])


def test_vqe_without_ansatz_or_optimizer_is_tutorial_only() -> None:
    result = _serialize(
        {
            "industry": "energy",
            "objective": "Run a VQE battery-material fragment",
            "problemClass": "QUANTUM_SIMULATION",
            "problemDescription": "Battery materials VQE for an electrolyte fragment",
            "problemSize": "small fragment",
            "currentClassicalBaseline": "DFT / classical HPC workflow",
            "baselineMetrics": "48 hour batch cycle",
            "moleculeOrMaterialFragment": "LiH tutorial fragment",
            "hamiltonianPath": "OpenFermion placeholder path",
            "observable": "ground-state energy",
            "knownAlgorithmsConsidered": "VQE",
        }
    )

    assert result["recommended_contract_type"] == "VQE"
    assert result["recommended_algorithm_family"] == "VQE"
    assert result["build_eligibility"] == "LIMITED_TUTORIAL_ONLY"
    assert "CONVERGENCE_UNCERTAIN" in result["trust_labels"]
    assert "ansatz" in result["missing_inputs"]
    assert "optimizer" in result["missing_inputs"]


def test_vqe_with_contract_inputs_is_research_prototype() -> None:
    result = _serialize(
        {
            "industry": "energy",
            "objective": "Run a VQE battery-material fragment",
            "problemClass": "QUANTUM_SIMULATION",
            "problemDescription": "Battery materials VQE for a supplied electrolyte fragment",
            "problemSize": "small fragment",
            "currentClassicalBaseline": "DFT / classical HPC workflow",
            "baselineMetrics": "48 hour batch cycle",
            "moleculeOrMaterialFragment": "User-supplied electrolyte fragment",
            "hamiltonianPath": "OpenFermion active-space generation path",
            "observable": "ground-state energy",
            "ansatz": "hardware efficient ansatz",
            "optimizer": "COBYLA",
            "accuracyNeeds": "convergence below target delta",
            "knownAlgorithmsConsidered": "VQE",
        }
    )

    assert result["verdict"] == "SIMULATOR_PROTOTYPE_NOW"
    assert result["contract_validity_status"] == "VALID"
    assert result["build_eligibility"] == "ELIGIBLE_FOR_RESEARCH_PROTOTYPE"
    assert "HAMILTONIAN_DEPENDENT" in result["trust_labels"]
    assert "CONVERGENCE_UNCERTAIN" in result["trust_labels"]


def test_crypto_with_incomplete_inventory_returns_inventory_first() -> None:
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

    assert result["verdict"] == "INVENTORY_FIRST"
    assert result["time_horizon"] == "NOW_CLASSICAL"
    assert result["trust_labels"] == ["ACTION_NOW"]
    assert result["build_eligibility"] == "NON_COMPUTE_ACTION_ONLY"
    assert "QKD" in " ".join(result["caveats"])


def test_crypto_with_complete_public_key_inventory_returns_pqc_now() -> None:
    result = _serialize(
        {
            "industry": "financial services",
            "problemClass": "CRYPTO_SECURITY",
            "problemDescription": "Inventory RSA, ECC, Diffie-Hellman, and ECDSA usage",
            "securityCryptoInventory": {
                "systemsAffected": "TLS, VPN, code signing",
                "dataShelfLifeYears": "10",
                "migrationTimeYears": "4",
                "assumedQuantumCollapseTimeYears": "12",
                "certificateLifetimes": "five years",
                "systemOwners": "security architecture",
                "cryptoAgilityStatus": "partial",
                "inventoryCompleteness": "complete",
            },
        }
    )

    assert result["verdict"] == "PQC_MIGRATION_NOW"
    assert result["recommended_contract_type"] == "PQC_RISK"
    assert result["recommended_algorithm_family"] == "PQC_READINESS"
    assert result["build_eligibility"] == "NON_COMPUTE_ACTION_ONLY"


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
    assert "ORACLE_DEPENDENT" in result["trust_labels"]


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
    assert result["build_eligibility"] == "LIMITED_TUTORIAL_ONLY"
    assert "data-loading or oracle construction path" in result["missing_evidence"]
    assert any("vector-search replacement" in caveat for caveat in result["caveats"])


def test_grover_with_oracle_includes_oracle_and_data_loading_caveats() -> None:
    result = _serialize(
        {
            "problemClass": "SEARCH",
            "problemDescription": "Grover-like search over a tiny encoded list",
            "predicateDefinition": "mark delayed shipment records with priority flag",
            "inputSizeN": "64",
            "markedItemCountM": "1",
            "dataLoadingAssumption": "toy encoded list, not production database loading",
            "currentClassicalBaseline": "Elasticsearch / vector search",
            "baselineMetrics": "Sub-second lookup",
        }
    )

    assert result["recommended_contract_type"] == "ORACLE"
    assert "ORACLE_DEPENDENT" in result["trust_labels"]
    assert result["build_eligibility"] in {"ELIGIBLE_FOR_TOY_EXPERIMENT", "LIMITED_TUTORIAL_ONLY"}
    assert any("Data-loading" in caveat for caveat in result["caveats"])


def test_phase_estimation_defaults_to_ftqc_later() -> None:
    result = _serialize(
        {
            "problemClass": "QUANTUM_SIMULATION",
            "problemDescription": "Phase estimation for chemistry energy estimation",
            "knownAlgorithmsConsidered": "phase estimation",
            "moleculeOrMaterialFragment": "H2",
            "hamiltonianPath": "sample Hamiltonian",
            "observable": "energy",
            "currentClassicalBaseline": "DFT",
            "baselineMetrics": "toy sample",
        }
    )

    assert result["recommended_algorithm_family"] == "PHASE_ESTIMATION"
    assert result["time_horizon"] == "FTQC_LATER"
    assert "FTQC_LATER" in result["trust_labels"]
    assert result["build_eligibility"] == "LIMITED_TUTORIAL_ONLY"


def test_shor_tiny_demo_is_overcompiled_tutorial() -> None:
    result = _serialize(
        {
            "problemClass": "CRYPTO_SECURITY",
            "problemDescription": "Shor period finding tiny factoring demo",
            "knownAlgorithmsConsidered": "Shor period finding",
        }
    )

    assert result["recommended_contract_type"] == "PERIOD_ORDER"
    assert result["recommended_algorithm_family"] == "SHOR_PERIOD_FINDING"
    assert result["build_eligibility"] == "LIMITED_TUTORIAL_ONLY"
    assert "OVERCOMPILED_DEMO" in result["trust_labels"]


def test_real_hardware_assumption_adds_hardware_gated() -> None:
    result = _serialize(
        {
            "problemClass": "OPTIMIZATION",
            "problemDescription": "Run QAOA on real quantum hardware",
            "currentClassicalBaseline": "OR-Tools",
            "baselineMetrics": "runtime and objective recorded",
            "assumesRealHardware": True,
        }
    )

    assert "HARDWARE_GATED" in result["trust_labels"]
    assert any("approved access" in caveat for caveat in result["caveats"])


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
        "recommended_contract_type",
        "recommended_algorithm_family",
        "contract_validity_status",
        "build_eligibility",
        "resource_estimate",
    }
    assert required.issubset(result)
    assert result["trust_labels"]
    assert result["assumptions"]

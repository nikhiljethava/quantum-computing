"""Contract-specific architecture mapper tests."""

import pytest

from foundry_core.mapping.gcp_mapper import build_architecture_map


@pytest.mark.parametrize(
    ("problem_class", "contract_type", "required_ids"),
    [
        (
            "OPTIMIZATION",
            "QAOA",
            {
                "optimization_input",
                "problem_construction",
                "classical_solver_baseline",
                "qubo_formulation",
                "circuit_runner",
                "vertex_ai",
                "comparison_decision",
            },
        ),
        (
            "QUANTUM_SIMULATION",
            "VQE",
            {
                "molecule_definition",
                "basis_active_space",
                "hamiltonian_construction",
                "openfermion_cirq_path",
                "circuit_runner",
                "classical_chemistry_baseline",
                "result_interpretation",
                "future_resource_estimation",
            },
        ),
        (
            "SEARCH",
            "ORACLE",
            {
                "search_space",
                "oracle_contract",
                "data_loading",
                "circuit_runner",
                "query_complexity",
                "end_to_end_caveats",
            },
        ),
    ],
)
def test_compute_contract_maps_include_required_workflow_nodes(
    problem_class: str,
    contract_type: str,
    required_ids: set[str],
) -> None:
    architecture = build_architecture_map(
        {
            "problem_class": problem_class,
            "contract_type": contract_type,
            "time_horizon": "SIMULATOR_NOW",
            "classical_baseline": "Declared baseline",
            "trust_labels": ["BENCHMARK_CANDIDATE"],
            "assumptions": ["Scoped test assumption"],
        }
    )

    component_ids = {component.id for component in architecture.components}
    assert required_ids <= component_ids
    assert any(component.execution_kind == "simulated_quantum" for component in architecture.components)
    assert any(
        component.execution_kind == "optional_approved_hardware"
        for component in architecture.components
    )
    assert architecture.time_horizon == "SIMULATOR_NOW"
    assert architecture.assumptions == ["Scoped test assumption"]


def test_pqc_map_is_classical_and_has_no_circuit_or_qpu_node() -> None:
    architecture = build_architecture_map(
        {
            "problem_class": "CRYPTO_SECURITY",
            "contract_type": "PQC_RISK",
            "time_horizon": "NOW_CLASSICAL",
            "trust_labels": ["ACTION_NOW"],
        }
    )

    component_ids = {component.id for component in architecture.components}
    required_ids = {
        "crypto_inventory",
        "risk_clock",
        "prioritization",
        "standards_selection",
        "interop_testing",
        "staged_migration",
        "crypto_agility",
        "pqc_memo",
    }
    assert required_ids == component_ids
    assert all(component.execution_kind == "classical" for component in architecture.components)
    assert not any("circuit" in component.id.lower() for component in architecture.components)
    assert not any("qpu" in component.id.lower() for component in architecture.components)
    assert not any("hardware" in component.id.lower() for component in architecture.components)
    assert "does not create a quantum circuit" in architecture.summary.lower()


def test_every_map_component_has_a_supported_execution_kind() -> None:
    allowed = {
        "classical",
        "simulated_quantum",
        "optional_approved_hardware",
        "future_only",
    }

    for problem_class in [
        "OPTIMIZATION",
        "QUANTUM_SIMULATION",
        "SEARCH",
        "CRYPTO_SECURITY",
        "UNKNOWN",
    ]:
        architecture = build_architecture_map({"problem_class": problem_class})
        assert architecture.components
        assert {component.execution_kind for component in architecture.components} <= allowed

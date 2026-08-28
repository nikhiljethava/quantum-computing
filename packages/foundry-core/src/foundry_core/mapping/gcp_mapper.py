"""Deterministic, contract-specific Google Cloud hybrid architecture mapper."""

from __future__ import annotations

import dataclasses
from typing import Any

HARDWARE_ACCESS_NOTE = (
    "Google quantum hardware access is restricted to approved groups. "
    "Quantum Foundry is simulation-first unless approved access is configured."
)

CLASSICAL = "classical"
SIMULATED_QUANTUM = "simulated_quantum"
OPTIONAL_APPROVED_HARDWARE = "optional_approved_hardware"
FUTURE_ONLY = "future_only"


@dataclasses.dataclass(frozen=True)
class GcpComponent:
    id: str
    name: str
    service: str
    description: str
    execution_kind: str = CLASSICAL


@dataclasses.dataclass(frozen=True)
class ArchitectureMap:
    title: str
    summary: str
    components: list[GcpComponent]
    connections: list[tuple[str, str]]
    notes: list[str]
    problem_class: str = "UNKNOWN"
    contract_type: str = "TUTORIAL"
    time_horizon: str = "SIMULATOR_NOW"
    assumptions: list[str] = dataclasses.field(default_factory=list)
    trust_labels: list[str] = dataclasses.field(default_factory=list)


def _component(
    component_id: str,
    name: str,
    service: str,
    description: str,
    execution_kind: str = CLASSICAL,
) -> GcpComponent:
    return GcpComponent(
        id=component_id,
        name=name,
        service=service,
        description=description,
        execution_kind=execution_kind,
    )


def _connections(components: list[GcpComponent]) -> list[tuple[str, str]]:
    return [(left.id, right.id) for left, right in zip(components, components[1:])]


def _infer_problem_class(context: dict[str, Any]) -> str:
    explicit = str(context.get("problem_class", "")).upper()
    if explicit:
        return explicit

    contract_type = str(context.get("contract_type", "")).upper()
    if contract_type in {"QUBO_ISING", "QAOA"}:
        return "OPTIMIZATION"
    if contract_type in {"HAMILTONIAN", "VQE", "TROTTER"}:
        return "QUANTUM_SIMULATION"
    if contract_type == "ORACLE":
        return "SEARCH"
    if contract_type == "PQC_RISK":
        return "CRYPTO_SECURITY"

    job_type = str(context.get("job_type", "")).lower()
    if job_type == "routing":
        return "OPTIMIZATION"
    if job_type == "chemistry":
        return "QUANTUM_SIMULATION"
    if job_type == "grover":
        return "SEARCH"
    return "UNKNOWN"


def _context_fields(context: dict[str, Any]) -> tuple[str, str, str, list[str], list[str]]:
    problem_class = _infer_problem_class(context)
    contract_type = str(context.get("contract_type", "TUTORIAL") or "TUTORIAL").upper()
    time_horizon = str(context.get("time_horizon", "SIMULATOR_NOW") or "SIMULATOR_NOW")
    assumptions = [str(item) for item in context.get("assumptions", [])]
    trust_labels = [str(item) for item in context.get("trust_labels", [])]
    return problem_class, contract_type, time_horizon, assumptions, trust_labels


def _base_notes(*, time_horizon: str) -> list[str]:
    return [
        "Each node identifies whether the work is classical, simulated quantum, optional approved hardware, or future-only.",
        f"Declared time horizon: {time_horizon.replace('_', ' ').lower()}.",
        "Simulation is classical computation of a quantum circuit and is not a measured hardware result.",
        HARDWARE_ACCESS_NOTE,
    ]


def _optimization_map(context: dict[str, Any]) -> ArchitectureMap:
    problem_class, contract_type, horizon, assumptions, labels = _context_fields(context)
    baseline = str(context.get("classical_baseline", "Declared solver baseline"))
    components = [
        _component("optimization_input", "Input Data", "BigQuery / Cloud Storage", "Routing, scheduling, portfolio, or allocation instance data."),
        _component("problem_construction", "Classical Problem Construction", "Cloud Run", "Validate variables and constraints, then freeze a benchmark instance."),
        _component("classical_solver_baseline", "Declared Classical Solver Baseline", "Cloud Run Jobs", baseline or "OR-Tools, MILP, or a declared internal solver."),
        _component("qubo_formulation", "QUBO or Ising Formulation", "Python Worker", "Encode the scoped objective, constraints, and penalty terms."),
        _component("circuit_runner", "Cirq / qsim Experiment", "Cloud Run Jobs", "Run a small QAOA-style toy simulation.", SIMULATED_QUANTUM),
        _component("vertex_ai", "Classical Optimizer Loop", "Vertex AI / Cloud Run", "Update circuit parameters and track convergence as a classical loop."),
        _component("comparison_decision", "Comparison and Decision Output", "BigQuery / Cloud Storage", "Compare objective quality, runtime, stability, and cost with the declared baseline."),
        _component("hardware_gate", "Optional Approved Hardware", "Access Control", "An access-controlled branch only after benchmark evidence and approval.", OPTIONAL_APPROVED_HARDWARE),
    ]
    return ArchitectureMap(
        title="Optimization Algorithm Contract Architecture",
        summary=(
            "A benchmark-first hybrid loop constructs one classical instance, records the declared "
            "solver baseline, simulates the QUBO/QAOA candidate, and compares both paths. "
            "Production advantage remains unproven."
        ),
        components=components,
        connections=_connections(components[:-1]) + [("comparison_decision", "hardware_gate")],
        notes=_base_notes(time_horizon=horizon)
        + ["Classical baseline required; use identical instances and success metrics for comparison."],
        problem_class=problem_class,
        contract_type=contract_type,
        time_horizon=horizon,
        assumptions=assumptions,
        trust_labels=labels or ["BENCHMARK_CANDIDATE"],
    )


def _chemistry_map(context: dict[str, Any]) -> ArchitectureMap:
    problem_class, contract_type, horizon, assumptions, labels = _context_fields(context)
    baseline = str(context.get("classical_baseline", "DFT / classical HPC workflow"))
    components = [
        _component("molecule_definition", "Molecule or Material Definition", "Cloud Storage", "Version the supplied fragment, geometry, charge, and provenance."),
        _component("basis_active_space", "Basis and Active-Space Assumptions", "Python Worker", "Record basis, active-space, frozen-core, and mapping assumptions."),
        _component("hamiltonian_construction", "Hamiltonian Construction", "OpenFermion / Cloud Run Jobs", "Construct or import the scoped Hamiltonian and target observable."),
        _component("openfermion_cirq_path", "OpenFermion / Cirq Path", "Python Worker", "Transform the Hamiltonian and prepare the selected VQE, Trotter, or estimation circuit."),
        _component("circuit_runner", "Simulator", "Cirq / qsim on Cloud Run Jobs", "Execute the scoped small-instance simulation.", SIMULATED_QUANTUM),
        _component("classical_chemistry_baseline", "Classical Chemistry Baseline", "HPC / Cloud Run", baseline or "DFT or a declared classical chemistry workflow."),
        _component("result_interpretation", "Result Interpretation", "BigQuery / Cloud Storage", "Compare energy, convergence, uncertainty, and resource assumptions."),
        _component("future_resource_estimation", "Future Resource-Estimation Path", "Research Review", "Estimate logical resources before any future-hardware decision.", FUTURE_ONLY),
        _component("hardware_gate", "Optional Approved Hardware", "Access Control", "Future, approved-access hardware branch only.", OPTIONAL_APPROVED_HARDWARE),
    ]
    return ArchitectureMap(
        title="Chemistry and Materials Algorithm Contract Architecture",
        summary=(
            "A simulator-first chemistry workflow keeps molecule definition, Hamiltonian construction, "
            "the classical chemistry baseline, and result interpretation visible. Toy simulation does "
            "not imply near-term production advantage; it provides research scoping and future-hardware upside."
        ),
        components=components,
        connections=_connections(components[:-1]) + [("future_resource_estimation", "hardware_gate")],
        notes=_base_notes(time_horizon=horizon)
        + ["Basis, active-space, Hamiltonian, observable, ansatz, and optimizer assumptions must remain attached."],
        problem_class=problem_class,
        contract_type=contract_type,
        time_horizon=horizon,
        assumptions=assumptions,
        trust_labels=labels or ["RESEARCH_CANDIDATE", "HAMILTONIAN_DEPENDENT"],
    )


def _search_map(context: dict[str, Any]) -> ArchitectureMap:
    problem_class, contract_type, horizon, assumptions, labels = _context_fields(context)
    components = [
        _component("search_space", "Search-Space Definition", "BigQuery / Cloud Storage", "Define N, expected marked items M, and the scoped decision."),
        _component("oracle_contract", "Oracle Contract", "Cloud Run", "Specify the reversible predicate and oracle-construction cost."),
        _component("data_loading", "Data-Loading Assumption", "Python Worker", "State how data becomes an oracle input without hiding loading cost."),
        _component("circuit_runner", "Circuit and Simulator", "Cirq / qsim on Cloud Run Jobs", "Run the small Grover-style tutorial or benchmark circuit.", SIMULATED_QUANTUM),
        _component("query_complexity", "Query-Complexity Result", "Cloud Run", "Report oracle-query counts separately from end-to-end runtime."),
        _component("end_to_end_caveats", "End-to-End Caveats", "Cloud Storage", "Preserve oracle, data-loading, error-correction, and baseline caveats."),
        _component("future_resource_estimation", "Future Fault-Tolerant Path", "Research Review", "Estimate fault-tolerant resources before larger claims.", FUTURE_ONLY),
        _component("hardware_gate", "Optional Approved Hardware", "Access Control", "Approved-access branch only after contract and resource review.", OPTIONAL_APPROVED_HARDWARE),
    ]
    return ArchitectureMap(
        title="Grover Search Oracle Contract Architecture",
        summary=(
            "The map separates the search-space and oracle contract from the simulated circuit, then "
            "reports query complexity alongside data-loading and end-to-end caveats. It is not a generic "
            "database or vector-search replacement."
        ),
        components=components,
        connections=_connections(components[:-1]) + [("future_resource_estimation", "hardware_gate")],
        notes=_base_notes(time_horizon=horizon)
        + ["Grover's O(sqrt(N)) query statement assumes an efficient oracle; construction and loading still matter."],
        problem_class=problem_class,
        contract_type=contract_type,
        time_horizon=horizon,
        assumptions=assumptions,
        trust_labels=labels or ["ORACLE_DEPENDENT", "TOY_SIMULATION"],
    )


def _pqc_map(context: dict[str, Any]) -> ArchitectureMap:
    problem_class, contract_type, horizon, assumptions, labels = _context_fields(context)
    components = [
        _component("crypto_inventory", "Cryptographic Inventory", "BigQuery / Cloud SQL", "Inventory algorithms, certificates, protocols, systems, data, and owners."),
        _component("risk_clock", "Data-Lifetime and Risk-Clock Analysis", "Cloud Run", "Compare retention sensitivity, migration time, and the assumed risk horizon."),
        _component("prioritization", "Migration Prioritization", "Cloud Run", "Rank systems by exposure, data lifetime, dependency, and remediation complexity."),
        _component("standards_selection", "Standards and Algorithm Selection", "Security Review", "Select standards-aligned post-quantum options for each protocol and use case."),
        _component("interop_testing", "Interoperability and Performance Testing", "Cloud Run Jobs", "Measure compatibility, latency, size, failure modes, and rollback behavior."),
        _component("staged_migration", "Staged Migration", "Cloud Deploy / Existing CI", "Pilot, dual-stack where appropriate, roll out, and verify by system group."),
        _component("crypto_agility", "Crypto-Agility Monitoring", "Cloud Monitoring", "Track inventory coverage, exceptions, ownership, and future algorithm changes."),
        _component("pqc_memo", "PQC Migration Memo", "Cloud Storage", "Export the inventory status, assumptions, priorities, stages, and next decision."),
    ]
    return ArchitectureMap(
        title="Post-Quantum Cryptography Migration Architecture",
        summary=(
            "A classical security-migration workflow moves from cryptographic inventory through "
            "risk-clock analysis, standards-aware testing, staged migration, and crypto-agility monitoring. "
            "It does not create a quantum circuit or recommend QKD by default."
        ),
        components=components,
        connections=_connections(components),
        notes=[
            "All steps in this map are classical security and migration work.",
            "No QPU, quantum circuit, or public hardware execution path is included.",
            f"Declared time horizon: {horizon.replace('_', ' ').lower()}.",
            "Use a current cryptographic inventory and standards review as evidence for migration decisions.",
        ],
        problem_class=problem_class,
        contract_type=contract_type if contract_type != "TUTORIAL" else "PQC_RISK",
        time_horizon=horizon,
        assumptions=assumptions,
        trust_labels=labels or ["ACTION_NOW"],
    )


def _generic_map(context: dict[str, Any]) -> ArchitectureMap:
    problem_class, contract_type, horizon, assumptions, labels = _context_fields(context)
    components = [
        _component("input_data", "Input Data", "BigQuery / Cloud Storage", "Evidence files, benchmark data, and declared workload inputs."),
        _component("classical_preprocessing", "Classical Preprocessing", "Cloud Run", "Validate the contract, baseline, assumptions, and scoped instance."),
        _component("circuit_runner", "Quantum Kernel / Simulation Worker", "Cirq / qsim on Cloud Run Jobs", "Run a clearly labeled tutorial or simulator-first kernel.", SIMULATED_QUANTUM),
        _component("classical_postprocessing", "Classical Post-Processing", "Cloud Run", "Compare outputs with the baseline and package limitations."),
        _component("artifact_export", "Decision and Artifact Export", "Cloud Storage", "Store the trust context, map, and educational or contract-backed artifacts."),
        _component("hardware_gate", "Optional Approved Hardware", "Access Control", "Hardware access-controlled and outside the default public path.", OPTIONAL_APPROVED_HARDWARE),
    ]
    return ArchitectureMap(
        title="Hybrid Workflow Architecture",
        summary="A generic simulator-first path used until an Algorithm Contract selects a more specific workflow.",
        components=components,
        connections=_connections(components),
        notes=_base_notes(time_horizon=horizon)
        + ["Complete the Algorithm Contract to replace this generic map with a contract-specific topology."],
        problem_class=problem_class,
        contract_type=contract_type,
        time_horizon=horizon,
        assumptions=assumptions,
        trust_labels=labels or ["TUTORIAL"],
    )


def build_architecture_map(context: dict[str, Any]) -> ArchitectureMap:
    """Build a deterministic architecture from assessment or tutorial context."""

    problem_class = _infer_problem_class(context)
    if problem_class == "OPTIMIZATION":
        return _optimization_map(context)
    if problem_class == "QUANTUM_SIMULATION":
        return _chemistry_map(context)
    if problem_class == "SEARCH":
        return _search_map(context)
    if problem_class == "CRYPTO_SECURITY":
        return _pqc_map(context)
    return _generic_map(context)

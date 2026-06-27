"""QALS 3.0 deterministic assessment engine.

QALS 3.0 is intentionally a transparent rules and evidence engine. It scores
Algorithm Contract quality instead of vague quantum relevance, does not claim
quantum advantage, does not use ML scoring, and keeps the readiness score
secondary to a defensible verdict.
"""

from __future__ import annotations

import dataclasses
import enum
import re
from datetime import datetime, timezone
from typing import Any


class ProblemClass(str, enum.Enum):
    QUANTUM_SIMULATION = "QUANTUM_SIMULATION"
    OPTIMIZATION = "OPTIMIZATION"
    SEARCH = "SEARCH"
    LINEAR_SYSTEMS = "LINEAR_SYSTEMS"
    CRYPTO_SECURITY = "CRYPTO_SECURITY"
    QUANTUM_ML = "QUANTUM_ML"
    COMMUNICATION = "COMMUNICATION"
    UNKNOWN = "UNKNOWN"


class Verdict(str, enum.Enum):
    CLASSICAL_FIRST = "CLASSICAL_FIRST"
    INVENTORY_FIRST = "INVENTORY_FIRST"
    RESEARCH_SCOPING_REQUIRED = "RESEARCH_SCOPING_REQUIRED"
    EDUCATION_ONLY = "EDUCATION_ONLY"
    BENCHMARK_FIRST = "BENCHMARK_FIRST"
    SIMULATOR_PROTOTYPE_NOW = "SIMULATOR_PROTOTYPE_NOW"
    RESEARCH_PARTNERSHIP = "RESEARCH_PARTNERSHIP"
    FUTURE_FTQC = "FUTURE_FTQC"
    PQC_MIGRATION_NOW = "PQC_MIGRATION_NOW"


class Confidence(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TimeHorizon(str, enum.Enum):
    NOW_CLASSICAL = "NOW_CLASSICAL"
    SIMULATOR_NOW = "SIMULATOR_NOW"
    NISQ_EXPLORATION = "NISQ_EXPLORATION"
    HARDWARE_GATED = "HARDWARE_GATED"
    FTQC_LATER = "FTQC_LATER"


class TrustLabel(str, enum.Enum):
    TUTORIAL = "TUTORIAL"
    TOY_SIMULATION = "TOY_SIMULATION"
    OVERCOMPILED_DEMO = "OVERCOMPILED_DEMO"
    MEANINGFUL_SMALL_INSTANCE = "MEANINGFUL_SMALL_INSTANCE"
    BENCHMARK_CANDIDATE = "BENCHMARK_CANDIDATE"
    RESEARCH_CANDIDATE = "RESEARCH_CANDIDATE"
    HARDWARE_GATED = "HARDWARE_GATED"
    FTQC_LATER = "FTQC_LATER"
    ACTION_NOW = "ACTION_NOW"
    ORACLE_DEPENDENT = "ORACLE_DEPENDENT"
    HAMILTONIAN_DEPENDENT = "HAMILTONIAN_DEPENDENT"
    CONVERGENCE_UNCERTAIN = "CONVERGENCE_UNCERTAIN"
    BASELINE_REQUIRED = "BASELINE_REQUIRED"
    INSUFFICIENT_CONTRACT = "INSUFFICIENT_CONTRACT"


class BuildEligibility(str, enum.Enum):
    BLOCKED = "BLOCKED"
    LIMITED_TUTORIAL_ONLY = "LIMITED_TUTORIAL_ONLY"
    ELIGIBLE_FOR_TOY_EXPERIMENT = "ELIGIBLE_FOR_TOY_EXPERIMENT"
    ELIGIBLE_FOR_BENCHMARK = "ELIGIBLE_FOR_BENCHMARK"
    ELIGIBLE_FOR_RESEARCH_PROTOTYPE = "ELIGIBLE_FOR_RESEARCH_PROTOTYPE"
    NON_COMPUTE_ACTION_ONLY = "NON_COMPUTE_ACTION_ONLY"


class AlgorithmFamily(str, enum.Enum):
    SHOR_PERIOD_FINDING = "SHOR_PERIOD_FINDING"
    QUANTUM_FOURIER_TRANSFORM = "QUANTUM_FOURIER_TRANSFORM"
    GROVER_SEARCH = "GROVER_SEARCH"
    AMPLITUDE_AMPLIFICATION = "AMPLITUDE_AMPLIFICATION"
    HAMILTONIAN_SIMULATION = "HAMILTONIAN_SIMULATION"
    TROTTERIZATION = "TROTTERIZATION"
    PHASE_ESTIMATION = "PHASE_ESTIMATION"
    VQE = "VQE"
    QAOA = "QAOA"
    ADIABATIC_AQC = "ADIABATIC_AQC"
    QUANTUM_ANNEALING = "QUANTUM_ANNEALING"
    PQC_READINESS = "PQC_READINESS"
    UNKNOWN = "UNKNOWN"


class ContractType(str, enum.Enum):
    HAMILTONIAN = "HAMILTONIAN"
    VQE = "VQE"
    TROTTER = "TROTTER"
    QUBO_ISING = "QUBO_ISING"
    QAOA = "QAOA"
    ORACLE = "ORACLE"
    PERIOD_ORDER = "PERIOD_ORDER"
    PQC_RISK = "PQC_RISK"
    TUTORIAL = "TUTORIAL"


class ContractValidityStatus(str, enum.Enum):
    VALID = "VALID"
    PARTIAL = "PARTIAL"
    INVALID = "INVALID"
    TUTORIAL_ONLY = "TUTORIAL_ONLY"


@dataclasses.dataclass(frozen=True)
class AssessmentInput:
    industry: str = ""
    objective: str = ""
    problem_class: ProblemClass = ProblemClass.UNKNOWN
    problem_description: str = ""
    business_value: str = ""
    data_type: str = ""
    problem_size: str = ""
    constraints: str = ""
    accuracy_needs: str = ""
    latency_tolerance: str = ""
    current_classical_baseline: str = ""
    baseline_metrics: str = ""
    current_solver_or_workflow: str = ""
    known_algorithms_considered: str = ""
    evidence_links: list[str] = dataclasses.field(default_factory=list)
    user_files_or_notes: str = ""
    security_crypto_inventory: dict[str, Any] = dataclasses.field(default_factory=dict)
    molecule_or_material_fragment: str = ""
    hamiltonian_path: str = ""
    observable: str = ""
    ansatz: str = ""
    optimizer: str = ""
    qubo_variables: str = ""
    qubo_constraints: str = ""
    qubo_objective: str = ""
    penalty_terms: str = ""
    predicate_definition: str = ""
    input_size_n: str = ""
    marked_item_count_m: str = ""
    data_loading_assumption: str = ""
    function_description: str = ""
    assumes_real_hardware: bool = False
    tutorial_sample_selected: bool = False


@dataclasses.dataclass(frozen=True)
class AssessmentOutput:
    id: str
    created_at: str
    verdict: Verdict
    readiness_score: int
    confidence: Confidence
    time_horizon: TimeHorizon
    trust_labels: list[TrustLabel]
    problem_class: ProblemClass
    recommended_contract_type: ContractType
    recommended_algorithm_family: AlgorithmFamily
    contract_validity_status: ContractValidityStatus
    plain_english_recommendation: str
    classical_baseline_summary: str
    quantum_candidate_summary: str
    evidence_used: list[str]
    missing_evidence: list[str]
    assumptions: list[str]
    caveats: list[str]
    next_best_action: str
    build_eligibility: BuildEligibility
    recommended_experiment_type: str
    hardware_assumptions: list[str]
    mathematical_object: str
    reduction_summary: str
    required_inputs: list[str]
    provided_inputs: list[str]
    missing_inputs: list[str]
    benchmark_plan: str
    resource_estimate: dict[str, Any]
    exportable_memo: str


_PROBLEM_CLASS_ALIASES: dict[str, ProblemClass] = {
    "quantum_simulation": ProblemClass.QUANTUM_SIMULATION,
    "simulation": ProblemClass.QUANTUM_SIMULATION,
    "chemistry": ProblemClass.QUANTUM_SIMULATION,
    "materials": ProblemClass.QUANTUM_SIMULATION,
    "optimization": ProblemClass.OPTIMIZATION,
    "optimisation": ProblemClass.OPTIMIZATION,
    "search": ProblemClass.SEARCH,
    "grover": ProblemClass.SEARCH,
    "linear_systems": ProblemClass.LINEAR_SYSTEMS,
    "linear systems": ProblemClass.LINEAR_SYSTEMS,
    "hhl": ProblemClass.LINEAR_SYSTEMS,
    "crypto_security": ProblemClass.CRYPTO_SECURITY,
    "security": ProblemClass.CRYPTO_SECURITY,
    "crypto": ProblemClass.CRYPTO_SECURITY,
    "post-quantum": ProblemClass.CRYPTO_SECURITY,
    "pqc": ProblemClass.CRYPTO_SECURITY,
    "quantum_ml": ProblemClass.QUANTUM_ML,
    "quantum machine learning": ProblemClass.QUANTUM_ML,
    "qml": ProblemClass.QUANTUM_ML,
    "communication": ProblemClass.COMMUNICATION,
    "qkd": ProblemClass.COMMUNICATION,
}

_CRYPTO_KEYWORDS = (
    "rsa",
    "ecc",
    "diffie-hellman",
    "diffie hellman",
    "ecdsa",
    "long-lived secret",
    "long lived secret",
    "certificate inventory",
    "regulated data",
    "harvest-now-decrypt-later",
    "harvest now decrypt later",
)
_SIMULATION_KEYWORDS = (
    "chemistry",
    "materials",
    "battery",
    "batteries",
    "catalyst",
    "drug discovery",
    "molecular",
    "molecule",
    "electronic structure",
)
_OPTIMIZATION_KEYWORDS = (
    "routing",
    "scheduling",
    "portfolio",
    "supply chain",
    "resource allocation",
    "optimization",
    "qubo",
    "milp",
)
_SEARCH_KEYWORDS = ("grover", "search", "oracle", "database")
_LINEAR_KEYWORDS = ("linear system", "hhl", "cfd", "finite element")
_QML_KEYWORDS = ("machine learning", "classification", "kernel", "qml")
_PHASE_ESTIMATION_KEYWORDS = ("phase estimation", "qpe")
_SHOR_KEYWORDS = ("shor", "period finding", "order finding", "factoring")
_HARDWARE_KEYWORDS = ("real quantum hardware", "quantum hardware", "hardware run", "processor")


def _lookup(payload: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload:
            return payload[key]
    return None


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _listify(value: Any) -> list[str]:
    if value is None or value == "":
        return []
    if isinstance(value, str):
        parts = [part.strip() for part in re.split(r"[\n,]+", value) if part.strip()]
        return parts or [value.strip()]
    if isinstance(value, list):
        return [_clean(item) for item in value if _clean(item)]
    return [_clean(value)]


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return _clean(value).lower() in {"1", "true", "yes", "y", "selected", "on"}


def _contains_any(text: str, needles: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(needle in lowered for needle in needles)


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []
    for item in items:
        cleaned = item.strip()
        if not cleaned or cleaned.lower() in seen:
            continue
        seen.add(cleaned.lower())
        unique.append(cleaned)
    return unique


def _parse_problem_class(value: Any) -> ProblemClass:
    if isinstance(value, ProblemClass):
        return value
    raw = _clean(value)
    if not raw:
        return ProblemClass.UNKNOWN
    try:
        return ProblemClass(raw)
    except ValueError:
        return _PROBLEM_CLASS_ALIASES.get(raw.lower().replace("-", "_"), ProblemClass.UNKNOWN)


def _derive_problem_class(candidate: ProblemClass, text: str) -> ProblemClass:
    if candidate != ProblemClass.UNKNOWN:
        return candidate
    if _contains_any(text, _CRYPTO_KEYWORDS):
        return ProblemClass.CRYPTO_SECURITY
    if _contains_any(text, _SIMULATION_KEYWORDS):
        return ProblemClass.QUANTUM_SIMULATION
    if _contains_any(text, _OPTIMIZATION_KEYWORDS):
        return ProblemClass.OPTIMIZATION
    if _contains_any(text, _SEARCH_KEYWORDS):
        return ProblemClass.SEARCH
    if _contains_any(text, _LINEAR_KEYWORDS):
        return ProblemClass.LINEAR_SYSTEMS
    if _contains_any(text, _QML_KEYWORDS):
        return ProblemClass.QUANTUM_ML
    return ProblemClass.UNKNOWN


def normalize_assessment_input(
    user_inputs: dict[str, Any],
    *,
    use_case_title: str = "",
    use_case_description: str = "",
    use_case_industry: str = "",
    use_case_quantum_approach: str = "",
    use_case_blueprint: dict[str, Any] | None = None,
) -> AssessmentInput:
    """Normalize frontend/API payloads, including legacy QALS-lite keys."""

    blueprint = use_case_blueprint or {}
    combined_text = " ".join(
        _clean(part)
        for part in (
            use_case_title,
            use_case_description,
            use_case_industry,
            use_case_quantum_approach,
            _lookup(user_inputs, "problemDescription", "problem_description"),
            _lookup(user_inputs, "objective"),
            _lookup(user_inputs, "knownAlgorithmsConsidered", "known_algorithms_considered"),
            _lookup(user_inputs, "securityCryptoInventory", "security_crypto_inventory"),
            _lookup(user_inputs, "moleculeOrMaterialFragment", "molecule_or_material_fragment"),
            _lookup(user_inputs, "hamiltonianPath", "hamiltonian_path", "hamiltonianAvailability"),
            _lookup(user_inputs, "predicateDefinition", "predicate_definition", "oraclePredicate"),
            _lookup(user_inputs, "functionDescription", "function_description"),
        )
    )
    parsed_problem_class = _parse_problem_class(
        _lookup(user_inputs, "problemClass", "problem_class")
    )
    problem_class = _derive_problem_class(parsed_problem_class, combined_text)

    legacy_problem_size = _lookup(user_inputs, "problem_size")
    baseline = _clean(_lookup(user_inputs, "currentClassicalBaseline", "current_classical_baseline"))
    solver = _clean(_lookup(user_inputs, "currentSolverOrWorkflow", "current_solver_or_workflow"))

    return AssessmentInput(
        industry=_clean(_lookup(user_inputs, "industry") or use_case_industry),
        objective=_clean(_lookup(user_inputs, "objective") or blueprint.get("business_kpi")),
        problem_class=problem_class,
        problem_description=_clean(
            _lookup(user_inputs, "problemDescription", "problem_description")
            or use_case_description
        ),
        business_value=_clean(_lookup(user_inputs, "businessValue", "business_value")),
        data_type=_clean(_lookup(user_inputs, "dataType", "data_type", "data_structure")),
        problem_size=_clean(
            _lookup(user_inputs, "problemSize", "problem_size") or legacy_problem_size
        ),
        constraints=_clean(_lookup(user_inputs, "constraints")),
        accuracy_needs=_clean(_lookup(user_inputs, "accuracyNeeds", "accuracy_needs")),
        latency_tolerance=_clean(
            _lookup(user_inputs, "latencyTolerance", "latency_tolerance", "timeline")
        ),
        current_classical_baseline=baseline,
        baseline_metrics=_clean(_lookup(user_inputs, "baselineMetrics", "baseline_metrics")),
        current_solver_or_workflow=solver,
        known_algorithms_considered=_clean(
            _lookup(
                user_inputs,
                "knownAlgorithmsConsidered",
                "known_algorithms_considered",
            )
        ),
        evidence_links=_listify(_lookup(user_inputs, "evidenceLinks", "evidence_links")),
        user_files_or_notes=_clean(_lookup(user_inputs, "userFilesOrNotes", "user_files_or_notes")),
        security_crypto_inventory=_as_dict(
            _lookup(user_inputs, "securityCryptoInventory", "security_crypto_inventory")
        ),
        molecule_or_material_fragment=_clean(
            _lookup(
                user_inputs,
                "moleculeOrMaterialFragment",
                "molecule_or_material_fragment",
                "moleculeMaterialFragment",
                "molecule",
                "materialFragment",
            )
        ),
        hamiltonian_path=_clean(
            _lookup(
                user_inputs,
                "hamiltonianPath",
                "hamiltonian_path",
                "hamiltonianAvailability",
                "hamiltonianGenerationPath",
                "hamiltonianTerms",
            )
        ),
        observable=_clean(_lookup(user_inputs, "observable", "observables")),
        ansatz=_clean(_lookup(user_inputs, "ansatz", "vqeAnsatz")),
        optimizer=_clean(_lookup(user_inputs, "optimizer", "vqeOptimizer")),
        qubo_variables=_clean(_lookup(user_inputs, "variables", "quboVariables", "qubo_variables")),
        qubo_constraints=_clean(
            _lookup(user_inputs, "quboConstraints", "qubo_constraints", "constraints")
        ),
        qubo_objective=_clean(_lookup(user_inputs, "quboObjective", "qubo_objective", "objective")),
        penalty_terms=_clean(_lookup(user_inputs, "penaltyTerms", "penalty_terms")),
        predicate_definition=_clean(
            _lookup(user_inputs, "predicateDefinition", "predicate_definition", "oraclePredicate")
        ),
        input_size_n=_clean(_lookup(user_inputs, "inputSizeN", "input_size_n", "N")),
        marked_item_count_m=_clean(
            _lookup(user_inputs, "markedItemCountM", "marked_item_count_m", "M")
        ),
        data_loading_assumption=_clean(
            _lookup(user_inputs, "dataLoadingAssumption", "data_loading_assumption")
        ),
        function_description=_clean(
            _lookup(user_inputs, "functionDescription", "function_description")
        ),
        assumes_real_hardware=_truthy(
            _lookup(user_inputs, "assumesRealHardware", "assumes_real_hardware")
        )
        or _contains_any(combined_text, _HARDWARE_KEYWORDS),
        tutorial_sample_selected=_truthy(
            _lookup(user_inputs, "tutorialSampleSelected", "tutorial_sample_selected")
        ),
    )


def _evidence_from_use_case(evidence_items: list[dict[str, Any]] | None) -> list[str]:
    evidence: list[str] = []
    for item in evidence_items or []:
        title = _clean(item.get("title"))
        claim = _clean(item.get("claim"))
        source = _clean(item.get("source_url"))
        if title and claim:
            evidence.append(f"{title}: {claim}")
        elif title:
            evidence.append(title)
        elif source:
            evidence.append(source)
    return evidence[:5]


def _base_evidence(
    inputs: AssessmentInput,
    use_case_evidence_items: list[dict[str, Any]] | None,
) -> tuple[list[str], list[str]]:
    evidence = _evidence_from_use_case(use_case_evidence_items)
    evidence.extend(inputs.evidence_links)
    if inputs.current_classical_baseline:
        evidence.append(f"Declared classical baseline: {inputs.current_classical_baseline}")
    if inputs.baseline_metrics:
        evidence.append(f"Baseline metrics: {inputs.baseline_metrics}")
    if inputs.user_files_or_notes:
        evidence.append("User notes supplied during intake.")

    missing: list[str] = []
    if not inputs.problem_description:
        missing.append("problem description")
    if not inputs.problem_size:
        missing.append("data shape or problem size")
    if not inputs.evidence_links and not use_case_evidence_items and not inputs.user_files_or_notes:
        missing.append("evidence links or supporting notes")
    return _dedupe(evidence), _dedupe(missing)


def _specific_enough(inputs: AssessmentInput) -> bool:
    signals = [
        inputs.objective,
        inputs.business_value,
        inputs.problem_description,
        inputs.problem_size,
        inputs.constraints,
        inputs.baseline_metrics,
        inputs.evidence_links,
        inputs.user_files_or_notes,
    ]
    return sum(bool(signal) for signal in signals) >= 4


def _baseline_summary(inputs: AssessmentInput) -> str:
    if inputs.current_classical_baseline and inputs.baseline_metrics:
        return f"{inputs.current_classical_baseline}; current metrics: {inputs.baseline_metrics}."
    if inputs.current_classical_baseline:
        return f"{inputs.current_classical_baseline}; metrics still need to be attached."
    return "No current classical baseline was declared; classical baseline required before a serious quantum build artifact."


def _hardware_assumptions(time_horizon: TimeHorizon) -> list[str]:
    assumptions = [
        "Default execution is simulator-first on classical infrastructure.",
        "Any quantum hardware path is hardware access-controlled and optional.",
    ]
    if time_horizon in {TimeHorizon.HARDWARE_GATED, TimeHorizon.FTQC_LATER}:
        assumptions.append("Future-hardware upside depends on algorithm and fault-tolerant hardware maturity.")
    return assumptions


def _algorithm_text(inputs: AssessmentInput) -> str:
    return " ".join(
        [
            inputs.problem_description,
            inputs.known_algorithms_considered,
            inputs.objective,
            inputs.user_files_or_notes,
            inputs.hamiltonian_path,
            inputs.function_description,
        ]
    ).lower()


def _simulation_contract_choice(inputs: AssessmentInput) -> tuple[ContractType, AlgorithmFamily]:
    text = _algorithm_text(inputs)
    if _contains_any(text, _PHASE_ESTIMATION_KEYWORDS):
        return ContractType.HAMILTONIAN, AlgorithmFamily.PHASE_ESTIMATION
    if "trotter" in text:
        return ContractType.TROTTER, AlgorithmFamily.TROTTERIZATION
    if "vqe" in text or inputs.ansatz or inputs.optimizer:
        return ContractType.VQE, AlgorithmFamily.VQE
    return ContractType.HAMILTONIAN, AlgorithmFamily.HAMILTONIAN_SIMULATION


def _optimization_contract_choice(inputs: AssessmentInput) -> tuple[ContractType, AlgorithmFamily]:
    text = _algorithm_text(inputs)
    if "anneal" in text:
        return ContractType.QUBO_ISING, AlgorithmFamily.QUANTUM_ANNEALING
    if "qaoa" in text or "qubo" in text or "ising" in text:
        return ContractType.QAOA, AlgorithmFamily.QAOA
    return ContractType.QUBO_ISING, AlgorithmFamily.QAOA


def _hardware_labels(inputs: AssessmentInput, labels: list[TrustLabel]) -> list[TrustLabel]:
    if inputs.assumes_real_hardware:
        return _dedupe_enum([*labels, TrustLabel.HARDWARE_GATED])
    return _dedupe_enum(labels)


def _hardware_caveats(inputs: AssessmentInput) -> list[str]:
    if not inputs.assumes_real_hardware:
        return []
    return ["Real quantum hardware is hardware-gated; approved access is required and not implied by this app."]


def _resource_estimate(
    *,
    estimate_level: str,
    hardware_horizon: TimeHorizon,
    logical_qubits: int | None = None,
    circuit_depth: int | None = None,
    shots: int | None = None,
    oracle_calls: int | None = None,
    grover_iterations: int | None = None,
    hamiltonian_terms: int | None = None,
    optimizer_iterations: int | None = None,
    caveats: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "estimate_level": estimate_level,
        "logical_qubits": logical_qubits,
        "physical_qubits": None,
        "ancilla_qubits": None,
        "circuit_depth": circuit_depth,
        "one_qubit_gates": None,
        "two_qubit_gates": None,
        "multi_qubit_gates": None,
        "oracle_calls": oracle_calls,
        "grover_iterations": grover_iterations,
        "trotter_steps": None,
        "hamiltonian_terms": hamiltonian_terms,
        "shots": shots,
        "optimizer_iterations": optimizer_iterations,
        "estimated_classical_runtime": None,
        "estimated_simulator_runtime": None,
        "hardware_horizon": hardware_horizon.value,
        "precision_warning": "Resource values are contract-level estimates unless measured from a toy circuit.",
        "caveats": caveats or [],
    }


def _provided_inputs(inputs: AssessmentInput, mapping: dict[str, Any]) -> list[str]:
    return [name for name, value in mapping.items() if bool(value)]


def _missing_inputs(required: list[str], provided: list[str]) -> list[str]:
    provided_set = {item.lower() for item in provided}
    return [item for item in required if item.lower() not in provided_set]


def _build_memo(inputs: AssessmentInput, output: dict[str, Any]) -> str:
    labels = ", ".join(output["trust_labels"])
    evidence = "\n".join(f"- {item}" for item in output["evidence_used"]) or "- None supplied"
    missing = "\n".join(f"- {item}" for item in output["missing_evidence"]) or "- None"
    assumptions = "\n".join(f"- {item}" for item in output["assumptions"]) or "- None"
    caveats = "\n".join(f"- {item}" for item in output["caveats"]) or "- None"
    required_inputs = "\n".join(f"- {item}" for item in output.get("required_inputs", [])) or "- None"
    provided_inputs = "\n".join(f"- {item}" for item in output.get("provided_inputs", [])) or "- None"
    missing_inputs = "\n".join(f"- {item}" for item in output.get("missing_inputs", [])) or "- None"
    resource_estimate = output.get("resource_estimate", {})
    resource_summary = "\n".join(
        f"- {key}: {value}" for key, value in resource_estimate.items() if value not in (None, [], "")
    ) or "- Unknown or not applicable"
    title = "PQC Migration Memo" if output.get("recommended_contract_type") == ContractType.PQC_RISK.value else "Quantum Algorithm Brief"

    return f"""# {title}

## Executive verdict
{output["verdict"]} ({output["confidence"]} confidence, {output["time_horizon"]}). Trust labels: {labels}.

## Problem statement
{inputs.problem_class.value}: {inputs.problem_description or "Problem description not supplied."}

## Algorithm Contract
Contract type: {output.get("recommended_contract_type", "UNKNOWN")}
Algorithm family: {output.get("recommended_algorithm_family", "UNKNOWN")}
Validity status: {output.get("contract_validity_status", "UNKNOWN")}

Required inputs:
{required_inputs}

Provided inputs:
{provided_inputs}

Missing inputs:
{missing_inputs}

## Mathematical reduction
Mathematical object: {output.get("mathematical_object", "Not supplied.")}
Reduction summary: {output.get("reduction_summary", "No reduction supplied.")}

## Classical baseline
{output["classical_baseline_summary"]}

## Algorithm candidate
{output["quantum_candidate_summary"]}

## Resource/trust estimate
{resource_summary}

## Simulator experiment
Recommended experiment: {output["recommended_experiment_type"]}. Build eligibility: {output["build_eligibility"]}.

## Benchmark result
{output.get("benchmark_plan", "Benchmark results are not available yet.")}

## Caveats and missing evidence
Caveats:
{caveats}

Missing evidence:
{missing}

Evidence used:
{evidence}

## GCP architecture
Use Cloud Storage or BigQuery for data, Cloud Run for app/API, Cloud SQL for state, Cloud Tasks or Pub/Sub for async jobs, a Python worker for simulator-first quantum jobs where applicable, and Cloud Storage for artifacts. Hardware-gated paths stay optional and access-controlled.

## Time horizon
{output["time_horizon"]}

## Next decision
{output["next_best_action"]}

## Assumptions
{assumptions}
"""


def _result(
    *,
    inputs: AssessmentInput,
    verdict: Verdict,
    readiness_score: int,
    confidence: Confidence,
    time_horizon: TimeHorizon,
    trust_labels: list[TrustLabel],
    recommendation: str,
    quantum_candidate: str,
    evidence_used: list[str],
    missing_evidence: list[str],
    assumptions: list[str],
    caveats: list[str],
    next_action: str,
    build_eligibility: BuildEligibility,
    experiment_type: str,
    assessment_id: str,
    created_at: str,
    contract_type: ContractType,
    algorithm_family: AlgorithmFamily,
    contract_validity: ContractValidityStatus,
    mathematical_object: str,
    reduction_summary: str,
    required_inputs: list[str],
    provided_inputs: list[str],
    missing_inputs: list[str],
    benchmark_plan: str,
    resource_estimate: dict[str, Any],
) -> AssessmentOutput:
    output_dict = {
        "verdict": verdict.value,
        "readiness_score": readiness_score,
        "confidence": confidence.value,
        "time_horizon": time_horizon.value,
        "trust_labels": [label.value for label in trust_labels],
        "problem_class": inputs.problem_class.value,
        "recommended_contract_type": contract_type.value,
        "recommended_algorithm_family": algorithm_family.value,
        "contract_validity_status": contract_validity.value,
        "plain_english_recommendation": recommendation,
        "classical_baseline_summary": _baseline_summary(inputs),
        "quantum_candidate_summary": quantum_candidate,
        "evidence_used": evidence_used,
        "missing_evidence": missing_evidence,
        "assumptions": assumptions,
        "caveats": caveats,
        "next_best_action": next_action,
        "build_eligibility": build_eligibility.value,
        "recommended_experiment_type": experiment_type,
        "mathematical_object": mathematical_object,
        "reduction_summary": reduction_summary,
        "required_inputs": required_inputs,
        "provided_inputs": provided_inputs,
        "missing_inputs": missing_inputs,
        "benchmark_plan": benchmark_plan,
        "resource_estimate": resource_estimate,
    }
    return AssessmentOutput(
        id=assessment_id,
        created_at=created_at,
        verdict=verdict,
        readiness_score=max(0, min(100, readiness_score)),
        confidence=confidence,
        time_horizon=time_horizon,
        trust_labels=_dedupe_enum(trust_labels),
        problem_class=inputs.problem_class,
        recommended_contract_type=contract_type,
        recommended_algorithm_family=algorithm_family,
        contract_validity_status=contract_validity,
        plain_english_recommendation=recommendation,
        classical_baseline_summary=output_dict["classical_baseline_summary"],
        quantum_candidate_summary=quantum_candidate,
        evidence_used=evidence_used,
        missing_evidence=missing_evidence,
        assumptions=assumptions,
        caveats=caveats,
        next_best_action=next_action,
        build_eligibility=build_eligibility,
        recommended_experiment_type=experiment_type,
        hardware_assumptions=_hardware_assumptions(time_horizon),
        mathematical_object=mathematical_object,
        reduction_summary=reduction_summary,
        required_inputs=required_inputs,
        provided_inputs=provided_inputs,
        missing_inputs=missing_inputs,
        benchmark_plan=benchmark_plan,
        resource_estimate=resource_estimate,
        exportable_memo=_build_memo(inputs, output_dict),
    )


def _dedupe_enum(labels: list[TrustLabel]) -> list[TrustLabel]:
    seen: set[str] = set()
    unique: list[TrustLabel] = []
    for label in labels:
        if label.value in seen:
            continue
        seen.add(label.value)
        unique.append(label)
    return unique


def _apply_missing_baseline_rule(
    *,
    inputs: AssessmentInput,
    output: AssessmentOutput,
) -> AssessmentOutput:
    if inputs.problem_class == ProblemClass.CRYPTO_SECURITY:
        return output
    if inputs.problem_class != ProblemClass.OPTIMIZATION:
        return output
    if output.verdict in {Verdict.EDUCATION_ONLY, Verdict.PQC_MIGRATION_NOW, Verdict.INVENTORY_FIRST}:
        return output
    if inputs.current_classical_baseline:
        return output

    missing = _dedupe([*output.missing_evidence, "current classical baseline"])
    caveats = _dedupe(
        [
            *output.caveats,
            "Classical baseline required before any evidence-backed verdict can support a serious experiment bundle.",
        ]
    )
    assumptions = _dedupe(
        [
            *output.assumptions,
            "The current intake is treated as a benchmark candidate until an incumbent solver or workflow is declared.",
        ]
    )
    capped = min(output.readiness_score, 40)
    updated = dataclasses.replace(
        output,
        verdict=Verdict.BENCHMARK_FIRST,
        readiness_score=capped,
        confidence=Confidence.LOW,
        time_horizon=TimeHorizon.NOW_CLASSICAL,
        trust_labels=[TrustLabel.BENCHMARK_CANDIDATE, TrustLabel.BASELINE_REQUIRED],
        plain_english_recommendation=(
            "Pause the quantum build path and document the incumbent method first. "
            "This remains a benchmark candidate, not a quantum-fit claim."
        ),
        missing_evidence=missing,
        assumptions=assumptions,
        caveats=caveats,
        next_best_action="Declare the current classical baseline and baseline metrics, then rerun the readiness assessment.",
        build_eligibility=BuildEligibility.LIMITED_TUTORIAL_ONLY,
        recommended_experiment_type="classical-baseline capture before any toy simulation",
        hardware_assumptions=_hardware_assumptions(TimeHorizon.NOW_CLASSICAL),
        contract_validity_status=ContractValidityStatus.PARTIAL,
        missing_inputs=_dedupe([*output.missing_inputs, "classical baseline"]),
        benchmark_plan="Capture the incumbent solver or workflow and benchmark metrics before any serious quantum comparison.",
    )
    memo_payload = serialize_assessment_output(updated)
    return dataclasses.replace(updated, exportable_memo=_build_memo(inputs, memo_payload))


def _crypto_inventory_text(inputs: AssessmentInput) -> str:
    values = [inputs.problem_description, inputs.user_files_or_notes, inputs.known_algorithms_considered]
    for value in inputs.security_crypto_inventory.values():
        values.append(_clean(value))
    return " ".join(values)


def run_qals_2(
    *,
    user_inputs: dict[str, Any],
    use_case_title: str = "",
    use_case_description: str = "",
    use_case_industry: str = "",
    use_case_quantum_approach: str = "",
    use_case_blueprint: dict[str, Any] | None = None,
    use_case_evidence_items: list[dict[str, Any]] | None = None,
    assessment_id: str = "",
    created_at: str | None = None,
) -> AssessmentOutput:
    """Run QALS 3.0 and return a complete Algorithm Contract assessment output."""

    inputs = normalize_assessment_input(
        user_inputs,
        use_case_title=use_case_title,
        use_case_description=use_case_description,
        use_case_industry=use_case_industry,
        use_case_quantum_approach=use_case_quantum_approach,
        use_case_blueprint=use_case_blueprint,
    )
    created = created_at or datetime.now(timezone.utc).isoformat()
    evidence, missing = _base_evidence(inputs, use_case_evidence_items)
    common_assumptions = [
        "QALS 3.0 is a deterministic Algorithm Contract rule/evidence engine, not an ML score.",
        "The readiness score is secondary to the verdict, contract validity, evidence, and trust labels.",
    ]
    hardware_caveats = _hardware_caveats(inputs)
    algorithm_text = _algorithm_text(inputs)

    if _contains_any(algorithm_text, _SHOR_KEYWORDS):
        required = [
            "function description",
            "period or order target",
            "modular exponentiation requirement",
            "inverse QFT requirement",
            "classical post-processing",
        ]
        provided = _provided_inputs(
            inputs,
            {
                "function description": inputs.function_description,
                "period or order target": "period" in algorithm_text or "order" in algorithm_text,
                "classical post-processing": "continued fraction" in algorithm_text or "post" in algorithm_text,
            },
        )
        missing_inputs = _missing_inputs(required, provided)
        output = _result(
            inputs=inputs,
            verdict=Verdict.EDUCATION_ONLY,
            readiness_score=22,
            confidence=Confidence.LOW,
            time_horizon=TimeHorizon.FTQC_LATER,
            trust_labels=_hardware_labels(
                inputs,
                [TrustLabel.TUTORIAL, TrustLabel.OVERCOMPILED_DEMO, TrustLabel.FTQC_LATER],
            ),
            recommendation=(
                "Use Shor or period finding as a tutorial and security-risk explainer. It should trigger PQC risk discussion, not a serious near-term Build artifact."
            ),
            quantum_candidate="Tiny factoring demos are overcompiled tutorial artifacts and do not imply near-term factoring capability.",
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + missing_inputs),
            assumptions=[*common_assumptions, "Period/order finding is treated as FTQC-later for enterprise planning."],
            caveats=[
                "Shor does not break encryption today in this app.",
                "Tiny factoring demos must remain TUTORIAL or OVERCOMPILED_DEMO.",
                *hardware_caveats,
            ],
            next_action="Create or update a PQC risk contract for affected RSA/ECC/DH/ECDSA systems.",
            build_eligibility=BuildEligibility.LIMITED_TUTORIAL_ONLY,
            experiment_type="period/order-finding tutorial only",
            assessment_id=assessment_id,
            created_at=created,
            contract_type=ContractType.PERIOD_ORDER,
            algorithm_family=AlgorithmFamily.SHOR_PERIOD_FINDING,
            contract_validity=ContractValidityStatus.TUTORIAL_ONLY,
            mathematical_object=inputs.function_description or "Toy periodic function only.",
            reduction_summary="Security-risk explanation; not a near-term enterprise build path.",
            required_inputs=required,
            provided_inputs=provided,
            missing_inputs=missing_inputs,
            benchmark_plan="No business benchmark is recommended. Use this to motivate PQC inventory.",
            resource_estimate=_resource_estimate(
                estimate_level="UNKNOWN_FUTURE",
                hardware_horizon=TimeHorizon.FTQC_LATER,
                caveats=["Fault-tolerant resources are out of V1 scope."],
            ),
        )
        return output

    crypto_text = _crypto_inventory_text(inputs)
    if inputs.problem_class == ProblemClass.CRYPTO_SECURITY or _contains_any(crypto_text, _CRYPTO_KEYWORDS):
        inventory_hits = [
            keyword.upper()
            for keyword in ("rsa", "ecc", "diffie-hellman", "ecdsa")
            if keyword in crypto_text.lower()
        ]
        inventory = inputs.security_crypto_inventory
        inventory_completeness = _clean(
            inventory.get("inventoryCompleteness")
            or inventory.get("inventory_completeness")
            or inventory.get("completeness")
        ).lower()
        systems_affected = _clean(
            inventory.get("systemsAffected") or inventory.get("systems_affected") or inventory.get("systems")
        )
        data_shelf_life = _clean(
            inventory.get("dataShelfLifeYears")
            or inventory.get("data_shelf_life_years")
            or inventory.get("dataShelfLife")
            or inventory.get("retention_sensitivity")
        )
        migration_time = _clean(
            inventory.get("migrationTimeYears")
            or inventory.get("migration_time_years")
            or inventory.get("migrationTime")
            or inventory.get("migration_owner_status")
        )
        quantum_collapse = _clean(
            inventory.get("assumedQuantumCollapseTimeYears")
            or inventory.get("assumed_quantum_collapse_time_years")
        )
        required = [
            "public-key crypto used",
            "systems affected",
            "data shelf life years",
            "migration time years",
            "assumed quantum collapse time years",
            "certificate lifetimes",
            "system owners",
            "crypto agility status",
            "inventory completeness",
        ]
        provided = _provided_inputs(
            inputs,
            {
                "public-key crypto used": bool(inventory_hits),
                "systems affected": systems_affected,
                "data shelf life years": data_shelf_life,
                "migration time years": migration_time,
                "assumed quantum collapse time years": quantum_collapse,
                "certificate lifetimes": inventory.get("certificateLifetimes") or inventory.get("certificate_lifetimes"),
                "system owners": inventory.get("systemOwners")
                or inventory.get("system_owners")
                or inventory.get("migrationOwner")
                or inventory.get("migration_owner_status")
                or inventory.get("migrationTime"),
                "crypto agility status": inventory.get("cryptoAgilityStatus")
                or inventory.get("crypto_agility_status")
                or inventory.get("cryptoAgility"),
                "inventory completeness": inventory_completeness,
            },
        )
        missing_inputs = _missing_inputs(required, provided)
        inventory_complete = inventory_completeness in {"complete", "mostly complete", "high"}
        verdict = Verdict.PQC_MIGRATION_NOW if inventory_hits and inventory_complete else Verdict.INVENTORY_FIRST
        confidence = Confidence.HIGH if verdict == Verdict.PQC_MIGRATION_NOW else Confidence.LOW
        score = 82 if verdict == Verdict.PQC_MIGRATION_NOW else 46
        if missing_inputs:
            missing.append("crypto inventory completeness")
        output = _result(
            inputs=inputs,
            verdict=verdict,
            readiness_score=score,
            confidence=confidence,
            time_horizon=TimeHorizon.NOW_CLASSICAL,
            trust_labels=[TrustLabel.ACTION_NOW],
            recommendation=(
                "Create or complete the PQC risk contract and migration workflow now. The action is classical cryptography migration, not quantum hardware or QKD."
            ),
            quantum_candidate=(
                "No quantum circuit is recommended. The candidate work product is a PQC Migration Memo, crypto inventory, risk-clock calculation, and migration plan."
            ),
            evidence_used=_dedupe(evidence + [f"Crypto inventory signals: {', '.join(inventory_hits)}"] if inventory_hits else evidence),
            missing_evidence=_dedupe(missing + missing_inputs),
            assumptions=[
                *common_assumptions,
                "Harvest-now-decrypt-later risk is handled as an enterprise migration concern.",
            ],
            caveats=[
                "Do not make QKD the default enterprise security recommendation.",
                "This verdict does not require quantum compute advantage; it is an action-now crypto modernization path.",
            ],
            next_action="Create crypto inventory" if verdict == Verdict.INVENTORY_FIRST else "Prioritize PQC migration planning and owner assignment.",
            build_eligibility=BuildEligibility.NON_COMPUTE_ACTION_ONLY,
            experiment_type="PQC Migration Memo",
            assessment_id=assessment_id,
            created_at=created,
            contract_type=ContractType.PQC_RISK,
            algorithm_family=AlgorithmFamily.PQC_READINESS,
            contract_validity=ContractValidityStatus.PARTIAL if missing_inputs else ContractValidityStatus.VALID,
            mathematical_object="PQC risk model and crypto inventory.",
            reduction_summary="Security exposure is reduced to public-key cryptography inventory, data shelf life, migration time, and risk-clock assumptions.",
            required_inputs=required,
            provided_inputs=provided,
            missing_inputs=missing_inputs,
            benchmark_plan="No quantum compute benchmark. Track inventory completeness, migration time, and residual long-lived data exposure.",
            resource_estimate=_resource_estimate(
                estimate_level="ESTIMATED_FROM_CONTRACT",
                hardware_horizon=TimeHorizon.NOW_CLASSICAL,
                logical_qubits=0,
                shots=0,
                caveats=["PQC readiness is a non-compute action plan."],
            ),
        )
        return output

    if inputs.problem_class == ProblemClass.QUANTUM_SIMULATION:
        contract_type, algorithm_family = _simulation_contract_choice(inputs)
        required = [
            "molecule or material fragment",
            "Hamiltonian path",
            "observable",
            "classical baseline",
        ]
        if algorithm_family == AlgorithmFamily.VQE:
            required.extend(["ansatz", "optimizer", "shots", "convergence metric"])
        provided = _provided_inputs(
            inputs,
            {
                "molecule or material fragment": inputs.molecule_or_material_fragment,
                "Hamiltonian path": inputs.hamiltonian_path,
                "observable": inputs.observable,
                "classical baseline": inputs.current_classical_baseline,
                "ansatz": inputs.ansatz,
                "optimizer": inputs.optimizer,
                "shots": inputs.baseline_metrics or inputs.problem_size,
                "convergence metric": inputs.accuracy_needs,
            },
        )
        missing_inputs = _missing_inputs(required, provided)
        has_hamiltonian_contract = bool(inputs.molecule_or_material_fragment and inputs.hamiltonian_path)
        if algorithm_family == AlgorithmFamily.PHASE_ESTIMATION:
            validity = ContractValidityStatus.TUTORIAL_ONLY
            verdict = Verdict.FUTURE_FTQC
            score = 34
            time_horizon = TimeHorizon.FTQC_LATER
            build_eligibility = BuildEligibility.LIMITED_TUTORIAL_ONLY
            labels = [TrustLabel.FTQC_LATER, TrustLabel.HAMILTONIAN_DEPENDENT]
        elif not has_hamiltonian_contract:
            validity = ContractValidityStatus.PARTIAL
            verdict = Verdict.RESEARCH_SCOPING_REQUIRED
            score = 38
            time_horizon = TimeHorizon.HARDWARE_GATED
            build_eligibility = BuildEligibility.LIMITED_TUTORIAL_ONLY
            labels = [TrustLabel.HAMILTONIAN_DEPENDENT, TrustLabel.INSUFFICIENT_CONTRACT]
        elif algorithm_family == AlgorithmFamily.VQE and (not inputs.ansatz or not inputs.optimizer):
            validity = ContractValidityStatus.PARTIAL
            verdict = Verdict.RESEARCH_SCOPING_REQUIRED
            score = 48
            time_horizon = TimeHorizon.SIMULATOR_NOW
            build_eligibility = BuildEligibility.LIMITED_TUTORIAL_ONLY
            labels = [TrustLabel.HAMILTONIAN_DEPENDENT, TrustLabel.CONVERGENCE_UNCERTAIN, TrustLabel.TOY_SIMULATION]
            missing_inputs = _dedupe([*missing_inputs, "ansatz", "optimizer"])
        else:
            validity = ContractValidityStatus.VALID if not inputs.tutorial_sample_selected else ContractValidityStatus.TUTORIAL_ONLY
            verdict = Verdict.SIMULATOR_PROTOTYPE_NOW if not inputs.tutorial_sample_selected else Verdict.EDUCATION_ONLY
            score = 72 if not inputs.tutorial_sample_selected else 30
            time_horizon = TimeHorizon.SIMULATOR_NOW
            build_eligibility = (
                BuildEligibility.ELIGIBLE_FOR_RESEARCH_PROTOTYPE
                if not inputs.tutorial_sample_selected
                else BuildEligibility.LIMITED_TUTORIAL_ONLY
            )
            labels = [TrustLabel.RESEARCH_CANDIDATE, TrustLabel.HAMILTONIAN_DEPENDENT, TrustLabel.CONVERGENCE_UNCERTAIN]
            if inputs.tutorial_sample_selected:
                labels.append(TrustLabel.TUTORIAL)
            else:
                labels.append(TrustLabel.MEANINGFUL_SMALL_INSTANCE)
        output = _result(
            inputs=inputs,
            verdict=verdict,
            readiness_score=score,
            confidence=Confidence.MEDIUM if build_eligibility == BuildEligibility.ELIGIBLE_FOR_RESEARCH_PROTOTYPE else Confidence.LOW,
            time_horizon=time_horizon,
            trust_labels=_hardware_labels(inputs, labels),
            recommendation=(
                "Treat this as a Hamiltonian-dependent Algorithm Contract. Build is serious only when the molecule/material fragment, Hamiltonian path, observable, and baseline are user-supplied."
            ),
            quantum_candidate=(
                "A molecule-fragment starter using a VQE-shaped Cirq toy implementation. OpenFermion/qsim can replace the placeholder when the worker layer has those dependencies configured."
            ),
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + missing_inputs + ([] if inputs.baseline_metrics else ["baseline metrics"])),
            assumptions=[
                *common_assumptions,
                "The quantum candidate is scoped to a fragment or active-space proxy before any larger chemistry claim.",
            ],
            caveats=[
                "Toy simulation does not imply near-term production advantage.",
                "Future-hardware upside depends on chemistry formulation, active-space choices, and hardware maturity.",
                "VQE convergence is uncertain and depends on ansatz, optimizer, shots, and measurement strategy.",
                *hardware_caveats,
            ],
            next_action="Supply the Hamiltonian path, observable, ansatz, optimizer, and DFT/HPC baseline before creating a serious VQE bundle.",
            build_eligibility=build_eligibility,
            experiment_type="Hamiltonian/VQE mini-pipeline",
            assessment_id=assessment_id,
            created_at=created,
            contract_type=contract_type,
            algorithm_family=algorithm_family,
            contract_validity=validity,
            mathematical_object=inputs.hamiltonian_path or "Hamiltonian path not supplied.",
            reduction_summary="Map the molecule/material fragment to a Hamiltonian, choose observables, then run a simulator-first VQE/Trotter/phase-estimation path.",
            required_inputs=required,
            provided_inputs=provided,
            missing_inputs=missing_inputs,
            benchmark_plan="Compare expectation values or fragment-level outputs against the declared DFT/classical HPC workflow.",
            resource_estimate=_resource_estimate(
                estimate_level="ESTIMATED_FROM_CONTRACT" if has_hamiltonian_contract else "UNKNOWN_FUTURE",
                hardware_horizon=time_horizon,
                logical_qubits=2 if inputs.tutorial_sample_selected else None,
                shots=1000 if has_hamiltonian_contract else None,
                hamiltonian_terms=None,
                optimizer_iterations=None,
                caveats=["Measurement cost and convergence are uncertain until ansatz and optimizer are supplied."],
            ),
        )
        return _apply_missing_baseline_rule(inputs=inputs, output=output)

    if inputs.problem_class == ProblemClass.OPTIMIZATION:
        contract_type, algorithm_family = _optimization_contract_choice(inputs)
        required = [
            "variables",
            "constraints",
            "objective",
            "penalty terms or QUBO/Ising coefficients",
            "classical baseline",
            "problem instance size",
        ]
        provided = _provided_inputs(
            inputs,
            {
                "variables": inputs.qubo_variables or inputs.problem_size,
                "constraints": inputs.qubo_constraints,
                "objective": inputs.qubo_objective or inputs.objective,
                "penalty terms or QUBO/Ising coefficients": inputs.penalty_terms or "qubo" in algorithm_text or "ising" in algorithm_text,
                "classical baseline": inputs.current_classical_baseline,
                "problem instance size": inputs.problem_size,
            },
        )
        missing_inputs = _missing_inputs(required, provided)
        has_baseline = bool(inputs.current_classical_baseline)
        has_metrics = bool(inputs.baseline_metrics)
        build_eligibility = BuildEligibility.ELIGIBLE_FOR_BENCHMARK if has_baseline else BuildEligibility.LIMITED_TUTORIAL_ONLY
        output = _result(
            inputs=inputs,
            verdict=Verdict.SIMULATOR_PROTOTYPE_NOW if has_metrics and has_baseline else Verdict.BENCHMARK_FIRST,
            readiness_score=60 if has_metrics and has_baseline else 40,
            confidence=Confidence.MEDIUM if has_metrics else Confidence.LOW,
            time_horizon=TimeHorizon.SIMULATOR_NOW if has_baseline else TimeHorizon.NOW_CLASSICAL,
            trust_labels=_hardware_labels(
                inputs,
                [
                    TrustLabel.BENCHMARK_CANDIDATE,
                    TrustLabel.CONVERGENCE_UNCERTAIN,
                    TrustLabel.TOY_SIMULATION if has_baseline else TrustLabel.BASELINE_REQUIRED,
                ],
            ),
            recommendation=(
                "Use a benchmark-first QUBO/QAOA contract. A QAOA candidate is useful only when compared against OR-Tools, MILP, heuristics, simulated annealing, or the current internal solver."
            ),
            quantum_candidate=(
                "A QUBO/Ising reduction and small QAOA benchmark harness with a classical baseline comparison."
            ),
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + missing_inputs + ([] if inputs.baseline_metrics else ["baseline metrics"])),
            assumptions=[
                *common_assumptions,
                "The quantum step is a narrow optimization kernel inside a larger classical workflow.",
            ],
            caveats=[
                "Production advantage unproven; benchmark comparison is required.",
                "A toy simulation cannot replace a production route, schedule, portfolio, or supply-chain solver.",
                *hardware_caveats,
            ],
            next_action="Freeze a small benchmark instance and compare the current classical baseline with the toy QAOA candidate on the same inputs.",
            build_eligibility=build_eligibility,
            experiment_type="QUBO/QAOA benchmark harness",
            assessment_id=assessment_id,
            created_at=created,
            contract_type=contract_type,
            algorithm_family=algorithm_family,
            contract_validity=ContractValidityStatus.PARTIAL if missing_inputs else ContractValidityStatus.VALID,
            mathematical_object="QUBO/Ising model" if "penalty terms or QUBO/Ising coefficients" not in missing_inputs else "QUBO/Ising model not fully supplied.",
            reduction_summary="Reduce variables, constraints, objective, and penalties to a QUBO/Ising form before any QAOA benchmark.",
            required_inputs=required,
            provided_inputs=provided,
            missing_inputs=missing_inputs,
            benchmark_plan="Run the same instance through the classical baseline and QAOA simulator, then compare objective value, runtime, and approximation ratio.",
            resource_estimate=_resource_estimate(
                estimate_level="ESTIMATED_FROM_CONTRACT",
                hardware_horizon=TimeHorizon.SIMULATOR_NOW if has_baseline else TimeHorizon.NOW_CLASSICAL,
                logical_qubits=None,
                shots=1000 if has_baseline else 0,
                optimizer_iterations=None,
                caveats=["QAOA parameter convergence is uncertain and benchmark-only in V1."],
            ),
        )
        return _apply_missing_baseline_rule(inputs=inputs, output=output)

    if inputs.problem_class == ProblemClass.SEARCH:
        search_text = " ".join(
            [
                inputs.problem_description,
                inputs.constraints,
                inputs.known_algorithms_considered,
                inputs.user_files_or_notes,
                inputs.data_loading_assumption,
            ]
        ).lower()
        has_data_loading_signal = bool(
            re.search(r"\b(oracle|index|encoding|state prep|state preparation|data loading)\b", search_text)
        )
        has_unclear_data_loading = bool(
            re.search(
                r"\b(no|unclear|unknown|missing|without|not defined|not supplied)\b.{0,40}\b(oracle|encoding|state prep|state preparation|data loading)\b",
                search_text,
            )
        )
        has_data_loading_path = has_data_loading_signal and not has_unclear_data_loading
        required = [
            "predicate definition",
            "input size N",
            "marked item count M",
            "reversible oracle feasibility",
            "oracle cost estimate",
            "data loading assumption",
        ]
        provided = _provided_inputs(
            inputs,
            {
                "predicate definition": inputs.predicate_definition,
                "input size N": inputs.input_size_n,
                "marked item count M": inputs.marked_item_count_m,
                "reversible oracle feasibility": "reversible" in search_text or "oracle" in search_text,
                "oracle cost estimate": "cost" in search_text or inputs.problem_size,
                "data loading assumption": inputs.data_loading_assumption or has_data_loading_path,
            },
        )
        missing_inputs = _missing_inputs(required, provided)
        has_oracle = bool(inputs.predicate_definition)
        eligibility = (
            BuildEligibility.ELIGIBLE_FOR_TOY_EXPERIMENT
            if has_oracle and inputs.input_size_n
            else BuildEligibility.LIMITED_TUTORIAL_ONLY
        )
        output = _result(
            inputs=inputs,
            verdict=Verdict.BENCHMARK_FIRST if has_oracle and has_data_loading_path else Verdict.EDUCATION_ONLY,
            readiness_score=46 if has_oracle and has_data_loading_path else 28,
            confidence=Confidence.LOW,
            time_horizon=TimeHorizon.NISQ_EXPLORATION if has_oracle else TimeHorizon.FTQC_LATER,
            trust_labels=_hardware_labels(
                inputs,
                [
                    TrustLabel.ORACLE_DEPENDENT,
                    TrustLabel.TOY_SIMULATION if has_oracle else TrustLabel.INSUFFICIENT_CONTRACT,
                    TrustLabel.TUTORIAL if not has_oracle else TrustLabel.BENCHMARK_CANDIDATE,
                ],
            ),
            recommendation=(
                "Use Grover-like search as an oracle-dependent tutorial or benchmark. It is not a generic enterprise database search replacement."
            ),
            quantum_candidate="A Grover toy search that demonstrates amplitude amplification without claiming a generic database or vector-search replacement.",
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + missing_inputs + ([] if has_data_loading_path else ["data-loading or oracle construction path"])),
            assumptions=[
                *common_assumptions,
                "Search value depends on whether the workload can be expressed as a structured oracle.",
            ],
            caveats=[
                "Data-loading overhead can dominate the theoretical search speedup.",
                "Do not imply generic database, analytics, or vector-search replacement.",
                *hardware_caveats,
            ],
            next_action="Document the oracle and data-loading path before considering any benchmark candidate.",
            build_eligibility=eligibility,
            experiment_type="Grover Oracle Lab",
            assessment_id=assessment_id,
            created_at=created,
            contract_type=ContractType.ORACLE,
            algorithm_family=AlgorithmFamily.GROVER_SEARCH,
            contract_validity=ContractValidityStatus.PARTIAL if missing_inputs else ContractValidityStatus.VALID,
            mathematical_object=inputs.predicate_definition or "Oracle predicate not supplied.",
            reduction_summary="Define a reversible predicate/oracle, estimate data loading and oracle cost, then run a toy simulator histogram only if scoped.",
            required_inputs=required,
            provided_inputs=provided,
            missing_inputs=missing_inputs,
            benchmark_plan="Compare the oracle-dependent toy result with the current classical search/index baseline; do not benchmark generic database search.",
            resource_estimate=_resource_estimate(
                estimate_level="ESTIMATED_FROM_CONTRACT" if has_oracle else "UNKNOWN_FUTURE",
                hardware_horizon=TimeHorizon.NISQ_EXPLORATION if has_oracle else TimeHorizon.FTQC_LATER,
                logical_qubits=None,
                shots=1000 if has_oracle else 0,
                oracle_calls=None,
                grover_iterations=None,
                caveats=["Grover iteration estimates require N, M, and a reversible oracle cost."],
            ),
        )
        return output

    if inputs.problem_class in {ProblemClass.LINEAR_SYSTEMS, ProblemClass.QUANTUM_ML}:
        has_structure = bool(inputs.data_type and inputs.current_classical_baseline and inputs.baseline_metrics)
        output = _result(
            inputs=inputs,
            verdict=Verdict.BENCHMARK_FIRST if has_structure else Verdict.CLASSICAL_FIRST,
            readiness_score=44 if has_structure else 32,
            confidence=Confidence.LOW,
            time_horizon=TimeHorizon.HARDWARE_GATED if has_structure else TimeHorizon.NOW_CLASSICAL,
            trust_labels=[TrustLabel.BENCHMARK_CANDIDATE if has_structure else TrustLabel.HARDWARE_GATED],
            recommendation=(
                "Keep this classical-first unless strong input/output structure and classical ML or heuristic baselines are documented."
            ),
            quantum_candidate="A narrowly scoped benchmark design, not a build-first quantum implementation.",
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + ["input/output structure", "classical heuristic or ML baseline"]),
            assumptions=[
                *common_assumptions,
                "Any possible advantage depends on state preparation, output extraction, and benchmark design.",
            ],
            caveats=[
                "Input/output constraints can erase theoretical speedups.",
                "Classical heuristic and ML baselines must be measured first.",
                *hardware_caveats,
            ],
            next_action="Write the benchmark protocol and baseline metrics before opening Build.",
            build_eligibility=BuildEligibility.LIMITED_TUTORIAL_ONLY,
            experiment_type="benchmark design memo",
            assessment_id=assessment_id,
            created_at=created,
            contract_type=ContractType.TUTORIAL,
            algorithm_family=AlgorithmFamily.UNKNOWN,
            contract_validity=ContractValidityStatus.PARTIAL if has_structure else ContractValidityStatus.INVALID,
            mathematical_object="Input/output structure not proven.",
            reduction_summary="No valid V1 Algorithm Contract was found for linear systems or quantum ML.",
            required_inputs=["input/output structure", "classical baseline", "baseline metrics"],
            provided_inputs=_provided_inputs(
                inputs,
                {
                    "input/output structure": inputs.data_type,
                    "classical baseline": inputs.current_classical_baseline,
                    "baseline metrics": inputs.baseline_metrics,
                },
            ),
            missing_inputs=["input/output structure", "classical baseline", "baseline metrics"],
            benchmark_plan="Document classical heuristic or ML baselines before any quantum benchmark.",
            resource_estimate=_resource_estimate(
                estimate_level="UNKNOWN_FUTURE",
                hardware_horizon=TimeHorizon.HARDWARE_GATED,
                caveats=["Input loading and output extraction dominate V1 feasibility."],
            ),
        )
        return _apply_missing_baseline_rule(inputs=inputs, output=output)

    output = _result(
        inputs=inputs,
        verdict=Verdict.EDUCATION_ONLY,
        readiness_score=20,
        confidence=Confidence.LOW,
        time_horizon=TimeHorizon.NOW_CLASSICAL,
        trust_labels=[TrustLabel.TUTORIAL],
        recommendation="Clarify the problem class, baseline, time horizon, and evidence before any Build workflow.",
        quantum_candidate="Tutorial-only examples are allowed, but they cannot be exported as business recommendations.",
        evidence_used=evidence,
        missing_evidence=_dedupe(
            [
                *missing,
                "problem class",
                "current classical baseline",
                "time horizon",
            ]
        ),
        assumptions=common_assumptions,
        caveats=["Unknown problem shape cannot support an evidence-backed verdict."],
        next_action="Fill in the guided intake fields and rerun the readiness assessment.",
        build_eligibility=BuildEligibility.LIMITED_TUTORIAL_ONLY,
        experiment_type="tutorial-only circuit",
        assessment_id=assessment_id,
        created_at=created,
        contract_type=ContractType.TUTORIAL,
        algorithm_family=AlgorithmFamily.UNKNOWN,
        contract_validity=ContractValidityStatus.TUTORIAL_ONLY,
        mathematical_object="No Algorithm Contract supplied.",
        reduction_summary="Unknown problem shape cannot be reduced to a defensible Algorithm Contract.",
        required_inputs=["problem statement", "Algorithm Contract", "classical baseline or benchmark plan"],
        provided_inputs=[],
        missing_inputs=["problem statement", "Algorithm Contract", "classical baseline or benchmark plan"],
        benchmark_plan="No benchmark plan until the problem shape and contract are supplied.",
        resource_estimate=_resource_estimate(
            estimate_level="UNKNOWN_FUTURE",
            hardware_horizon=TimeHorizon.NOW_CLASSICAL,
            caveats=["Tutorial-only until a contract exists."],
        ),
    )
    return output


def serialize_assessment_output(output: AssessmentOutput) -> dict[str, Any]:
    """Convert an AssessmentOutput to JSON-safe snake_case API fields."""

    return {
        "id": output.id,
        "created_at": output.created_at,
        "verdict": output.verdict.value,
        "readiness_score": output.readiness_score,
        "confidence": output.confidence.value,
        "time_horizon": output.time_horizon.value,
        "trust_labels": [label.value for label in output.trust_labels],
        "problem_class": output.problem_class.value,
        "recommended_contract_type": output.recommended_contract_type.value,
        "recommended_algorithm_family": output.recommended_algorithm_family.value,
        "contract_validity_status": output.contract_validity_status.value,
        "plain_english_recommendation": output.plain_english_recommendation,
        "classical_baseline_summary": output.classical_baseline_summary,
        "quantum_candidate_summary": output.quantum_candidate_summary,
        "evidence_used": output.evidence_used,
        "missing_evidence": output.missing_evidence,
        "assumptions": output.assumptions,
        "caveats": output.caveats,
        "next_best_action": output.next_best_action,
        "build_eligibility": output.build_eligibility.value,
        "recommended_experiment_type": output.recommended_experiment_type,
        "hardware_assumptions": output.hardware_assumptions,
        "mathematical_object": output.mathematical_object,
        "reduction_summary": output.reduction_summary,
        "required_inputs": output.required_inputs,
        "provided_inputs": output.provided_inputs,
        "missing_inputs": output.missing_inputs,
        "benchmark_plan": output.benchmark_plan,
        "resource_estimate": output.resource_estimate,
        "exportable_memo": output.exportable_memo,
    }

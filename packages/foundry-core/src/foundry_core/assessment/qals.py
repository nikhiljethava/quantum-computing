"""QALS 2.0 deterministic assessment engine.

QALS 2.0 is intentionally a transparent rules and evidence engine. It does not
claim quantum advantage, does not use ML scoring, and keeps the readiness score
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
    BENCHMARK_CANDIDATE = "BENCHMARK_CANDIDATE"
    RESEARCH_CANDIDATE = "RESEARCH_CANDIDATE"
    HARDWARE_GATED = "HARDWARE_GATED"
    FTQC_LATER = "FTQC_LATER"
    ACTION_NOW = "ACTION_NOW"


class BuildEligibility(str, enum.Enum):
    ELIGIBLE = "ELIGIBLE"
    LIMITED = "LIMITED"
    BLOCKED = "BLOCKED"
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


def _build_memo(inputs: AssessmentInput, output: dict[str, Any]) -> str:
    labels = ", ".join(output["trust_labels"])
    evidence = "\n".join(f"- {item}" for item in output["evidence_used"]) or "- None supplied"
    missing = "\n".join(f"- {item}" for item in output["missing_evidence"]) or "- None"
    assumptions = "\n".join(f"- {item}" for item in output["assumptions"]) or "- None"
    caveats = "\n".join(f"- {item}" for item in output["caveats"]) or "- None"

    return f"""# Quantum Opportunity Memo

## Executive verdict
{output["verdict"]} ({output["confidence"]} confidence, {output["time_horizon"]}). Trust labels: {labels}.

## Problem shape
{inputs.problem_class.value}: {inputs.problem_description or "Problem description not supplied."}

## Classical baseline
{output["classical_baseline_summary"]}

## Quantum candidate
{output["quantum_candidate_summary"]}

## Evidence and caveats
Evidence used:
{evidence}

Caveats:
{caveats}

## Experiment bundle
Recommended experiment: {output["recommended_experiment_type"]}. Build eligibility: {output["build_eligibility"]}.

## GCP architecture
Use Cloud Storage or BigQuery for data, Cloud Run for app/API, Cloud SQL for state, Cloud Tasks or Pub/Sub for async jobs, a Python worker for Cirq/OpenFermion/qsim simulation where applicable, and Cloud Storage for artifacts. Hardware access-controlled paths stay optional.

## Time horizon
{output["time_horizon"]}

## Next decision
{output["next_best_action"]}

## Assumptions
{assumptions}

## Missing evidence
{missing}
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
) -> AssessmentOutput:
    output_dict = {
        "verdict": verdict.value,
        "readiness_score": readiness_score,
        "confidence": confidence.value,
        "time_horizon": time_horizon.value,
        "trust_labels": [label.value for label in trust_labels],
        "problem_class": inputs.problem_class.value,
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
    if output.verdict in {Verdict.EDUCATION_ONLY, Verdict.PQC_MIGRATION_NOW}:
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
        trust_labels=[TrustLabel.BENCHMARK_CANDIDATE],
        plain_english_recommendation=(
            "Pause the quantum build path and document the incumbent method first. "
            "This remains a benchmark candidate, not a quantum-fit claim."
        ),
        missing_evidence=missing,
        assumptions=assumptions,
        caveats=caveats,
        next_best_action="Declare the current classical baseline and baseline metrics, then rerun the readiness assessment.",
        build_eligibility=BuildEligibility.LIMITED,
        recommended_experiment_type="classical-baseline capture before any toy simulation",
        hardware_assumptions=_hardware_assumptions(TimeHorizon.NOW_CLASSICAL),
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
    """Run QALS 2.0 and return a complete evidence-backed assessment output."""

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
        "QALS 2.0 is a deterministic rule/evidence engine, not an ML score.",
        "The readiness score is secondary to the verdict, time horizon, evidence, and trust labels.",
    ]

    crypto_text = _crypto_inventory_text(inputs)
    if inputs.problem_class == ProblemClass.CRYPTO_SECURITY or _contains_any(crypto_text, _CRYPTO_KEYWORDS):
        inventory_hits = [
            keyword.upper()
            for keyword in ("rsa", "ecc", "diffie-hellman", "ecdsa")
            if keyword in crypto_text.lower()
        ]
        if not inventory_hits:
            missing.append("crypto asset and certificate inventory")
        output = _result(
            inputs=inputs,
            verdict=Verdict.PQC_MIGRATION_NOW,
            readiness_score=82,
            confidence=Confidence.HIGH if inventory_hits else Confidence.MEDIUM,
            time_horizon=TimeHorizon.NOW_CLASSICAL,
            trust_labels=[TrustLabel.ACTION_NOW],
            recommendation=(
                "Start a PQC inventory and migration planning workflow now. The action is classical cryptography migration, not quantum hardware or QKD."
            ),
            quantum_candidate=(
                "No quantum circuit is recommended. The candidate work product is a crypto readiness checklist, inventory memo, and PQC migration plan."
            ),
            evidence_used=_dedupe(evidence + [f"Crypto inventory signals: {', '.join(inventory_hits)}"] if inventory_hits else evidence),
            missing_evidence=_dedupe(missing),
            assumptions=[
                *common_assumptions,
                "Harvest-now-decrypt-later risk is handled as an enterprise migration concern.",
            ],
            caveats=[
                "Do not make QKD the default enterprise security recommendation.",
                "This verdict does not require quantum compute advantage; it is an action-now crypto modernization path.",
            ],
            next_action="Inventory RSA, ECC, Diffie-Hellman, ECDSA, certificate lifetimes, regulated data, and migration owners.",
            build_eligibility=BuildEligibility.ELIGIBLE,
            experiment_type="crypto readiness checklist and PQC migration memo",
            assessment_id=assessment_id,
            created_at=created,
        )
        return output

    if inputs.problem_class == ProblemClass.QUANTUM_SIMULATION:
        specific = _specific_enough(inputs)
        output = _result(
            inputs=inputs,
            verdict=Verdict.SIMULATOR_PROTOTYPE_NOW if specific else Verdict.RESEARCH_PARTNERSHIP,
            readiness_score=72 if specific else 58,
            confidence=Confidence.MEDIUM,
            time_horizon=TimeHorizon.SIMULATOR_NOW if specific else TimeHorizon.HARDWARE_GATED,
            trust_labels=[
                TrustLabel.RESEARCH_CANDIDATE,
                TrustLabel.TOY_SIMULATION if specific else TrustLabel.HARDWARE_GATED,
            ],
            recommendation=(
                "Treat this as a simulator-first research candidate with future-hardware upside. Start with a bounded molecule or material fragment and keep the classical baseline visible."
            ),
            quantum_candidate=(
                "A molecule-fragment starter using a VQE-shaped Cirq toy implementation. OpenFermion/qsim can replace the placeholder when the worker layer has those dependencies configured."
            ),
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + ([] if inputs.baseline_metrics else ["baseline metrics"])),
            assumptions=[
                *common_assumptions,
                "The quantum candidate is scoped to a fragment or active-space proxy before any larger chemistry claim.",
            ],
            caveats=[
                "Toy simulation does not imply near-term production advantage.",
                "Future-hardware upside depends on chemistry formulation, active-space choices, and hardware maturity.",
            ],
            next_action="Create a molecule-fragment experiment bundle and compare it with the declared DFT or classical HPC workflow.",
            build_eligibility=BuildEligibility.ELIGIBLE,
            experiment_type="molecule-fragment starter",
            assessment_id=assessment_id,
            created_at=created,
        )
        return _apply_missing_baseline_rule(inputs=inputs, output=output)

    if inputs.problem_class == ProblemClass.OPTIMIZATION:
        has_metrics = bool(inputs.baseline_metrics)
        output = _result(
            inputs=inputs,
            verdict=Verdict.SIMULATOR_PROTOTYPE_NOW if has_metrics else Verdict.BENCHMARK_FIRST,
            readiness_score=60 if has_metrics else 48,
            confidence=Confidence.MEDIUM if has_metrics else Confidence.LOW,
            time_horizon=TimeHorizon.SIMULATOR_NOW if has_metrics else TimeHorizon.NOW_CLASSICAL,
            trust_labels=[
                TrustLabel.BENCHMARK_CANDIDATE,
                TrustLabel.TOY_SIMULATION if has_metrics else TrustLabel.BENCHMARK_CANDIDATE,
            ],
            recommendation=(
                "Use a benchmark-first optimization workflow. A small QAOA toy problem can be useful only when compared against OR-Tools, MILP, heuristics, or the current internal solver."
            ),
            quantum_candidate=(
                "A small QAOA toy problem plus a classical heuristic/baseline comparison placeholder."
            ),
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + ([] if inputs.baseline_metrics else ["baseline metrics"])),
            assumptions=[
                *common_assumptions,
                "The quantum step is a narrow optimization kernel inside a larger classical workflow.",
            ],
            caveats=[
                "Production advantage unproven; benchmark comparison is required.",
                "A toy simulation cannot replace a production route, schedule, portfolio, or supply-chain solver.",
            ],
            next_action="Freeze a small benchmark instance and compare the current classical baseline with the toy QAOA candidate on the same inputs.",
            build_eligibility=BuildEligibility.ELIGIBLE if inputs.current_classical_baseline else BuildEligibility.LIMITED,
            experiment_type="small QAOA toy benchmark",
            assessment_id=assessment_id,
            created_at=created,
        )
        return _apply_missing_baseline_rule(inputs=inputs, output=output)

    if inputs.problem_class == ProblemClass.SEARCH:
        search_text = " ".join(
            [
                inputs.problem_description,
                inputs.constraints,
                inputs.known_algorithms_considered,
                inputs.user_files_or_notes,
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
        output = _result(
            inputs=inputs,
            verdict=Verdict.BENCHMARK_FIRST if has_data_loading_path else Verdict.EDUCATION_ONLY,
            readiness_score=42 if has_data_loading_path else 28,
            confidence=Confidence.LOW,
            time_horizon=TimeHorizon.NISQ_EXPLORATION if has_data_loading_path else TimeHorizon.FTQC_LATER,
            trust_labels=[TrustLabel.TUTORIAL if not has_data_loading_path else TrustLabel.BENCHMARK_CANDIDATE],
            recommendation=(
                "Use Grover-like search as tutorial or benchmark framing only until the data-loading path is explicit."
            ),
            quantum_candidate="A Grover toy search that demonstrates amplitude amplification without claiming a generic database or vector-search replacement.",
            evidence_used=evidence,
            missing_evidence=_dedupe(missing + ([] if has_data_loading_path else ["data-loading or oracle construction path"])),
            assumptions=[
                *common_assumptions,
                "Search value depends on whether the workload can be expressed as a structured oracle.",
            ],
            caveats=[
                "Data-loading overhead can dominate the theoretical search speedup.",
                "Do not imply generic database, analytics, or vector-search replacement.",
            ],
            next_action="Document the oracle and data-loading path before considering any benchmark candidate.",
            build_eligibility=BuildEligibility.TUTORIAL_ONLY if not has_data_loading_path else BuildEligibility.LIMITED,
            experiment_type="Grover tutorial with data-loading caveat",
            assessment_id=assessment_id,
            created_at=created,
        )
        return _apply_missing_baseline_rule(inputs=inputs, output=output)

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
            ],
            next_action="Write the benchmark protocol and baseline metrics before opening Build.",
            build_eligibility=BuildEligibility.LIMITED,
            experiment_type="benchmark design memo",
            assessment_id=assessment_id,
            created_at=created,
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
        build_eligibility=BuildEligibility.TUTORIAL_ONLY,
        experiment_type="tutorial-only circuit",
        assessment_id=assessment_id,
        created_at=created,
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
        "exportable_memo": output.exportable_memo,
    }

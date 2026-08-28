"""Build one additive result-trust representation across product surfaces."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from foundry_backend.models.models import AlgorithmContract, Assessment, CircuitRun, ExperimentBundle

RESULT_TRUST_VERSION = "Quantum Foundry Result Trust v1"


def _iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    if value:
        return str(value)
    return datetime.now(timezone.utc).isoformat()


def _baseline_status(baseline: str, *, not_applicable: bool = False) -> str:
    if not_applicable:
        return "not applicable - migration action"
    return "declared" if baseline.strip() else "missing"


def _dedupe(items: list[Any]) -> list[Any]:
    return list(dict.fromkeys(item for item in items if item not in (None, "")))


def _first_evidence_link(inputs: dict[str, Any] | None) -> str | None:
    links = (inputs or {}).get("evidenceLinks", [])
    if not isinstance(links, list):
        return None
    return next((str(link) for link in links if str(link).startswith(("https://", "http://"))), None)


def _complete_trust(
    trust: dict[str, Any],
    *,
    result_type: str = "Unknown",
    source_type: str = "UNKNOWN",
    source_organization: str | None = None,
    source_link: str | None = None,
    claim_status: str | None = None,
) -> dict[str, Any]:
    """Fill additive Result Trust v2 fields while preserving stored values."""

    trust.setdefault("result_type", result_type)
    trust.setdefault("hardware_or_simulator_name", trust.get("backend"))
    trust.setdefault("estimate_level", None)
    trust.setdefault("hardware_horizon", trust.get("time_horizon"))
    trust.setdefault("source_type", source_type)
    trust.setdefault("source_organization", source_organization)
    trust.setdefault("source_link", source_link)
    trust.setdefault("publication_date", None)
    trust.setdefault("last_verified_date", trust.get("generated_at"))
    trust.setdefault("claim_status", claim_status)
    return trust


def assessment_result_trust(assessment: Assessment) -> dict[str, Any]:
    output = assessment.qals_output or {}
    is_pqc = output.get("problem_class") == "CRYPTO_SECURITY"
    is_tutorial = output.get("contract_validity_status") == "TUTORIAL_ONLY"
    baseline = str(output.get("classical_baseline_summary", ""))
    return _complete_trust({
        "evidence_category": "tutorial" if is_tutorial else "estimate",
        "backend": "QALS 3.0 deterministic rules",
        "execution_status": "assessment only",
        "qubit_count": None,
        "circuit_depth": None,
        "one_qubit_gate_count": None,
        "two_qubit_gate_count": None,
        "shots": None,
        "result_distribution": [],
        "ideal_or_noisy": None,
        "noise_model_description": None,
        "classical_baseline_status": _baseline_status(baseline, not_applicable=is_pqc),
        "contract_validity_status": output.get("contract_validity_status", "TUTORIAL_ONLY"),
        "readiness_verdict": output.get("verdict", assessment.verdict),
        "confidence": output.get("confidence", assessment.confidence),
        "time_horizon": output.get("time_horizon", assessment.time_horizon),
        "trust_labels": list(output.get("trust_labels", assessment.trust_labels or [])),
        "assumptions": list(output.get("assumptions", [])),
        "missing_evidence": list(output.get("missing_evidence", [])),
        "caveats": list(output.get("caveats", [])),
        "provenance": [
            f"Assessment {assessment.id}",
            "Deterministic rules plus user-declared inputs and cited evidence; no ML scoring.",
        ],
        "generated_at": _iso(assessment.updated_at or assessment.created_at),
        "software_or_model_version": "QALS 3.0 deterministic Algorithm Contract engine",
        "estimate_level": "deterministic contract assessment",
        "hardware_or_simulator_name": None,
    },
        result_type="Estimated",
        source_type="USER_DECLARED",
        source_organization="Assessment author and Quantum Foundry deterministic rules",
        source_link=_first_evidence_link(assessment.user_inputs),
        claim_status="User-declared evidence and deterministic personal-project analysis",
    )


def circuit_result_trust(run: CircuitRun) -> dict[str, Any]:
    metadata = getattr(run, "run_metadata", {}) or {}
    preview = getattr(run, "assessment_preview", {}) or {}
    noise_description = metadata.get("assumed_noise_model")
    if noise_description:
        noise_description = f"Educational approximation: {noise_description}"
    caveats = list(metadata.get("result_caveats", []))
    educational_noise_caveat = "Educational noise is not calibrated hardware noise."
    if educational_noise_caveat not in caveats:
        caveats.append(educational_noise_caveat)

    return _complete_trust({
        "evidence_category": "tutorial",
        "backend": metadata.get("simulator_backend", "cirq"),
        "execution_status": "simulator",
        "qubit_count": metadata.get("num_qubits"),
        "circuit_depth": metadata.get("circuit_depth"),
        "one_qubit_gate_count": metadata.get("one_qubit_gate_count"),
        "two_qubit_gate_count": metadata.get("two_qubit_gate_count"),
        "shots": metadata.get("shots"),
        "result_distribution": metadata.get("ideal_histogram", getattr(run, "histogram", [])),
        "ideal_or_noisy": metadata.get("ideal_vs_noisy", "ideal"),
        "noise_model_description": noise_description,
        "classical_baseline_status": "not declared - tutorial mode",
        "contract_validity_status": "TUTORIAL_ONLY",
        "readiness_verdict": preview.get("verdict", "EDUCATION_ONLY"),
        "confidence": preview.get("confidence", "LOW"),
        "time_horizon": preview.get("horizon", "SIMULATOR_NOW"),
        "trust_labels": list(metadata.get("trust_labels", ["TUTORIAL", "TOY_SIMULATION"])),
        "assumptions": list(preview.get("assumptions", [])),
        "missing_evidence": ["assessment-backed Algorithm Contract", "declared classical baseline"],
        "caveats": caveats,
        "provenance": [
            f"Circuit run {getattr(run, 'id', 'not persisted')}",
            f"Template {run.template_key.value}",
        ],
        "generated_at": _iso(getattr(run, "created_at", None)),
        "software_or_model_version": f"{metadata.get('simulator_backend', 'cirq')} simulator; {RESULT_TRUST_VERSION}",
        "hardware_or_simulator_name": metadata.get("simulator_backend", "cirq simulator"),
        "estimate_level": "educational simulation",
        "hardware_horizon": "simulator now; hardware access-controlled",
    },
        result_type="Tutorial",
        source_type="TUTORIAL",
        source_organization="Quantum Foundry personal project",
        claim_status="Tutorial result; not a business recommendation or hardware measurement",
    )


def bundle_result_trust(
    bundle: ExperimentBundle,
    *,
    assessment: Assessment | None = None,
    contract: AlgorithmContract | None = None,
) -> dict[str, Any]:
    stored = dict(bundle.result_trust_metrics or {})
    output = assessment.qals_output if assessment else {}
    stored.update(
        {
            "evidence_category": stored.get("evidence_category", "estimate"),
            "backend": stored.get("backend", "simulator"),
            "execution_status": stored.get("execution_status", stored.get("backend", "simulator")),
            "qubit_count": stored.get("qubit_count", stored.get("number_of_qubits")),
            "result_distribution": stored.get("result_distribution", stored.get("histogram", [])),
            "ideal_or_noisy": stored.get("ideal_or_noisy", stored.get("ideal_vs_noisy")),
            "noise_model_description": stored.get("noise_model_description", stored.get("assumed_noise_model")),
            "classical_baseline_status": stored.get("classical_baseline_status", _baseline_status(bundle.classical_baseline)),
            "contract_validity_status": stored.get(
                "contract_validity_status",
                contract.validity_status if contract else output.get("contract_validity_status"),
            ),
            "readiness_verdict": stored.get("readiness_verdict", output.get("verdict")),
            "confidence": stored.get("confidence", output.get("confidence")),
            "time_horizon": stored.get("time_horizon", output.get("time_horizon")),
            "trust_labels": stored.get("trust_labels", list(bundle.trust_labels or [])),
            "assumptions": stored.get("assumptions", list(output.get("assumptions", []))),
            "missing_evidence": stored.get("missing_evidence", list(bundle.next_evidence_required or [])),
            "caveats": stored.get("caveats", list(bundle.limitations or [])),
            "provenance": stored.get(
                "provenance",
                [
                    f"Experiment Bundle {bundle.id}",
                    f"Assessment {bundle.assessment_id}",
                    f"Algorithm Contract {bundle.contract_id}" if bundle.contract_id else "Algorithm Contract missing",
                ],
            ),
            "generated_at": stored.get("generated_at", _iso(bundle.created_at)),
            "software_or_model_version": stored.get("software_or_model_version", RESULT_TRUST_VERSION),
        }
    )
    result_type = "Simulation" if stored.get("backend") == "simulator" else "Estimated"
    return _complete_trust(
        stored,
        result_type=result_type,
        source_type="USER_DECLARED",
        source_organization="Assessment author and Quantum Foundry experiment service",
        claim_status="Contract-mode output pending independent reproduction",
    )


def architecture_result_trust(
    *,
    architecture_id: Any = None,
    created_at: Any = None,
    assessment: Assessment | None = None,
    contract: AlgorithmContract | None = None,
    circuit_run: CircuitRun | None = None,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    context = context or {}
    if circuit_run:
        simulation_trust = circuit_result_trust(circuit_run)
        if assessment:
            decision_trust = assessment_result_trust(assessment)
            trust = {
                **simulation_trust,
                "evidence_category": "estimate",
                "execution_status": "contract architecture with simulator result",
                "classical_baseline_status": decision_trust["classical_baseline_status"],
                "contract_validity_status": decision_trust["contract_validity_status"],
                "readiness_verdict": decision_trust["readiness_verdict"],
                "confidence": decision_trust["confidence"],
                "time_horizon": decision_trust["time_horizon"],
                "trust_labels": list(
                    contract.trust_labels if contract else decision_trust["trust_labels"]
                ),
                "assumptions": list(
                    contract.assumptions if contract else decision_trust["assumptions"]
                ),
                "missing_evidence": list(decision_trust["missing_evidence"]),
                "caveats": _dedupe(
                    [
                        *list(decision_trust["caveats"]),
                        *list(simulation_trust["caveats"]),
                    ]
                ),
                "provenance": _dedupe(
                    [
                        *list(decision_trust["provenance"]),
                        *list(simulation_trust["provenance"]),
                    ]
                ),
            }
        else:
            trust = simulation_trust
            trust["execution_status"] = "tutorial architecture with simulator result"
    elif assessment:
        trust = assessment_result_trust(assessment)
        trust["execution_status"] = "architecture estimate"
    else:
        trust = {
            "evidence_category": "estimate",
            "backend": "deterministic architecture mapper",
            "execution_status": "architecture estimate",
            "qubit_count": None,
            "circuit_depth": None,
            "one_qubit_gate_count": None,
            "two_qubit_gate_count": None,
            "shots": None,
            "result_distribution": [],
            "ideal_or_noisy": None,
            "noise_model_description": None,
            "classical_baseline_status": "declared" if context.get("classical_baseline") else "missing",
            "contract_validity_status": context.get("contract_validity_status"),
            "readiness_verdict": context.get("verdict"),
            "confidence": context.get("confidence"),
            "time_horizon": context.get("time_horizon"),
            "trust_labels": list(context.get("trust_labels", ["TUTORIAL"])),
            "assumptions": list(context.get("assumptions", [])),
            "missing_evidence": list(context.get("missing_evidence", [])),
            "caveats": list(context.get("caveats", [])),
            "provenance": [],
            "generated_at": _iso(created_at),
            "software_or_model_version": RESULT_TRUST_VERSION,
        }

    trust["backend"] = "deterministic architecture mapper"
    trust["contract_validity_status"] = (
        contract.validity_status if contract else trust.get("contract_validity_status")
    )
    baseline = (
        contract.classical_baseline
        if contract
        else str(context.get("classical_baseline", ""))
    )
    if baseline:
        trust["classical_baseline"] = baseline
        trust["classical_baseline_status"] = "declared"
    if contract:
        trust["trust_labels"] = list(contract.trust_labels or trust.get("trust_labels", []))
        trust["assumptions"] = list(contract.assumptions or trust.get("assumptions", []))
        trust["caveats"] = _dedupe(
            [*list(contract.caveats or []), *list(trust.get("caveats", []))]
        )
    trust["provenance"] = [
        *list(trust.get("provenance", [])),
        f"Architecture map {architecture_id}" if architecture_id else "Transient architecture map",
    ]
    trust["generated_at"] = _iso(created_at or trust.get("generated_at"))
    trust["software_or_model_version"] = RESULT_TRUST_VERSION
    trust["estimate_level"] = "contract-specific architecture estimate"
    trust["hardware_or_simulator_name"] = None
    return _complete_trust(
        trust,
        result_type="Estimated",
        source_type="PERSONAL_ANALYSIS",
        source_organization="Quantum Foundry personal project",
        claim_status="Deterministic architecture estimate, not an official reference architecture",
    )

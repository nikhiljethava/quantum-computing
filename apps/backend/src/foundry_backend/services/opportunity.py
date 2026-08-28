"""Opportunity assessment and experiment-bundle service helpers."""

from __future__ import annotations

import dataclasses
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.models.models import (
    AlgorithmContract,
    Assessment,
    ExperimentBundle,
    Job,
    JobStatus,
    JobType,
    UseCase,
)
from foundry_core.assessment import (
    BuildEligibility,
    ProblemClass,
    TrustLabel,
    run_qals_2,
    serialize_assessment_output,
)
from foundry_core.mapping.gcp_mapper import build_architecture_map
from foundry_backend.services.result_trust import (
    RESULT_TRUST_VERSION,
    assessment_result_trust,
    bundle_result_trust,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _recommendation_compat(verdict: str) -> str:
    """Map QALS 3.0 verdicts onto the legacy frontend recommendation enum."""

    if verdict == "SIMULATOR_PROTOTYPE_NOW":
        return "hybrid_pilot_now"
    if verdict in {"RESEARCH_PARTNERSHIP", "FUTURE_FTQC", "RESEARCH_SCOPING_REQUIRED"}:
        return "research_only"
    if verdict in {"BENCHMARK_FIRST", "PQC_MIGRATION_NOW", "INVENTORY_FIRST"}:
        return "watchlist"
    return "classical_now"


def _legacy_lists(qals_output: dict[str, Any]) -> tuple[list[str], list[str], list[str], list[str]]:
    promising = [
        qals_output.get("plain_english_recommendation", ""),
        qals_output.get("quantum_candidate_summary", ""),
    ]
    not_now = list(qals_output.get("caveats", []))
    blockers = list(qals_output.get("missing_evidence", [])) or [
        "No major missing evidence recorded."
    ]
    next_steps = [qals_output.get("next_best_action", "Rerun the readiness assessment.")]
    return (
        [item for item in promising if item],
        [item for item in not_now if item],
        [item for item in blockers if item],
        [item for item in next_steps if item],
    )


def build_score_breakdown(qals_output: dict[str, Any]) -> dict[str, float]:
    """Return a transparent compatibility score breakdown for legacy charts."""

    score = float(qals_output.get("readiness_score", 0)) / 100
    has_baseline = "current classical baseline" not in [
        str(item).lower() for item in qals_output.get("missing_evidence", [])
    ]
    has_evidence = bool(qals_output.get("evidence_used"))
    has_assumptions = bool(qals_output.get("assumptions"))
    return {
        "verdict_fit": round(score * 0.4, 4),
        "baseline_strength": 0.25 if has_baseline else 0.0,
        "evidence_strength": 0.2 if has_evidence else 0.05,
        "assumption_clarity": 0.15 if has_assumptions else 0.05,
    }


def run_qals_for_use_case(
    *,
    use_case: UseCase,
    user_inputs: dict[str, Any],
    assessment_id: uuid.UUID | None = None,
    created_at: str | None = None,
) -> dict[str, Any]:
    """Run QALS 3.0 against a use case and return JSON-safe output."""

    qals = run_qals_2(
        user_inputs=user_inputs,
        use_case_title=use_case.title,
        use_case_description=use_case.description,
        use_case_industry=use_case.industry.value,
        use_case_quantum_approach=use_case.quantum_approach,
        use_case_blueprint=use_case.blueprint,
        use_case_evidence_items=use_case.evidence_items,
        assessment_id=str(assessment_id or uuid.uuid4()),
        created_at=created_at or _now_iso(),
    )
    return serialize_assessment_output(qals)


def apply_qals_to_assessment(
    *,
    assessment: Assessment,
    qals_output: dict[str, Any],
) -> None:
    """Copy QALS 3.0 output into the persisted assessment row."""

    assessment.qals_score = float(qals_output["readiness_score"]) / 100
    assessment.verdict = qals_output["verdict"]
    assessment.score_breakdown = build_score_breakdown(qals_output)
    assessment.problem_class = qals_output["problem_class"]
    assessment.readiness_score = int(qals_output["readiness_score"])
    assessment.confidence = qals_output["confidence"]
    assessment.time_horizon = qals_output["time_horizon"]
    assessment.trust_labels = qals_output["trust_labels"]
    assessment.qals_output = qals_output
    assessment.build_eligibility = qals_output["build_eligibility"]
    assessment.exportable_memo = qals_output["exportable_memo"]


def serialize_assessment(assessment: Assessment) -> dict[str, Any]:
    """Return an AssessmentRead-compatible dictionary."""

    qals_output = assessment.qals_output or {}
    why_promising, why_not_now, blockers, next_90_days = _legacy_lists(qals_output)
    return {
        "id": assessment.id,
        "use_case_id": assessment.use_case_id,
        "user_inputs": assessment.user_inputs,
        "qals_score": assessment.qals_score,
        "verdict": assessment.verdict,
        "score_breakdown": assessment.score_breakdown,
        "recommendation": _recommendation_compat(assessment.verdict),
        "readiness_score": qals_output.get("readiness_score", assessment.readiness_score or 0),
        "confidence": qals_output.get("confidence", assessment.confidence or "LOW"),
        "time_horizon": qals_output.get("time_horizon", assessment.time_horizon or "NOW_CLASSICAL"),
        "trust_labels": qals_output.get("trust_labels", assessment.trust_labels or []),
        "problem_class": qals_output.get("problem_class", assessment.problem_class or "UNKNOWN"),
        "recommended_contract_type": qals_output.get("recommended_contract_type", "TUTORIAL"),
        "recommended_algorithm_family": qals_output.get("recommended_algorithm_family", "UNKNOWN"),
        "contract_validity_status": qals_output.get("contract_validity_status", "TUTORIAL_ONLY"),
        "plain_english_recommendation": qals_output.get("plain_english_recommendation", ""),
        "classical_baseline_summary": qals_output.get("classical_baseline_summary", ""),
        "quantum_candidate_summary": qals_output.get("quantum_candidate_summary", ""),
        "evidence_used": qals_output.get("evidence_used", []),
        "missing_evidence": qals_output.get("missing_evidence", []),
        "assumptions": qals_output.get("assumptions", []),
        "caveats": qals_output.get("caveats", []),
        "next_best_action": qals_output.get("next_best_action", ""),
        "build_eligibility": qals_output.get(
            "build_eligibility",
            assessment.build_eligibility or BuildEligibility.LIMITED_TUTORIAL_ONLY.value,
        ),
        "recommended_experiment_type": qals_output.get("recommended_experiment_type", ""),
        "hardware_assumptions": qals_output.get("hardware_assumptions", []),
        "mathematical_object": qals_output.get("mathematical_object", ""),
        "reduction_summary": qals_output.get("reduction_summary", ""),
        "required_inputs": qals_output.get("required_inputs", []),
        "provided_inputs": qals_output.get("provided_inputs", []),
        "missing_inputs": qals_output.get("missing_inputs", []),
        "benchmark_plan": qals_output.get("benchmark_plan", ""),
        "resource_estimate": qals_output.get("resource_estimate", {}),
        "exportable_memo": qals_output.get("exportable_memo", assessment.exportable_memo or ""),
        "why_promising": why_promising,
        "why_not_now": why_not_now,
        "top_blockers": blockers,
        "next_90_days": next_90_days,
        "result_trust": assessment_result_trust(assessment),
        "created_at": assessment.created_at,
        "updated_at": getattr(assessment, "updated_at", None),
    }


def _contract_title(qals_output: dict[str, Any]) -> str:
    contract_type = qals_output.get("recommended_contract_type", "TUTORIAL").replace("_", " ").title()
    family = qals_output.get("recommended_algorithm_family", "UNKNOWN").replace("_", " ").title()
    return f"{contract_type} Algorithm Contract - {family}"


async def create_algorithm_contract(
    db: AsyncSession,
    *,
    assessment: Assessment,
) -> AlgorithmContract:
    """Create or return the latest Algorithm Contract generated from an assessment."""

    qals_output = assessment.qals_output or {}
    stmt = (
        select(AlgorithmContract)
        .where(AlgorithmContract.assessment_id == assessment.id)
        .order_by(AlgorithmContract.created_at.desc())
        .limit(1)
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        return existing

    contract = AlgorithmContract(
        assessment_id=assessment.id,
        contract_type=qals_output.get("recommended_contract_type", "TUTORIAL"),
        algorithm_family=qals_output.get("recommended_algorithm_family", "UNKNOWN"),
        title=_contract_title(qals_output),
        description=qals_output.get("plain_english_recommendation", ""),
        validity_status=qals_output.get("contract_validity_status", "TUTORIAL_ONLY"),
        mathematical_object=qals_output.get("mathematical_object", ""),
        reduction_summary=qals_output.get("reduction_summary", ""),
        required_inputs=qals_output.get("required_inputs", []),
        provided_inputs=qals_output.get("provided_inputs", []),
        missing_inputs=qals_output.get("missing_inputs", []),
        assumptions=qals_output.get("assumptions", []),
        caveats=qals_output.get("caveats", []),
        classical_baseline=qals_output.get("classical_baseline_summary", ""),
        benchmark_plan=qals_output.get("benchmark_plan", ""),
        resource_estimate=qals_output.get("resource_estimate", {}),
        trust_labels=qals_output.get("trust_labels", []),
        build_eligibility=qals_output.get("build_eligibility", BuildEligibility.LIMITED_TUTORIAL_ONLY.value),
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract


def serialize_algorithm_contract(contract: AlgorithmContract) -> dict[str, Any]:
    """Return an AlgorithmContractRead-compatible dictionary."""

    return {
        "id": contract.id,
        "assessment_id": contract.assessment_id,
        "contract_type": contract.contract_type,
        "algorithm_family": contract.algorithm_family,
        "title": contract.title,
        "description": contract.description,
        "validity_status": contract.validity_status,
        "mathematical_object": contract.mathematical_object,
        "reduction_summary": contract.reduction_summary,
        "required_inputs": contract.required_inputs,
        "provided_inputs": contract.provided_inputs,
        "missing_inputs": contract.missing_inputs,
        "assumptions": contract.assumptions,
        "caveats": contract.caveats,
        "classical_baseline": contract.classical_baseline,
        "benchmark_plan": contract.benchmark_plan,
        "resource_estimate": contract.resource_estimate,
        "trust_labels": contract.trust_labels,
        "build_eligibility": contract.build_eligibility,
        "created_at": contract.created_at,
        "updated_at": contract.updated_at,
    }


def _job_type_for_problem_class(problem_class: str) -> JobType:
    if problem_class == ProblemClass.QUANTUM_SIMULATION.value:
        return JobType.chemistry
    if problem_class == ProblemClass.OPTIMIZATION.value:
        return JobType.routing
    if problem_class == ProblemClass.SEARCH.value:
        return JobType.grover
    return JobType.coin_flip


def _build_gcp_map(qals_output: dict[str, Any]) -> dict[str, Any]:
    architecture = build_architecture_map(
        {
            "job_type": qals_output.get("recommended_experiment_type", ""),
            "qals_score": float(qals_output.get("readiness_score", 0)) / 100,
            "verdict": qals_output.get("verdict", ""),
            "problem_class": qals_output.get("problem_class", ""),
            "contract_type": qals_output.get("recommended_contract_type", "TUTORIAL"),
            "algorithm_family": qals_output.get("recommended_algorithm_family", "UNKNOWN"),
            "time_horizon": qals_output.get("time_horizon", ""),
            "classical_baseline": qals_output.get("classical_baseline_summary", ""),
            "contract_validity_status": qals_output.get("contract_validity_status", ""),
            "confidence": qals_output.get("confidence", ""),
            "trust_labels": qals_output.get("trust_labels", []),
            "assumptions": qals_output.get("assumptions", []),
            "missing_evidence": qals_output.get("missing_evidence", []),
            "caveats": qals_output.get("caveats", []),
        }
    )
    return {
        "title": architecture.title,
        "summary": architecture.summary,
        "components": [dataclasses.asdict(component) for component in architecture.components],
        "connections": [list(connection) for connection in architecture.connections],
        "notes": architecture.notes,
        "problem_class": architecture.problem_class,
        "contract_type": architecture.contract_type,
        "time_horizon": architecture.time_horizon,
        "assumptions": architecture.assumptions,
        "trust_labels": architecture.trust_labels,
    }


def _default_trust_metrics(qals_output: dict[str, Any]) -> dict[str, Any]:
    is_crypto = qals_output.get("problem_class") == ProblemClass.CRYPTO_SECURITY.value
    is_stub = (
        qals_output.get("build_eligibility")
        not in {
            BuildEligibility.ELIGIBLE_FOR_TOY_EXPERIMENT.value,
            BuildEligibility.ELIGIBLE_FOR_BENCHMARK.value,
            BuildEligibility.ELIGIBLE_FOR_RESEARCH_PROTOTYPE.value,
        }
        or qals_output.get("contract_validity_status") != "VALID"
        or bool(qals_output.get("missing_inputs", []))
    )
    return {
        "evidence_category": "estimate",
        "backend": "non-compute migration workflow" if is_crypto else ("stub" if is_stub else "simulator"),
        "execution_status": "non-compute action" if is_crypto else ("stub" if is_stub else "simulator queued"),
        "number_of_qubits": None,
        "qubit_count": None,
        "circuit_depth": None,
        "one_qubit_gate_count": None,
        "two_qubit_gate_count": None,
        "shots": None if is_stub else 1000,
        "histogram": [],
        "result_distribution": [],
        "ideal_vs_noisy": None if is_stub else "ideal",
        "ideal_or_noisy": None if is_stub else "ideal",
        "assumed_noise_model": None,
        "noise_model_description": None,
        "hardware_readiness_label": "hardware access-controlled",
        "classical_baseline_status": (
            "not applicable - migration action"
            if is_crypto
            else (
                "declared"
                if qals_output.get("classical_baseline_summary")
                and "current classical baseline" not in qals_output.get("missing_evidence", [])
                else "missing"
            )
        ),
        "contract_validity_status": qals_output.get("contract_validity_status"),
        "readiness_verdict": qals_output.get("verdict"),
        "confidence": qals_output.get("confidence"),
        "time_horizon": qals_output.get("time_horizon"),
        "trust_labels": qals_output.get("trust_labels", []),
        "assumptions": qals_output.get("assumptions", []),
        "missing_evidence": qals_output.get("missing_evidence", []),
        "caveats": [
            "This is a simulation trust panel, not hardware characterization.",
            "Real hardware results may differ because queueing, calibration, topology, and noise are not represented here.",
            *qals_output.get("caveats", []),
        ] if not is_crypto else list(qals_output.get("caveats", [])),
        "provenance": [
            f"Assessment {qals_output.get('id', 'pending')}",
            "QALS 3.0 deterministic Algorithm Contract output",
        ],
        "generated_at": qals_output.get("created_at", _now_iso()),
        "software_or_model_version": RESULT_TRUST_VERSION,
    }


async def create_experiment_bundle(
    db: AsyncSession,
    *,
    assessment: Assessment,
    contract: AlgorithmContract | None = None,
    queue_simulation: bool = True,
) -> ExperimentBundle:
    """Create an assessment and contract-anchored Experiment Bundle."""

    qals_output = assessment.qals_output or {}
    assessment_eligibility = qals_output.get(
        "build_eligibility",
        assessment.build_eligibility or BuildEligibility.LIMITED_TUTORIAL_ONLY.value,
    )
    contract_eligibility = contract.build_eligibility if contract else assessment_eligibility
    allowed_eligibilities = {
        BuildEligibility.ELIGIBLE_FOR_TOY_EXPERIMENT.value,
        BuildEligibility.ELIGIBLE_FOR_BENCHMARK.value,
        BuildEligibility.ELIGIBLE_FOR_RESEARCH_PROTOTYPE.value,
        BuildEligibility.NON_COMPUTE_ACTION_ONLY.value,
    }
    if (
        assessment_eligibility not in allowed_eligibilities
        or contract_eligibility not in allowed_eligibilities
    ):
        raise ValueError(
            "This Algorithm Contract is blocked or tutorial-only and cannot create a serious Experiment Bundle."
        )

    if contract and contract.assessment_id != assessment.id:
        raise ValueError("Algorithm Contract does not belong to the supplied assessment.")

    is_crypto = qals_output.get("problem_class") == ProblemClass.CRYPTO_SECURITY.value
    missing_evidence = {str(item).strip().lower() for item in qals_output.get("missing_evidence", [])}
    if not is_crypto and (
        not str(qals_output.get("classical_baseline_summary", "")).strip()
        or "current classical baseline" in missing_evidence
    ):
        raise ValueError("A declared current classical baseline is required before a serious Experiment Bundle.")

    contract_ready_for_compute = (
        qals_output.get("contract_validity_status") == "VALID"
        and not qals_output.get("missing_inputs", [])
    )
    can_queue_simulation = contract_ready_for_compute and assessment_eligibility in {
        BuildEligibility.ELIGIBLE_FOR_TOY_EXPERIMENT.value,
        BuildEligibility.ELIGIBLE_FOR_BENCHMARK.value,
        BuildEligibility.ELIGIBLE_FOR_RESEARCH_PROTOTYPE.value,
    }
    job = None
    if queue_simulation and not is_crypto and can_queue_simulation:
        job_type = _job_type_for_problem_class(str(qals_output.get("problem_class", "")))
        stmt = (
            select(Job)
            .where(Job.job_type == job_type)
            .where(Job.payload["assessment_id"].as_string() == str(assessment.id))
            .order_by(Job.created_at.desc())
            .limit(1)
        )
        job = (await db.execute(stmt)).scalar_one_or_none()
        if job is None:
            job = Job(
                job_type=job_type,
                payload={
                    "assessment_id": str(assessment.id),
                    "contract_id": str(contract.id) if contract else None,
                    "trust_labels": qals_output.get("trust_labels", []),
                    "recommended_experiment_type": qals_output.get("recommended_experiment_type", ""),
                    "prompt": qals_output.get("quantum_candidate_summary", ""),
                    "repetitions": 1000,
                    "simulator_backend": "cirq",
                    "noise_enabled": False,
                },
                logs=["Queued simulator-first experiment bundle job."],
            )
            db.add(job)
            await db.flush()

    trust_labels = qals_output.get("trust_labels") or [TrustLabel.BENCHMARK_CANDIDATE.value]
    bundle = ExperimentBundle(
        assessment_id=assessment.id,
        contract_id=contract.id if contract else None,
        simulation_job_id=job.id if job else None,
        title=f"{qals_output.get('recommended_algorithm_family', qals_output.get('problem_class', 'UNKNOWN')).replace('_', ' ').title()} Algorithm Experiment Bundle",
        hypothesis=qals_output.get("plain_english_recommendation", ""),
        classical_baseline=qals_output.get("classical_baseline_summary", ""),
        quantum_candidate=qals_output.get("quantum_candidate_summary", ""),
        toy_implementation={
            "type": qals_output.get("recommended_experiment_type", ""),
            "status": "stub" if is_crypto or not can_queue_simulation else "queued",
            "notes": [
                "Simulator-first guardrail is active.",
                "Algorithm Contract and classical baseline remain attached to the bundle.",
                *(
                    ["Required Algorithm Contract inputs must be completed before simulation."]
                    if not is_crypto and not contract_ready_for_compute
                    else []
                ),
            ],
        },
        result_trust_metrics=_default_trust_metrics(qals_output),
        limitations=qals_output.get("caveats", []),
        next_evidence_required=qals_output.get("missing_evidence", []),
        gcp_map=_build_gcp_map(qals_output),
        export_artifacts=[],
        trust_labels=trust_labels,
    )
    db.add(bundle)
    await db.commit()
    await db.refresh(bundle)
    return bundle


def serialize_experiment_bundle(bundle: ExperimentBundle) -> dict[str, Any]:
    """Return an ExperimentBundleRead-compatible dictionary."""

    return {
        "id": bundle.id,
        "assessment_id": bundle.assessment_id,
        "contract_id": bundle.contract_id,
        "simulation_job_id": bundle.simulation_job_id,
        "title": bundle.title,
        "hypothesis": bundle.hypothesis,
        "classical_baseline": bundle.classical_baseline,
        "quantum_candidate": bundle.quantum_candidate,
        "toy_implementation": bundle.toy_implementation,
        "result_trust_metrics": bundle.result_trust_metrics,
        "limitations": bundle.limitations,
        "next_evidence_required": bundle.next_evidence_required,
        "gcp_map": bundle.gcp_map,
        "export_artifacts": bundle.export_artifacts,
        "trust_labels": bundle.trust_labels,
        "result_trust": bundle_result_trust(bundle),
        "created_at": bundle.created_at,
    }

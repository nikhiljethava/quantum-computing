"""
QALS-lite: Quantum Applicability and Likelihood Score heuristic.

QALS-lite is a transparent scoring rubric (NOT a claim of quantum advantage).
It weighs user-provided signals to produce a readiness score from 0.0 to 1.0
and a human-readable verdict to guide the Assess workflow.

Scoring dimensions:
  1. problem_size       — Does classical complexity grow super-polynomially?
  2. data_structure     — Is the data structured for quantum encoding?
  3. classical_hardness — Is the classical solver already hitting its limits?
  4. timeline           — Is the expected timeline realistic for near vs long-term?
  5. use_case_fit       — How well does the complexity_score align with quantum fit?
"""

import dataclasses
from typing import Any, Literal


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VERDICT_THRESHOLDS: list[tuple[float, str]] = [
    (0.75, "Strong Quantum Fit"),
    (0.55, "Likely Hybrid Candidate"),
    (0.35, "Exploratory — Monitor Progress"),
    (0.0, "Classical First — Revisit Later"),
]

PROBLEM_SIZE_SCORES: dict[str, float] = {
    "small": 0.1,
    "medium": 0.4,
    "large": 0.7,
    "very_large": 1.0,
}

DATA_STRUCTURE_SCORES: dict[str, float] = {
    "unstructured": 0.2,
    "structured": 0.6,
    "quantum_native": 1.0,
}

CLASSICAL_HARDNESS_SCORES: dict[str, float] = {
    "easy": 0.0,
    "medium": 0.3,
    "hard": 0.7,
    "intractable": 1.0,
}

TIMELINE_SCORES: dict[str, float] = {
    "now": 0.2,       # classical hardware is still ahead for most tasks today
    "1-2 years": 0.5,
    "2-3 years": 0.7,
    "5+ years": 1.0,  # long-term bets can target fault-tolerant qubits
}

DIMENSION_WEIGHTS: dict[str, float] = {
    "problem_size": 0.25,
    "data_structure": 0.20,
    "classical_hardness": 0.30,
    "timeline": 0.15,
    "use_case_fit": 0.10,
}

assert abs(sum(DIMENSION_WEIGHTS.values()) - 1.0) < 1e-9, "Weights must sum to 1.0"


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class QalsResult:
    """Typed result of the QALS-lite assessment."""

    score: float
    """0.0 – 1.0 aggregate readiness score."""

    verdict: str
    """Human-readable verdict from VERDICT_THRESHOLDS."""

    breakdown: dict[str, float]
    """Per-dimension weighted contribution scores."""


AssessmentRecommendation = Literal[
    "classical_now",
    "hybrid_pilot_now",
    "watchlist",
    "research_only",
]


@dataclasses.dataclass
class AssessmentResult:
    """Expanded deterministic assessment contract for the Assess experience."""

    qals_score: float
    verdict: str
    score_breakdown: dict[str, float]
    recommendation: AssessmentRecommendation
    why_promising: list[str]
    why_not_now: list[str]
    top_blockers: list[str]
    next_90_days: list[str]


# ---------------------------------------------------------------------------
# Heuristic
# ---------------------------------------------------------------------------


def run_qals_lite(user_inputs: dict[str, Any], use_case_complexity: float) -> QalsResult:
    """
    Run the QALS-lite heuristic.

    Args:
        user_inputs: Dict of user answers from the Assess modal. Keys:
            - problem_size: "small" | "medium" | "large" | "very_large"
            - data_structure: "unstructured" | "structured" | "quantum_native"
            - classical_hardness: "easy" | "medium" | "hard" | "intractable"
            - timeline: "now" | "1-2 years" | "2-3 years" | "5+ years"
        use_case_complexity: Float 1–5 from the UseCase record.

    Returns:
        QalsResult with score, verdict, and per-dimension breakdown.
    """
    def _lookup(table: dict[str, float], key: str, default: float = 0.3) -> float:
        return table.get(str(user_inputs.get(key, "")).lower().strip(), default)

    raw_scores: dict[str, float] = {
        "problem_size": _lookup(PROBLEM_SIZE_SCORES, "problem_size"),
        "data_structure": _lookup(DATA_STRUCTURE_SCORES, "data_structure"),
        "classical_hardness": _lookup(CLASSICAL_HARDNESS_SCORES, "classical_hardness"),
        "timeline": _lookup(TIMELINE_SCORES, "timeline"),
        # Normalize complexity (1–5) → (0.2–1.0)
        "use_case_fit": max(0.0, min(1.0, (use_case_complexity - 1) / 4)),
    }

    breakdown: dict[str, float] = {
        dim: round(raw_scores[dim] * weight, 4)
        for dim, weight in DIMENSION_WEIGHTS.items()
    }

    score = round(sum(breakdown.values()), 4)

    verdict = "Classical First — Revisit Later"
    for threshold, label in VERDICT_THRESHOLDS:
        if score >= threshold:
            verdict = label
            break

    return QalsResult(score=score, verdict=verdict, breakdown=breakdown)


def _clean_string(value: Any) -> str:
    return str(value or "").strip()


def _list_strings(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _has_pilot_blueprint(blueprint: dict[str, Any]) -> bool:
    return any(
        _clean_string(blueprint.get(key))
        for key in ("persona", "business_kpi", "classical_baseline", "hybrid_pattern", "sample_input")
    ) or bool(_list_strings(blueprint.get("next_90_days")))


def _derive_recommendation(
    *,
    qals_score: float,
    horizon: str,
    classical_hardness: str,
    evidence_count: int,
    has_pilot_blueprint: bool,
) -> AssessmentRecommendation:
    if (
        horizon == "near-term"
        and qals_score >= 0.55
        and evidence_count >= 2
        and has_pilot_blueprint
    ):
        return "hybrid_pilot_now"

    if horizon == "long-term" and qals_score < 0.55:
        return "research_only"

    if classical_hardness in {"easy", "medium"} and qals_score < 0.35:
        return "classical_now"

    if 0.35 <= qals_score < 0.55:
        return "watchlist"

    if qals_score < 0.35:
        return "classical_now" if horizon == "near-term" else "research_only"

    if horizon == "long-term":
        return "research_only"

    if horizon == "mid-term":
        return "watchlist"

    return "watchlist"


def _build_why_promising(
    *,
    qals_score: float,
    horizon: str,
    classical_hardness: str,
    evidence_count: int,
    blueprint: dict[str, Any],
) -> list[str]:
    reasons: list[str] = []

    if qals_score >= 0.55:
        reasons.append("The current QALS-lite inputs clear the threshold for a scoped hybrid pilot.")
    elif qals_score >= 0.35:
        reasons.append("Several technical signals are directionally positive even though the case is not pilot-ready yet.")
    else:
        reasons.append("The workload still exposes a real optimization or modeling challenge worth tracking.")

    if horizon == "near-term":
        reasons.append("The use case is already framed as a near-term workflow instead of a fault-tolerant future bet.")
    elif horizon == "mid-term":
        reasons.append("The roadmap is compatible with simulator-first experimentation over the next few planning cycles.")

    if classical_hardness in {"hard", "intractable"}:
        reasons.append("Classical baselines are under enough pressure to justify exploring a hybrid subproblem.")

    if evidence_count >= 2:
        reasons.append(f"There are already {evidence_count} evidence items that anchor the narrative in public studies or industry experiments.")

    if _clean_string(blueprint.get("hybrid_pattern")):
        reasons.append("The use-case blueprint already sketches a concrete hybrid workflow instead of a generic quantum pitch.")

    return reasons[:4]


def _build_why_not_now(
    *,
    qals_score: float,
    horizon: str,
    classical_hardness: str,
    evidence_count: int,
    has_pilot_blueprint: bool,
    user_inputs: dict[str, Any],
) -> list[str]:
    reasons: list[str] = []

    if qals_score < 0.55:
        reasons.append("The current QALS-lite score is still below the threshold for a confident hybrid pilot recommendation.")

    if horizon == "long-term":
        reasons.append("This use case is explicitly long-term, so hardware and algorithm maturity remain gating assumptions.")

    if evidence_count < 2:
        reasons.append("The evidence base is still thin, which makes it harder to justify near-term investment.")

    if not has_pilot_blueprint:
        reasons.append("The pilot design is not concrete yet; the team still needs a scoped workflow, KPI, and benchmark plan.")

    if classical_hardness in {"easy", "medium"}:
        reasons.append("Current classical baselines still look practical enough that a quantum pilot is not the best immediate move.")

    if _clean_string(user_inputs.get("timeline")).lower() == "now":
        reasons.append("An immediate delivery window favors dependable classical execution over extra quantum experimentation.")

    if not reasons:
        reasons.append("The main risk is execution discipline: keep the scope narrow and benchmark against a strong classical baseline.")

    return reasons[:4]


def _build_top_blockers(
    *,
    qals_score: float,
    horizon: str,
    classical_hardness: str,
    evidence_count: int,
    has_pilot_blueprint: bool,
) -> list[str]:
    blockers: list[str] = []

    if qals_score < 0.55:
        blockers.append("QALS-lite score is below the hybrid pilot threshold.")
    if horizon == "long-term":
        blockers.append("Hardware readiness does not match the use case horizon yet.")
    if evidence_count < 2:
        blockers.append("There are fewer than two external evidence points backing the workflow.")
    if not has_pilot_blueprint:
        blockers.append("A scoped pilot blueprint and benchmark plan are still missing.")
    if classical_hardness in {"easy", "medium"}:
        blockers.append("Classical methods remain easier to operationalize for the current workload.")

    if not blockers:
        blockers.append("The main blocker is disciplined execution on a narrowly scoped pilot.")

    return blockers[:4]


def _default_next_90_days(recommendation: AssessmentRecommendation) -> list[str]:
    if recommendation == "hybrid_pilot_now":
        return [
            "Freeze one narrow workflow, KPI, and benchmark dataset for the pilot.",
            "Compare the incumbent classical baseline, simulator runs, and any quantum-inspired baseline on the same scope.",
            "Package the results into a stakeholder-ready brief with a clear go or no-go decision.",
        ]

    if recommendation == "watchlist":
        return [
            "Define the smallest benchmarkable subproblem and the KPI that would justify revisiting the case.",
            "Track at least two external studies or vendor results that map closely to this workflow.",
            "Re-run the assessment after the evidence base or pilot scope becomes more concrete.",
        ]

    if recommendation == "research_only":
        return [
            "Reduce the use case to a simulator-scale research benchmark rather than a business pilot.",
            "Track algorithm and hardware milestones that would materially change the feasibility outlook.",
            "Document the exact assumptions that would need to shift before a pilot is justified.",
        ]

    return [
        "Lock the incumbent classical workflow and benchmark it against the target KPI.",
        "Record where the classical approach actually struggles before revisiting quantum options.",
        "Re-open the quantum path only if scale, constraints, or latency requirements materially change.",
    ]


def _build_next_90_days(
    recommendation: AssessmentRecommendation,
    blueprint: dict[str, Any],
) -> list[str]:
    blueprint_steps = _list_strings(blueprint.get("next_90_days"))
    if blueprint_steps and recommendation in {"hybrid_pilot_now", "watchlist"}:
        return blueprint_steps[:4]
    return _default_next_90_days(recommendation)


def run_assessment(
    *,
    user_inputs: dict[str, Any],
    use_case_complexity: float,
    use_case_horizon: str,
    use_case_blueprint: dict[str, Any] | None = None,
    use_case_evidence_items: list[dict[str, Any]] | None = None,
) -> AssessmentResult:
    """Return QALS-lite output plus a deterministic recommendation contract."""

    qals = run_qals_lite(user_inputs=user_inputs, use_case_complexity=use_case_complexity)
    blueprint = use_case_blueprint or {}
    evidence_items = use_case_evidence_items or []
    horizon = _clean_string(use_case_horizon).lower() or "mid-term"
    classical_hardness = _clean_string(user_inputs.get("classical_hardness")).lower()
    evidence_count = len([item for item in evidence_items if isinstance(item, dict) and item])
    has_pilot_blueprint = _has_pilot_blueprint(blueprint)

    recommendation = _derive_recommendation(
        qals_score=qals.score,
        horizon=horizon,
        classical_hardness=classical_hardness,
        evidence_count=evidence_count,
        has_pilot_blueprint=has_pilot_blueprint,
    )

    return AssessmentResult(
        qals_score=qals.score,
        verdict=qals.verdict,
        score_breakdown=qals.breakdown,
        recommendation=recommendation,
        why_promising=_build_why_promising(
            qals_score=qals.score,
            horizon=horizon,
            classical_hardness=classical_hardness,
            evidence_count=evidence_count,
            blueprint=blueprint,
        ),
        why_not_now=_build_why_not_now(
            qals_score=qals.score,
            horizon=horizon,
            classical_hardness=classical_hardness,
            evidence_count=evidence_count,
            has_pilot_blueprint=has_pilot_blueprint,
            user_inputs=user_inputs,
        ),
        top_blockers=_build_top_blockers(
            qals_score=qals.score,
            horizon=horizon,
            classical_hardness=classical_hardness,
            evidence_count=evidence_count,
            has_pilot_blueprint=has_pilot_blueprint,
        ),
        next_90_days=_build_next_90_days(recommendation, blueprint),
    )

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
from typing import Any


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

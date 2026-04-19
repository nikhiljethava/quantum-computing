"""Unit tests for the deterministic assessment recommendation mapping."""

import pytest

from foundry_core.assessment.heuristic import run_assessment


BASE_BLUEPRINT = {
    "persona": "Operations lead",
    "business_kpi": "Lower cost per decision",
    "hybrid_pattern": "Classical pipeline -> quantum subproblem -> classical validation",
    "next_90_days": [
        "Freeze one benchmark workflow.",
        "Compare baselines on the same dataset.",
        "Package results for a go/no-go review.",
    ],
}

BASE_EVIDENCE = [
    {"title": "Study 1", "claim": "Promising signal"},
    {"title": "Study 2", "claim": "Second promising signal"},
]


@pytest.mark.parametrize(
    ("user_inputs", "use_case_complexity", "use_case_horizon", "blueprint", "evidence_items", "expected"),
    [
        (
            {
                "problem_size": "large",
                "data_structure": "structured",
                "classical_hardness": "hard",
                "timeline": "1-2 years",
            },
            3.5,
            "near-term",
            BASE_BLUEPRINT,
            BASE_EVIDENCE,
            "hybrid_pilot_now",
        ),
        (
            {
                "problem_size": "medium",
                "data_structure": "structured",
                "classical_hardness": "medium",
                "timeline": "1-2 years",
            },
            3.0,
            "mid-term",
            BASE_BLUEPRINT,
            BASE_EVIDENCE,
            "watchlist",
        ),
        (
            {
                "problem_size": "small",
                "data_structure": "unstructured",
                "classical_hardness": "medium",
                "timeline": "now",
            },
            2.0,
            "near-term",
            BASE_BLUEPRINT,
            BASE_EVIDENCE,
            "classical_now",
        ),
        (
            {
                "problem_size": "medium",
                "data_structure": "structured",
                "classical_hardness": "hard",
                "timeline": "now",
            },
            3.0,
            "long-term",
            {},
            [],
            "research_only",
        ),
        (
            {
                "problem_size": "large",
                "data_structure": "structured",
                "classical_hardness": "hard",
                "timeline": "1-2 years",
            },
            3.5,
            "near-term",
            {},
            BASE_EVIDENCE,
            "watchlist",
        ),
    ],
)
def test_run_assessment_returns_expected_recommendation(
    user_inputs: dict[str, str],
    use_case_complexity: float,
    use_case_horizon: str,
    blueprint: dict[str, object],
    evidence_items: list[dict[str, str]],
    expected: str,
) -> None:
    result = run_assessment(
        user_inputs=user_inputs,
        use_case_complexity=use_case_complexity,
        use_case_horizon=use_case_horizon,
        use_case_blueprint=blueprint,
        use_case_evidence_items=evidence_items,
    )

    assert result.recommendation == expected
    assert 0.0 <= result.qals_score <= 1.0
    assert result.top_blockers
    assert result.next_90_days

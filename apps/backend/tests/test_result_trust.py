"""Shared result-trust representation tests."""

from datetime import datetime, timezone
from types import SimpleNamespace
import uuid

from foundry_backend.models.models import Assessment, JobType
from foundry_backend.services.result_trust import assessment_result_trust, circuit_result_trust


def test_tutorial_result_trust_is_educational_and_not_calibrated_hardware() -> None:
    run = SimpleNamespace(
        id=uuid.uuid4(),
        template_key=JobType.bell_state,
        histogram=[{"state": "00", "probability": 50, "count": 50}],
        run_metadata={
            "simulator_backend": "cirq",
            "num_qubits": 2,
            "circuit_depth": 3,
            "one_qubit_gate_count": 1,
            "two_qubit_gate_count": 1,
            "shots": 100,
            "ideal_vs_noisy": "ideal+noisy",
            "assumed_noise_model": "depolarizing probability 0.05",
            "trust_labels": ["TUTORIAL", "TOY_SIMULATION"],
            "result_caveats": ["Toy simulation only."],
        },
        assessment_preview={
            "verdict": "EDUCATION_ONLY",
            "confidence": "LOW",
            "horizon": "SIMULATOR_NOW",
            "assumptions": ["Educational framing"],
        },
        created_at=datetime.now(timezone.utc),
    )

    trust = circuit_result_trust(run)

    assert trust["evidence_category"] == "tutorial"
    assert trust["result_type"] == "Tutorial"
    assert trust["source_type"] == "TUTORIAL"
    assert trust["hardware_or_simulator_name"] == "cirq"
    assert trust["estimate_level"] == "educational simulation"
    assert trust["execution_status"] == "simulator"
    assert trust["contract_validity_status"] == "TUTORIAL_ONLY"
    assert {"TUTORIAL", "TOY_SIMULATION"} <= set(trust["trust_labels"])
    assert "Educational approximation" in trust["noise_model_description"]
    assert "calibrated hardware noise" in " ".join(trust["caveats"])
    assert trust["evidence_category"] != "measured hardware result"


def test_assessment_result_trust_contains_required_decision_fields() -> None:
    now = datetime.now(timezone.utc)
    assessment = Assessment(
        id=uuid.uuid4(),
        use_case_id=uuid.uuid4(),
        user_inputs={"currentClassicalBaseline": "OR-Tools"},
        qals_score=0.64,
        verdict="SIMULATOR_PROTOTYPE_NOW",
        score_breakdown={},
        problem_class="OPTIMIZATION",
        readiness_score=64,
        confidence="MEDIUM",
        time_horizon="SIMULATOR_NOW",
        trust_labels=["BENCHMARK_CANDIDATE"],
        qals_output={
            "problem_class": "OPTIMIZATION",
            "verdict": "SIMULATOR_PROTOTYPE_NOW",
            "confidence": "MEDIUM",
            "time_horizon": "SIMULATOR_NOW",
            "contract_validity_status": "VALID",
            "classical_baseline_summary": "OR-Tools",
            "trust_labels": ["BENCHMARK_CANDIDATE"],
            "assumptions": ["Frozen benchmark"],
            "missing_evidence": ["Held-out instances"],
            "caveats": ["Production advantage unproven."],
        },
        build_eligibility="ELIGIBLE_FOR_BENCHMARK",
        exportable_memo="memo",
        created_at=now,
        updated_at=now,
    )

    trust = assessment_result_trust(assessment)

    assert trust["classical_baseline_status"] == "declared"
    assert trust["result_type"] == "Estimated"
    assert trust["source_type"] == "USER_DECLARED"
    assert trust["claim_status"]
    assert trust["last_verified_date"]
    assert trust["contract_validity_status"] == "VALID"
    assert trust["readiness_verdict"] == "SIMULATOR_PROTOTYPE_NOW"
    assert trust["confidence"] == "MEDIUM"
    assert trust["time_horizon"] == "SIMULATOR_NOW"
    assert trust["assumptions"]
    assert trust["missing_evidence"]
    assert trust["caveats"]
    assert trust["provenance"]
    assert trust["generated_at"]
    assert trust["software_or_model_version"]

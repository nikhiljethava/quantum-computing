"""Tests for Algorithm Contract persistence and Build gating services."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

import pytest

from foundry_backend.models.models import Assessment, ExperimentBundle
from foundry_backend.services.opportunity import (
    create_algorithm_contract,
    create_experiment_bundle,
    serialize_algorithm_contract,
)
from foundry_core.assessment import run_qals_2, serialize_assessment_output


class _FakeScalarResult:
    def __init__(self, row: object | None = None) -> None:
        self.row = row

    def scalar_one_or_none(self) -> object | None:
        return self.row


class _FakeAsyncSession:
    def __init__(self) -> None:
        self.added: list[object] = []
        self.commit_calls = 0

    async def execute(self, _stmt) -> _FakeScalarResult:
        return _FakeScalarResult()

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def commit(self) -> None:
        self.commit_calls += 1

    async def refresh(self, instance: object) -> None:
        if getattr(instance, "id", None) is None:
            instance.id = uuid.uuid4()
        if getattr(instance, "created_at", None) is None:
            instance.created_at = datetime.now(timezone.utc)
        if getattr(instance, "updated_at", None) is None:
            instance.updated_at = datetime.now(timezone.utc)

    async def flush(self) -> None:
        for instance in self.added:
            if getattr(instance, "id", None) is None:
                instance.id = uuid.uuid4()


def _assessment(qals_output: dict) -> Assessment:
    return Assessment(
        id=uuid.uuid4(),
        use_case_id=uuid.uuid4(),
        user_inputs={},
        qals_score=float(qals_output["readiness_score"]) / 100,
        verdict=qals_output["verdict"],
        score_breakdown={},
        problem_class=qals_output["problem_class"],
        readiness_score=qals_output["readiness_score"],
        confidence=qals_output["confidence"],
        time_horizon=qals_output["time_horizon"],
        trust_labels=qals_output["trust_labels"],
        qals_output=qals_output,
        build_eligibility=qals_output["build_eligibility"],
        exportable_memo=qals_output["exportable_memo"],
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_create_algorithm_contract_from_assessment_output() -> None:
    qals_output = serialize_assessment_output(
        run_qals_2(
            user_inputs={
                "problemClass": "OPTIMIZATION",
                "problemDescription": "Vehicle routing QUBO benchmark",
                "problemSize": "10 stops",
                "currentClassicalBaseline": "OR-Tools",
                "baselineMetrics": "runtime and objective recorded",
                "knownAlgorithmsConsidered": "QAOA",
            }
        )
    )
    db = _FakeAsyncSession()

    contract = await create_algorithm_contract(db, assessment=_assessment(qals_output))
    body = serialize_algorithm_contract(contract)

    assert body["contract_type"] in {"QUBO_ISING", "QAOA"}
    assert body["algorithm_family"] == "QAOA"
    assert body["build_eligibility"] == "ELIGIBLE_FOR_BENCHMARK"
    assert "BENCHMARK_CANDIDATE" in body["trust_labels"]


@pytest.mark.asyncio
async def test_blocked_contract_cannot_create_serious_bundle() -> None:
    qals_output = serialize_assessment_output(
        run_qals_2(
            user_inputs={
                "problemClass": "SEARCH",
                "problemDescription": "Grover search with no oracle",
                "currentClassicalBaseline": "Elasticsearch",
                "baselineMetrics": "sub-second lookup",
            }
        )
    )
    db = _FakeAsyncSession()
    assessment = _assessment(qals_output)
    contract = await create_algorithm_contract(db, assessment=assessment)

    with pytest.raises(ValueError, match="blocked or tutorial-only"):
        await create_experiment_bundle(db, assessment=assessment, contract=contract)


@pytest.mark.asyncio
async def test_missing_classical_baseline_restricts_contract_experiment() -> None:
    qals_output = serialize_assessment_output(
        run_qals_2(
            user_inputs={
                "problemClass": "OPTIMIZATION",
                "problemDescription": "Vehicle routing without a benchmark baseline",
                "problemSize": "10 stops",
            }
        )
    )
    db = _FakeAsyncSession()
    assessment = _assessment(qals_output)
    contract = await create_algorithm_contract(db, assessment=assessment)

    assert contract.build_eligibility == "LIMITED_TUTORIAL_ONLY"
    with pytest.raises(ValueError, match="blocked or tutorial-only"):
        await create_experiment_bundle(db, assessment=assessment, contract=contract)

    contract.build_eligibility = "ELIGIBLE_FOR_BENCHMARK"
    contract.classical_baseline = "User-edited placeholder"
    with pytest.raises(ValueError, match="blocked or tutorial-only"):
        await create_experiment_bundle(db, assessment=assessment, contract=contract)


@pytest.mark.asyncio
async def test_pqc_bundle_is_non_compute_and_has_no_simulation_job_or_circuit_node() -> None:
    qals_output = serialize_assessment_output(
        run_qals_2(
            user_inputs={
                "problemClass": "CRYPTO_SECURITY",
                "problemDescription": "Inventory RSA, ECC, DH, and ECDSA for migration",
                "securityCryptoInventory": {
                    "systemsAffected": "TLS, VPN, code signing",
                    "dataShelfLifeYears": "10",
                    "migrationTimeYears": "4",
                    "assumedQuantumCollapseTimeYears": "12",
                    "certificateLifetimes": "five years",
                    "systemOwners": "security architecture",
                    "cryptoAgilityStatus": "partial",
                    "inventoryCompleteness": "complete",
                },
            }
        )
    )
    db = _FakeAsyncSession()
    assessment = _assessment(qals_output)
    contract = await create_algorithm_contract(db, assessment=assessment)
    bundle = await create_experiment_bundle(
        db,
        assessment=assessment,
        contract=contract,
        queue_simulation=True,
    )

    component_ids = {item["id"] for item in bundle.gcp_map["components"]}
    assert bundle.simulation_job_id is None
    assert bundle.toy_implementation["status"] == "stub"
    assert bundle.result_trust_metrics["execution_status"] == "non-compute action"
    assert not any("circuit" in component_id for component_id in component_ids)
    assert all(
        item["execution_kind"] == "classical" for item in bundle.gcp_map["components"]
    )


@pytest.mark.asyncio
async def test_eligible_contract_creates_contract_anchored_bundle() -> None:
    qals_output = serialize_assessment_output(
        run_qals_2(
            user_inputs={
                "problemClass": "OPTIMIZATION",
                "problemDescription": "Vehicle routing QUBO benchmark",
                "problemSize": "10 stops",
                "currentClassicalBaseline": "OR-Tools",
                "baselineMetrics": "runtime and objective recorded",
                "knownAlgorithmsConsidered": "QAOA",
            }
        )
    )
    db = _FakeAsyncSession()
    assessment = _assessment(qals_output)
    contract = await create_algorithm_contract(db, assessment=assessment)

    bundle = await create_experiment_bundle(
        db,
        assessment=assessment,
        contract=contract,
        queue_simulation=False,
    )

    assert isinstance(bundle, ExperimentBundle)
    assert bundle.contract_id == contract.id
    assert "Algorithm Contract" in " ".join(bundle.toy_implementation["notes"])


@pytest.mark.asyncio
async def test_partial_contract_creates_scoped_bundle_without_queueing_simulation() -> None:
    qals_output = serialize_assessment_output(
        run_qals_2(
            user_inputs={
                "problemClass": "OPTIMIZATION",
                "problemDescription": "Vehicle routing benchmark",
                "problemSize": "10 stops",
                "currentClassicalBaseline": "OR-Tools",
                "baselineMetrics": "runtime and objective recorded",
                "knownAlgorithmsConsidered": "QAOA",
            }
        )
    )
    assert qals_output["contract_validity_status"] == "PARTIAL"
    db = _FakeAsyncSession()
    assessment = _assessment(qals_output)
    contract = await create_algorithm_contract(db, assessment=assessment)

    bundle = await create_experiment_bundle(
        db,
        assessment=assessment,
        contract=contract,
        queue_simulation=True,
    )

    assert bundle.simulation_job_id is None
    assert bundle.toy_implementation["status"] == "stub"
    assert "Required Algorithm Contract inputs" in " ".join(
        bundle.toy_implementation["notes"]
    )

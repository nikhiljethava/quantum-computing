"""Tests for worker job lifecycle and export execution."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest

from foundry_backend.core.config import settings
from foundry_backend.models.models import (
    AlgorithmContract,
    ArchitectureRecord,
    Assessment,
    Artifact,
    ArtifactType,
    CircuitRun,
    ExperimentBundle,
    Job,
    JobStatus,
    JobType,
)
from foundry_worker import main as worker_main


class _FakeScalarResult:
    def __init__(self, rows: list[object]) -> None:
        self._rows = rows

    def scalars(self) -> _FakeScalarResult:
        return self

    def all(self) -> list[object]:
        return list(self._rows)

    def scalar_one_or_none(self) -> object | None:
        return self._rows[0] if self._rows else None


class _FakeAsyncSession:
    def __init__(
        self,
        *,
        execute_rows: list[object] | None = None,
        get_map: dict[tuple[type[object], uuid.UUID], object] | None = None,
    ) -> None:
        self.execute_rows = execute_rows or []
        self.get_map = get_map or {}
        self.added: list[object] = []
        self.commit_calls = 0
        self.refreshed: list[object] = []

    async def execute(self, _stmt) -> _FakeScalarResult:
        return _FakeScalarResult(self.execute_rows)

    async def get(self, model: type[object], key: uuid.UUID) -> object | None:
        return self.get_map.get((model, key))

    def add(self, obj: object) -> None:
        self.added.append(obj)

    async def flush(self) -> None:
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid.uuid4()

    async def commit(self) -> None:
        self.commit_calls += 1

    async def refresh(self, obj: object) -> None:
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(tz=timezone.utc)
        self.refreshed.append(obj)


def _build_circuit_run() -> CircuitRun:
    return CircuitRun(
        id=uuid.uuid4(),
        template_key=JobType.coin_flip,
        prompt="Create a coin flip.",
        guide_response="I will generate a single-qubit circuit.",
        explanation="Hadamard creates an even split before measurement.",
        circuit_text="0: ---H---M---",
        cirq_code="print('hello quantum')",
        histogram=[{"state": "0", "probability": 50, "count": 500}],
        measurements={"result": [0, 1]},
        run_metadata={"concept": "Superposition"},
        assessment_preview={
            "score": 72,
            "verdict": "Credible prototype candidate now",
            "horizon": "Hybrid experiment now",
            "confidence": "Medium confidence",
            "explanation": ["Simulation-first path."],
            "assumptions": ["Educational framing."],
        },
    )


def _build_architecture(circuit_run: CircuitRun) -> ArchitectureRecord:
    return ArchitectureRecord(
        id=uuid.uuid4(),
        circuit_run_id=circuit_run.id,
        title="Simulation-first architecture",
        summary="Cloud Run calls a simulator worker and packages exports.",
        components=[{"id": "cloud_run", "name": "Cloud Run"}],
        connections=[["frontend", "cloud_run"]],
        notes=["Hardware remains optional."],
    )


def _build_contract_records(
    *,
    problem_class: str = "OPTIMIZATION",
    validity_status: str = "VALID",
    missing_inputs: list[str] | None = None,
    baseline: str = "OR-Tools with objective and runtime metrics",
) -> tuple[Assessment, AlgorithmContract, ExperimentBundle]:
    assessment_id = uuid.uuid4()
    contract_id = uuid.uuid4()
    bundle_id = uuid.uuid4()
    is_pqc = problem_class == "CRYPTO_SECURITY"
    eligibility = "NON_COMPUTE_ACTION_ONLY" if is_pqc else "ELIGIBLE_FOR_BENCHMARK"
    qals_output = {
        "problem_class": problem_class,
        "recommended_contract_type": "PQC_RISK" if is_pqc else "QAOA",
        "contract_validity_status": validity_status,
        "build_eligibility": eligibility,
        "classical_baseline_summary": baseline,
        "missing_inputs": missing_inputs or [],
        "missing_evidence": ["current classical baseline"] if not baseline else [],
    }
    assessment = Assessment(
        id=assessment_id,
        use_case_id=uuid.uuid4(),
        user_inputs={},
        qals_score=0.6,
        verdict="PQC_MIGRATION_NOW" if is_pqc else "SIMULATOR_PROTOTYPE_NOW",
        score_breakdown={},
        problem_class=problem_class,
        readiness_score=60,
        confidence="MEDIUM",
        time_horizon="NOW_CLASSICAL" if is_pqc else "SIMULATOR_NOW",
        trust_labels=["ACTION_NOW"] if is_pqc else ["BENCHMARK_CANDIDATE"],
        qals_output=qals_output,
        build_eligibility=eligibility,
        exportable_memo="memo",
    )
    contract = AlgorithmContract(
        id=contract_id,
        assessment_id=assessment_id,
        contract_type="PQC_RISK" if is_pqc else "QAOA",
        algorithm_family="PQC_READINESS" if is_pqc else "QAOA",
        title="Contract",
        description="Contract description",
        validity_status=validity_status,
        mathematical_object="Migration inventory" if is_pqc else "QUBO",
        reduction_summary="Scoped reduction",
        required_inputs=["classical baseline"],
        provided_inputs=[] if missing_inputs else ["classical baseline"],
        missing_inputs=missing_inputs or [],
        assumptions=[],
        caveats=[],
        classical_baseline=baseline,
        benchmark_plan="Compare the same instance.",
        resource_estimate={},
        trust_labels=["ACTION_NOW"] if is_pqc else ["BENCHMARK_CANDIDATE"],
        build_eligibility=eligibility,
    )
    bundle = ExperimentBundle(
        id=bundle_id,
        assessment_id=assessment_id,
        contract_id=contract_id,
        title="Contract bundle",
        hypothesis="Test the candidate against the baseline.",
        classical_baseline=baseline,
        quantum_candidate="QAOA" if not is_pqc else "No quantum circuit",
        toy_implementation={},
        result_trust_metrics={},
        limitations=[],
        next_evidence_required=[],
        gcp_map={},
        export_artifacts=[],
        trust_labels=["ACTION_NOW"] if is_pqc else ["BENCHMARK_CANDIDATE"],
    )
    return assessment, contract, bundle


@pytest.mark.asyncio
async def test_poll_once_completes_job_and_persists_job_output_artifact(monkeypatch) -> None:
    job = Job(
        id=uuid.uuid4(),
        job_type=JobType.coin_flip,
        status=JobStatus.pending,
        payload={"prompt": "Create a coin flip."},
    )
    db = _FakeAsyncSession(execute_rows=[job])

    async def fake_execute_job(*_args, **_kwargs) -> dict[str, object]:
        return {
            "circuit_run_id": str(uuid.uuid4()),
            "job_output_artifact_uri": "local:///tmp/coin_flip_circuit.txt",
            "job_output_size": 42,
        }

    monkeypatch.setattr(worker_main, "_execute_job", fake_execute_job)

    processed = await worker_main.poll_once(db)

    assert processed == 1
    assert job.status == JobStatus.completed
    assert job.started_at is not None
    assert job.completed_at is not None
    assert job.error_message is None
    assert job.result is not None
    assert db.commit_calls == 2
    assert len(db.added) == 1
    artifact = db.added[0]
    assert isinstance(artifact, Artifact)
    assert artifact.job_id == job.id
    assert artifact.artifact_type == ArtifactType.job_output
    assert artifact.size_bytes == 42
    assert job.result_artifact_id == artifact.id
    assert job.result["artifact_id"] == str(artifact.id)
    assert job.result["download_path"] == f"/api/v1/artifacts/{artifact.id}/download"


@pytest.mark.asyncio
async def test_poll_once_marks_failed_jobs_and_skips_artifact_creation(monkeypatch) -> None:
    job = Job(
        id=uuid.uuid4(),
        job_type=JobType.routing,
        status=JobStatus.pending,
        payload={"prompt": "Show a routing example."},
    )
    db = _FakeAsyncSession(execute_rows=[job])

    async def fake_execute_job(*_args, **_kwargs) -> dict[str, object]:
        raise RuntimeError("worker exploded")

    monkeypatch.setattr(worker_main, "_execute_job", fake_execute_job)

    processed = await worker_main.poll_once(db)

    assert processed == 1
    assert job.status == JobStatus.failed
    assert job.started_at is not None
    assert job.completed_at is not None
    assert job.error_message == "worker exploded"
    assert db.commit_calls == 2
    assert db.added == []


@pytest.mark.asyncio
async def test_contract_experiment_rejects_missing_required_contract_fields() -> None:
    assessment, contract, bundle = _build_contract_records(
        validity_status="PARTIAL",
        missing_inputs=["penalty terms or QUBO coefficients"],
    )
    db = _FakeAsyncSession(
        get_map={
            (Assessment, assessment.id): assessment,
            (AlgorithmContract, contract.id): contract,
            (ExperimentBundle, bundle.id): bundle,
        }
    )

    with pytest.raises(ValueError, match="Complete the required Algorithm Contract fields"):
        await worker_main._execute_circuit_job(
            db,
            job_id=str(uuid.uuid4()),
            job_type=JobType.routing.value,
            payload={
                "assessment_id": str(assessment.id),
                "contract_id": str(contract.id),
                "experiment_bundle_id": str(bundle.id),
            },
        )


@pytest.mark.asyncio
async def test_contract_experiment_rejects_missing_classical_baseline() -> None:
    assessment, contract, bundle = _build_contract_records(baseline="")
    db = _FakeAsyncSession(
        get_map={
            (Assessment, assessment.id): assessment,
            (AlgorithmContract, contract.id): contract,
            (ExperimentBundle, bundle.id): bundle,
        }
    )

    with pytest.raises(ValueError, match="classical baseline is required"):
        await worker_main._execute_circuit_job(
            db,
            job_id=str(uuid.uuid4()),
            job_type=JobType.routing.value,
            payload={
                "assessment_id": str(assessment.id),
                "contract_id": str(contract.id),
                "experiment_bundle_id": str(bundle.id),
            },
        )


@pytest.mark.asyncio
async def test_pqc_contract_experiment_never_creates_a_quantum_circuit() -> None:
    assessment, contract, bundle = _build_contract_records(problem_class="CRYPTO_SECURITY")
    db = _FakeAsyncSession(
        get_map={
            (Assessment, assessment.id): assessment,
            (AlgorithmContract, contract.id): contract,
            (ExperimentBundle, bundle.id): bundle,
        }
    )

    with pytest.raises(ValueError, match="non-compute migration workflows"):
        await worker_main._execute_circuit_job(
            db,
            job_id=str(uuid.uuid4()),
            job_type=JobType.grover.value,
            payload={
                "assessment_id": str(assessment.id),
                "contract_id": str(contract.id),
                "experiment_bundle_id": str(bundle.id),
            },
        )


@pytest.mark.asyncio
async def test_valid_contract_experiment_runs_with_bundle_context(monkeypatch) -> None:
    assessment, contract, bundle = _build_contract_records()
    db = _FakeAsyncSession(
        get_map={
            (Assessment, assessment.id): assessment,
            (AlgorithmContract, contract.id): contract,
            (ExperimentBundle, bundle.id): bundle,
        }
    )
    run = _build_circuit_run()
    architecture = _build_architecture(run)
    architecture.assessment_id = assessment.id
    architecture.contract_id = contract.id
    architecture.problem_class = assessment.problem_class
    architecture.contract_type = contract.contract_type
    architecture.trust_context = {
        "classical_baseline_status": "declared",
        "contract_validity_status": "VALID",
        "trust_labels": ["BENCHMARK_CANDIDATE"],
    }

    async def fake_create_circuit_run(**_kwargs):
        return run

    async def fake_create_architecture_record(_db, **_kwargs):
        return architecture

    async def fake_save(**_kwargs):
        return "local:///tmp/contract-circuit.txt"

    monkeypatch.setattr(worker_main, "create_circuit_run", fake_create_circuit_run)
    monkeypatch.setattr(worker_main, "create_architecture_record", fake_create_architecture_record)
    monkeypatch.setattr(worker_main.storage, "save", fake_save)

    result = await worker_main._execute_circuit_job(
        db,
        job_id=str(uuid.uuid4()),
        job_type=JobType.routing.value,
        payload={
            "assessment_id": str(assessment.id),
            "contract_id": str(contract.id),
            "experiment_bundle_id": str(bundle.id),
        },
    )

    assert result["experiment_bundle_id"] == str(bundle.id)
    assert result["architecture"]["assessment_id"] == str(assessment.id)
    assert result["architecture"]["contract_id"] == str(contract.id)
    assert result["architecture"]["result_trust"]["contract_validity_status"] == "VALID"


@pytest.mark.asyncio
async def test_execute_export_job_creates_session_summary_artifact(tmp_path, monkeypatch) -> None:
    circuit_run = _build_circuit_run()
    architecture = _build_architecture(circuit_run)
    db = _FakeAsyncSession(
        get_map={
            (CircuitRun, circuit_run.id): circuit_run,
            (ArchitectureRecord, architecture.id): architecture,
        }
    )

    monkeypatch.setattr(settings, "storage_backend", "local")
    monkeypatch.setattr(settings, "artifact_dir", str(tmp_path))

    job_id = uuid.uuid4()
    result = await worker_main._execute_export_job(
        db,
        job_id=str(job_id),
        payload={
            "circuit_run_id": str(circuit_run.id),
            "architecture_record_id": str(architecture.id),
        },
    )

    assert result["artifact_type"] == ArtifactType.session_summary.value
    assert result["artifact_id"]
    assert result["filename"].endswith("_session_summary.md")
    assert result["content_type"] == "text/markdown"
    assert result["size_bytes"] > 0
    assert len(db.added) == 1
    artifact = db.added[0]
    assert isinstance(artifact, Artifact)
    assert artifact.job_id == job_id
    output_path = Path(artifact.storage_uri.removeprefix("local://"))
    assert output_path.exists()
    contents = output_path.read_text(encoding="utf-8")
    assert "Simulation-first output only." in contents
    assert "Serious recommendations require a QALS 3.0 Algorithm Contract" in contents
    assert "This tutorial preview is not a business recommendation" in contents
    assert "Educational noise is not calibrated hardware noise." in contents
    assert "## Result Trust" in contents

"""Backward-compatible additive API schema tests for Phase 0."""

from datetime import datetime, timezone
import uuid

from foundry_backend.models.models import ArchitectureRecord, Artifact
from foundry_backend.schemas.schemas import ArtifactRead, ArchitectureRead, GcpComponentRead


def test_legacy_architecture_component_defaults_to_classical() -> None:
    component = GcpComponentRead(
        id="cloud_run",
        name="Cloud Run",
        service="Cloud Run",
        description="Legacy component without execution classification.",
    )
    assert component.execution_kind == "classical"


def test_legacy_architecture_response_parses_without_phase0_fields() -> None:
    architecture = ArchitectureRead(
        title="Legacy map",
        summary="Legacy response remains parseable.",
        components=[
            {
                "id": "cloud_run",
                "name": "Cloud Run",
                "service": "Cloud Run",
                "description": "Legacy component",
            }
        ],
        connections=[],
        notes=[],
    )

    assert architecture.problem_class == "UNKNOWN"
    assert architecture.contract_type == "TUTORIAL"
    assert architecture.time_horizon == "SIMULATOR_NOW"
    assert architecture.result_trust is None


def test_legacy_artifact_response_parses_without_contract_trust_fields() -> None:
    artifact = ArtifactRead(
        id=uuid.uuid4(),
        artifact_type="cirq_code",
        filename="tutorial.py",
        content_type="text/x-python",
        storage_uri="local:///tmp/tutorial.py",
        size_bytes=42,
        download_path="/api/v1/artifacts/example/download",
        created_at=datetime.now(timezone.utc),
    )

    assert artifact.contract_id is None
    assert artifact.result_trust is None


def test_legacy_result_trust_payload_gets_additive_evidence_defaults() -> None:
    from foundry_backend.schemas.schemas import ResultTrustRead

    trust = ResultTrustRead(evidence_category="estimate", classical_baseline_status="missing")

    assert trust.result_type == "Unknown"
    assert trust.source_type == "UNKNOWN"
    assert trust.hardware_or_simulator_name is None
    assert trust.last_verified_date is None


def test_phase0_persistence_models_include_contract_and_trust_context() -> None:
    architecture_columns = ArchitectureRecord.__table__.c
    artifact_columns = Artifact.__table__.c

    assert {"contract_id", "problem_class", "contract_type", "trust_context"}.issubset(
        architecture_columns.keys()
    )
    assert {"contract_id", "trust_context"}.issubset(artifact_columns.keys())

"""Artifact generation helpers for exports and worker outputs."""

import json
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.core.config import settings
from foundry_backend.models.models import ArchitectureRecord, Artifact, ArtifactType, CircuitRun, UseCase
from foundry_core.storage import get_storage_backend


def build_download_path(artifact_id: Any) -> str:
    """Return the relative API download path for an artifact."""

    return f"/api/v1/artifacts/{artifact_id}/download"


def _json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")


def _build_session_summary(
    circuit_run: CircuitRun,
    architecture_record: ArchitectureRecord | None,
    use_case: UseCase | None,
) -> str:
    histogram_lines = "\n".join(
        f"- `{entry['state']}`: {entry['probability']}% ({entry['count']} shots)"
        for entry in circuit_run.histogram
    )
    assessment = circuit_run.assessment_preview
    explanation_lines = "\n".join(f"- {item}" for item in assessment.get("explanation", []))
    assumptions_lines = "\n".join(f"- {item}" for item in assessment.get("assumptions", []))
    notes_lines = (
        "\n".join(f"- {item}" for item in architecture_record.notes)
        if architecture_record
        else "- Architecture map was not persisted for this session."
    )

    use_case_line = (
        f"Anchored use case: **{use_case.title}**\n\n{use_case.description}\n"
        if use_case
        else "Anchored use case: none selected.\n"
    )

    architecture_summary = (
        architecture_record.summary
        if architecture_record
        else "Architecture summary unavailable."
    )

    return f"""# Quantum Foundry Session Summary

## Circuit
- Template: `{circuit_run.template_key.value}`
- Prompt: {circuit_run.prompt}
- Concept: {circuit_run.metadata.get('concept', 'N/A')}

## Use Case
{use_case_line}

## Guide Explanation
{circuit_run.explanation}

## Simulation Histogram
{histogram_lines}

## QALS-lite Preview
- Score: {assessment.get('score', 'N/A')} / 100
- Verdict: {assessment.get('verdict', 'N/A')}
- Horizon: {assessment.get('horizon', 'N/A')}
- Confidence: {assessment.get('confidence', 'N/A')}

### Why It Matters
{explanation_lines or '- No explanation available.'}

### Missing Assumptions
{assumptions_lines or '- No assumptions recorded.'}

## Architecture Summary
{architecture_summary}

### Architecture Notes
{notes_lines}

## Guardrails
- Simulation-first output only.
- QALS-lite is a heuristic readiness aid, not a quantum advantage claim.
- Hardware access remains optional and configuration-gated.
"""


def _render_export(
    artifact_type: ArtifactType,
    circuit_run: CircuitRun,
    architecture_record: ArchitectureRecord | None,
    use_case: UseCase | None,
) -> tuple[str, str, bytes]:
    template_key = circuit_run.template_key.value

    if artifact_type == ArtifactType.cirq_code:
        return (
            f"{template_key}_circuit.py",
            "text/x-python",
            circuit_run.cirq_code.encode("utf-8"),
        )

    if artifact_type == ArtifactType.assessment_json:
        return (
            f"{template_key}_assessment.json",
            "application/json",
            _json_bytes(circuit_run.assessment_preview),
        )

    if artifact_type == ArtifactType.architecture_json:
        if architecture_record is None:
            raise ValueError("Architecture export requires a persisted architecture record.")
        return (
            f"{template_key}_architecture.json",
            "application/json",
            _json_bytes(
                {
                    "title": architecture_record.title,
                    "summary": architecture_record.summary,
                    "components": architecture_record.components,
                    "connections": architecture_record.connections,
                    "notes": architecture_record.notes,
                }
            ),
        )

    if artifact_type == ArtifactType.session_summary:
        return (
            f"{template_key}_session_summary.md",
            "text/markdown",
            _build_session_summary(circuit_run, architecture_record, use_case).encode("utf-8"),
        )

    raise ValueError(f"Unsupported export artifact type: {artifact_type.value}")


async def create_export_artifact(
    db: AsyncSession,
    *,
    artifact_type: ArtifactType,
    circuit_run: CircuitRun,
    architecture_record: ArchitectureRecord | None,
    use_case: UseCase | None,
    job_id: uuid.UUID | None = None,
) -> Artifact:
    """Generate, persist, and register an export artifact."""

    filename, content_type, content = _render_export(
        artifact_type=artifact_type,
        circuit_run=circuit_run,
        architecture_record=architecture_record,
        use_case=use_case,
    )

    storage = get_storage_backend(
        backend=settings.storage_backend,
        artifact_dir=settings.artifact_dir,
    )
    storage_uri = await storage.save(content=content, filename=filename, content_type=content_type)

    artifact = Artifact(
        job_id=job_id,
        artifact_type=artifact_type,
        circuit_run_id=circuit_run.id,
        architecture_record_id=architecture_record.id if architecture_record else None,
        filename=filename,
        content_type=content_type,
        storage_uri=storage_uri,
        size_bytes=len(content),
    )
    db.add(artifact)
    await db.commit()
    await db.refresh(artifact)
    return artifact


def serialize_artifact(artifact: Artifact) -> dict[str, Any]:
    """Map an Artifact row into the API response contract."""

    return {
        "id": artifact.id,
        "artifact_type": artifact.artifact_type,
        "job_id": artifact.job_id,
        "circuit_run_id": artifact.circuit_run_id,
        "architecture_record_id": artifact.architecture_record_id,
        "filename": artifact.filename,
        "content_type": artifact.content_type,
        "storage_uri": artifact.storage_uri,
        "size_bytes": artifact.size_bytes,
        "download_path": build_download_path(artifact.id),
        "created_at": artifact.created_at,
    }

"""Artifact generation helpers for exports and worker outputs."""

import json
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.core.config import settings
from foundry_backend.models.models import (
    AlgorithmContract,
    ArchitectureRecord,
    Assessment,
    Artifact,
    ArtifactType,
    CircuitRun,
    UseCase,
)
from foundry_backend.services.colab_notebook_export import (
    HARDWARE_ACCESS_GUARDRAIL,
    generate_colab_notebook,
)
from foundry_core.storage import get_storage_backend
from foundry_backend.services.result_trust import assessment_result_trust, circuit_result_trust


def _markdown_list(items: list[str], empty: str) -> str:
    return "\n".join(f"- {item}" for item in items) or f"- {empty}"


def build_download_path(artifact_id: Any) -> str:
    """Return the relative API download path for an artifact."""

    return f"/api/v1/artifacts/{artifact_id}/download"


def _json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")


def _architecture_contract_context(
    architecture_record: ArchitectureRecord | None,
) -> dict[str, Any]:
    if architecture_record is None:
        return {}
    trust = dict(getattr(architecture_record, "trust_context", {}) or {})
    assessment_id = getattr(architecture_record, "assessment_id", None)
    return {
        "assessment_id": str(assessment_id) if assessment_id else None,
        "contract_id": str(getattr(architecture_record, "contract_id", ""))
        if getattr(architecture_record, "contract_id", None)
        else None,
        "problem_class": getattr(architecture_record, "problem_class", None),
        "contract_type": getattr(architecture_record, "contract_type", None),
        "classical_baseline": trust.get("classical_baseline"),
        "time_horizon": trust.get("time_horizon"),
        "assumptions": list(trust.get("assumptions", [])),
        "trust_labels": list(trust.get("trust_labels", [])),
        "result_trust": trust,
    }


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
    contract_context = _architecture_contract_context(architecture_record)
    is_contract_experiment = bool(
        contract_context.get("assessment_id") and contract_context.get("contract_id")
    )
    result_trust = (
        dict(contract_context.get("result_trust", {}))
        if is_contract_experiment
        else circuit_result_trust(circuit_run)
    )
    explanation_lines = "\n".join(f"- {item}" for item in assessment.get("explanation", []))
    assumptions = list(
        result_trust.get("assumptions", assessment.get("assumptions", []))
    )
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
    context_heading = "Algorithm Contract Context" if is_contract_experiment else "Educational Readiness Preview"
    context_note = (
        "This simulator result remains a benchmark or research artifact under its attached "
        "Algorithm Contract; it is not evidence of quantum advantage."
        if is_contract_experiment
        else "This tutorial preview is not a business recommendation and is not evidence of quantum advantage."
    )
    contract_lines = (
        f"- Assessment ID: `{contract_context['assessment_id']}`\n"
        f"- Contract ID: `{contract_context['contract_id']}`\n"
        f"- Problem class: {contract_context.get('problem_class') or 'N/A'}\n"
        f"- Contract type: {contract_context.get('contract_type') or 'N/A'}\n"
        f"- Classical baseline: {contract_context.get('classical_baseline') or 'N/A'}\n"
        if is_contract_experiment
        else ""
    )

    return f"""# Quantum Foundry Session Summary

## Circuit
- Template: `{circuit_run.template_key.value}`
- Prompt: {circuit_run.prompt}
- Concept: {circuit_run.run_metadata.get('concept', 'N/A')}

## Use Case
{use_case_line}

## Guide Explanation
{circuit_run.explanation}

## Simulation Histogram
{histogram_lines}

## {context_heading}
{contract_lines}- Verdict: {result_trust.get('readiness_verdict', assessment.get('verdict', 'N/A'))}
- Horizon: {result_trust.get('time_horizon', assessment.get('horizon', 'N/A'))}
- Confidence: {result_trust.get('confidence', assessment.get('confidence', 'N/A'))}
- Trust labels: {', '.join(result_trust.get('trust_labels', []))}

{context_note}

### Why It Matters
{explanation_lines or '- No explanation available.'}

### Assumptions
{_markdown_list(assumptions, 'No assumptions recorded.')}

## Architecture Summary
{architecture_summary}

### Architecture Notes
{notes_lines}

## Guardrails
- Simulation-first output only.
- Serious recommendations require a QALS 3.0 Algorithm Contract and declared classical baseline.
- Educational noise is not calibrated hardware noise.
- {HARDWARE_ACCESS_GUARDRAIL}

## Result Trust
- Evidence category: {result_trust.get('evidence_category', 'tutorial')}
- Backend: {result_trust.get('backend', 'cirq')}
- Execution status: {result_trust.get('execution_status', 'simulator')}
- Qubits: {result_trust.get('qubit_count', 'N/A')}
- Circuit depth: {result_trust.get('circuit_depth', 'N/A')}
- One-qubit gates: {result_trust.get('one_qubit_gate_count', 'N/A')}
- Two-qubit gates: {result_trust.get('two_qubit_gate_count', 'N/A')}
- Shots: {result_trust.get('shots', 'N/A')}
- Ideal or noisy: {result_trust.get('ideal_or_noisy', 'N/A')}
- Noise model: {result_trust.get('noise_model_description') or 'None; ideal simulator path'}
- Classical baseline status: {result_trust.get('classical_baseline_status', 'N/A')}
- Contract validity: {result_trust.get('contract_validity_status', 'N/A')}
- Readiness verdict: {result_trust.get('readiness_verdict', 'N/A')}
- Confidence: {result_trust.get('confidence', 'N/A')}
- Time horizon: {result_trust.get('time_horizon', 'N/A')}
- Trust labels: {', '.join(result_trust.get('trust_labels', []))}
- Generated: {result_trust.get('generated_at', 'N/A')}
- Software/version: {result_trust.get('software_or_model_version', 'N/A')}

### Missing Evidence
{_markdown_list(list(result_trust.get('missing_evidence', [])), 'No missing evidence recorded.')}

### Caveats
{_markdown_list(list(result_trust.get('caveats', [])), 'No caveats recorded.')}

### Provenance
{_markdown_list(list(result_trust.get('provenance', [])), 'No provenance recorded.')}
"""


def _render_export(
    artifact_type: ArtifactType,
    circuit_run: CircuitRun | None,
    architecture_record: ArchitectureRecord | None,
    use_case: UseCase | None,
) -> tuple[str, str, bytes]:
    template_key = circuit_run.template_key.value if circuit_run else "contract"
    contract_context = _architecture_contract_context(architecture_record)

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
                    **contract_context,
                }
            ),
        )

    if circuit_run is None:
        raise ValueError(f"{artifact_type.value} export requires a persisted circuit run.")

    if artifact_type == ArtifactType.cirq_code:
        code = circuit_run.cirq_code
        if contract_context.get("contract_id"):
            assumptions = "; ".join(contract_context.get("assumptions", [])) or "None recorded"
            labels = ", ".join(contract_context.get("trust_labels", [])) or "None recorded"
            header = (
                "# Quantum Foundry Contract-mode context\n"
                f"# Assessment ID: {contract_context.get('assessment_id')}\n"
                f"# Contract ID: {contract_context.get('contract_id')}\n"
                f"# Problem class: {contract_context.get('problem_class') or 'N/A'}\n"
                f"# Contract type: {contract_context.get('contract_type') or 'N/A'}\n"
                f"# Classical baseline: {contract_context.get('classical_baseline') or 'N/A'}\n"
                f"# Time horizon: {contract_context.get('time_horizon') or 'N/A'}\n"
                f"# Trust labels: {labels}\n"
                f"# Assumptions: {assumptions}\n"
                "# Simulator-first artifact; production advantage is unproven.\n\n"
            )
            code = f"{header}{code}"
        return (
            f"{template_key}_circuit.py",
            "text/x-python",
            code.encode("utf-8"),
        )

    if artifact_type == ArtifactType.colab_notebook:
        notebook = generate_colab_notebook(circuit_run, architecture_record)
        return (
            notebook["filename"],
            notebook["content_type"],
            notebook["bytes"],
        )

    if artifact_type == ArtifactType.assessment_json:
        payload = (
            {
                "mode": "CONTRACT_EXPERIMENT",
                **contract_context,
                "educational_circuit_preview": circuit_run.assessment_preview,
            }
            if contract_context.get("contract_id")
            else circuit_run.assessment_preview
        )
        return (
            f"{template_key}_assessment.json",
            "application/json",
            _json_bytes(payload),
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
    circuit_run: CircuitRun | None,
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
        gcs_bucket=settings.gcs_bucket,
    )
    storage_uri = await storage.save(content=content, filename=filename, content_type=content_type)

    artifact = Artifact(
        job_id=job_id,
        artifact_type=artifact_type,
        circuit_run_id=circuit_run.id if circuit_run else None,
        architecture_record_id=architecture_record.id if architecture_record else None,
        assessment_id=getattr(architecture_record, "assessment_id", None)
        if architecture_record
        else None,
        contract_id=getattr(architecture_record, "contract_id", None)
        if architecture_record
        else None,
        trust_context=dict(getattr(architecture_record, "trust_context", {}) or {})
        if architecture_record
        else circuit_result_trust(circuit_run) if circuit_run else {},
        filename=filename,
        content_type=content_type,
        storage_uri=storage_uri,
        size_bytes=len(content),
    )
    db.add(artifact)
    await db.commit()
    await db.refresh(artifact)
    return artifact


async def create_assessment_memo_artifact(
    db: AsyncSession,
    *,
    assessment: Assessment,
    contract: AlgorithmContract | None = None,
    job_id: uuid.UUID | None = None,
) -> Artifact:
    """Generate the primary Quantum Algorithm Brief or PQC Migration Memo export."""

    memo = assessment.exportable_memo or assessment.qals_output.get("exportable_memo", "")
    if not memo:
        raise ValueError("Assessment does not have an exportable memo.")

    storage = get_storage_backend(
        backend=settings.storage_backend,
        artifact_dir=settings.artifact_dir,
        gcs_bucket=settings.gcs_bucket,
    )
    contract_type = str(assessment.qals_output.get("recommended_contract_type", ""))
    is_pqc = contract_type == "PQC_RISK"
    filename_prefix = "pqc_migration_memo" if is_pqc else "quantum_algorithm_brief"
    artifact_type = ArtifactType.pqc_migration_memo if is_pqc else ArtifactType.algorithm_brief
    filename = f"{filename_prefix}_{assessment.id}.md"
    trust = assessment_result_trust(assessment)
    trust["classical_baseline"] = assessment.qals_output.get(
        "classical_baseline_summary",
        "",
    )
    if contract:
        trust["contract_validity_status"] = contract.validity_status
        trust["trust_labels"] = list(contract.trust_labels or trust["trust_labels"])
        trust["assumptions"] = list(contract.assumptions or trust["assumptions"])
        trust["provenance"] = [
            *list(trust["provenance"]),
            f"Algorithm Contract {contract.id}",
        ]
    trust_section = f"""

## Result Trust

- Evidence category: {trust['evidence_category']}
- Backend: {trust['backend']}
- Classical baseline status: {trust['classical_baseline_status']}
- Contract validity: {trust['contract_validity_status']}
- Readiness verdict: {trust['readiness_verdict']}
- Confidence: {trust['confidence']}
- Time horizon: {trust['time_horizon']}
- Trust labels: {', '.join(trust['trust_labels'])}
- Generated: {trust['generated_at']}
- Software/version: {trust['software_or_model_version']}

### Assumptions
{_markdown_list(trust['assumptions'], 'No assumptions recorded.')}

### Missing Evidence
{_markdown_list(trust['missing_evidence'], 'No missing evidence recorded.')}

### Caveats
{_markdown_list(trust['caveats'], 'No caveats recorded.')}

This is an evidence and simulation trust summary, not QCVV or hardware characterization.
"""
    content = f"{memo.rstrip()}\n{trust_section.strip()}\n".encode("utf-8")
    storage_uri = await storage.save(
        content=content,
        filename=filename,
        content_type="text/markdown",
    )

    artifact = Artifact(
        job_id=job_id,
        assessment_id=assessment.id,
        contract_id=contract.id if contract else None,
        trust_context=trust,
        artifact_type=artifact_type,
        filename=filename,
        content_type="text/markdown",
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
        "assessment_id": artifact.assessment_id,
        "contract_id": getattr(artifact, "contract_id", None),
        "result_trust": dict(getattr(artifact, "trust_context", {}) or {}) or None,
        "filename": artifact.filename,
        "content_type": artifact.content_type,
        "storage_uri": artifact.storage_uri,
        "size_bytes": artifact.size_bytes,
        "download_path": build_download_path(artifact.id),
        "created_at": artifact.created_at,
    }

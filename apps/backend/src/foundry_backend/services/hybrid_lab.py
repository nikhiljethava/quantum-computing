"""Hybrid Lab service helpers shared by the circuit and architecture routes."""

import dataclasses
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.models.models import ArchitectureRecord, CircuitRun, JobType, UseCase
from foundry_core.assessment.heuristic import run_qals_lite
from foundry_core.circuits import CIRCUIT_REGISTRY
from foundry_core.explainers import build_cirq_code, explain_circuit
from foundry_core.mapping.gcp_mapper import ArchitectureMap, build_architecture_map


TEMPLATE_LIBRARY: dict[JobType, dict[str, Any]] = {
    JobType.coin_flip: {
        "label": "Quantum Coin Flip",
        "concept": "Superposition",
        "prompt": "Create a toy circuit that behaves like a quantum coin flip, then show how I would prototype it on Google Cloud.",
        "badge": "Primer favorite",
        "guide_response": "I will prepare a single-qubit circuit with a Hadamard gate, simulate a near 50/50 measurement outcome, and keep the architecture path simulator-first.",
        "parameters": {"repetitions": 1000},
        "assessment_inputs": {
            "problem_size": "medium",
            "data_structure": "structured",
            "classical_hardness": "medium",
            "timeline": "1-2 years",
        },
        "public_signals": [
            "Useful for executive briefings and field demos.",
            "Strong launchpad artifact for teaching the simulator-first story.",
        ],
        "assumptions": [
            "The audience wants intuition before workload intake.",
            "The goal is education, not business advantage claims.",
        ],
    },
    JobType.bell_state: {
        "label": "Bell State",
        "concept": "Entanglement",
        "prompt": "Show a Bell state and explain why the two measurements stay correlated.",
        "badge": "Entanglement demo",
        "guide_response": "I will create a Bell pair with one Hadamard and one CNOT so the user can see how entanglement produces correlated measurements.",
        "parameters": {"repetitions": 1000},
        "assessment_inputs": {
            "problem_size": "medium",
            "data_structure": "structured",
            "classical_hardness": "medium",
            "timeline": "1-2 years",
        },
        "public_signals": [
            "Useful for onboarding PMs, architects, and field teams.",
            "Works well as the bridge from primer to prototype mode.",
        ],
        "assumptions": [
            "The user needs a concept-first example.",
            "The result will be treated as a teaching artifact, not a workload benchmark.",
        ],
    },
    JobType.grover: {
        "label": "Grover Toy Search",
        "concept": "Amplitude amplification",
        "prompt": "Show a toy Grover search and explain why the marked state becomes more likely.",
        "badge": "Search example",
        "guide_response": "I will run a small Grover example to make search amplification visible without overclaiming real-world speedup.",
        "parameters": {"num_qubits": 2, "marked_state": 3, "repetitions": 1000},
        "assessment_inputs": {
            "problem_size": "large",
            "data_structure": "structured",
            "classical_hardness": "hard",
            "timeline": "2-3 years",
        },
        "public_signals": [
            "Good bridge from education into selective workload fit.",
            "Useful for explaining narrow quantum kernels rather than generic acceleration claims.",
        ],
        "assumptions": [
            "The search problem can be expressed with structured state-space logic.",
            "The user is comfortable with a toy example standing in for a much larger class of problems.",
        ],
    },
    JobType.routing: {
        "label": "Toy Routing Optimization",
        "concept": "QAOA-style optimization",
        "prompt": "Show a toy routing optimization example and map it to a hybrid Google Cloud workflow.",
        "badge": "Optimization workflow",
        "guide_response": "I will use a QAOA-style toy circuit to represent a small routing problem and keep the classical prep and post-processing loop explicit.",
        "parameters": {"num_cities": 4, "repetitions": 500},
        "assessment_inputs": {
            "problem_size": "very_large",
            "data_structure": "structured",
            "classical_hardness": "hard",
            "timeline": "1-2 years",
        },
        "public_signals": [
            "Scheduling and routing are common public-facing hybrid optimization narratives.",
            "This lane is the most enterprise-facing prototype story in the current product.",
        ],
        "assumptions": [
            "The routing subproblem can be isolated from the full workflow.",
            "Simulation is acceptable for the first prototype milestone.",
        ],
    },
    JobType.chemistry: {
        "label": "Toy Chemistry Sketch",
        "concept": "VQE structure",
        "prompt": "Create a toy chemistry placeholder that shows how a VQE-style workflow could look without overclaiming.",
        "badge": "Placeholder chemistry path",
        "guide_response": "I will show a VQE-shaped circuit and explain clearly what is illustrative now versus what would need OpenFermion-backed work later.",
        "parameters": {"repetitions": 500},
        "assessment_inputs": {
            "problem_size": "large",
            "data_structure": "quantum_native",
            "classical_hardness": "hard",
            "timeline": "5+ years",
        },
        "public_signals": [
            "Chemistry and materials remain some of the most credible long-term quantum themes.",
            "This lane should stay explicit about roadmap versus v1 capability.",
        ],
        "assumptions": [
            "The user wants a bridge into chemistry workflows, not a full scientific stack.",
            "The placeholder is clearly labelled as educational and roadmap-oriented.",
        ],
    },
}


def list_templates() -> list[dict[str, Any]]:
    """Return starter template metadata for the frontend."""

    templates: list[dict[str, Any]] = []
    for template_key, config in TEMPLATE_LIBRARY.items():
        templates.append(
            {
                "key": template_key.value,
                "label": config["label"],
                "badge": config["badge"],
                "concept": config["concept"],
                "prompt": config["prompt"],
            }
        )
    return templates


def _build_histogram_entries(histogram: dict[str, int]) -> list[dict[str, Any]]:
    total = max(sum(histogram.values()), 1)
    ordered_states = sorted(histogram.items(), key=lambda item: item[1], reverse=True)
    return [
        {
            "state": state,
            "count": count,
            "probability": round((count / total) * 100, 2),
        }
        for state, count in ordered_states
    ]


def _preview_horizon(score: float) -> str:
    if score >= 0.75:
        return "Hybrid experiment now"
    if score >= 0.55:
        return "Prototype now"
    if score >= 0.35:
        return "Hardware-gated later"
    return "Classical now"


def _preview_confidence(score: float) -> str:
    if score >= 0.7:
        return "Medium confidence"
    if score >= 0.45:
        return "Moderate confidence"
    return "Lower confidence"


def build_assessment_preview(template_key: JobType, use_case: UseCase | None) -> dict[str, Any]:
    """Generate a deterministic assessment preview for the Hybrid Lab."""

    template = TEMPLATE_LIBRARY[template_key]
    complexity = use_case.complexity_score if use_case else 3.0
    qals_result = run_qals_lite(
        user_inputs=template["assessment_inputs"],
        use_case_complexity=complexity,
    )

    first_line = (
        f"{template['label']} is being positioned as a simulator-first educational artifact."
        if use_case is None
        else f"{template['label']} is being framed against the {use_case.title} use case."
    )

    return {
        "score": round(qals_result.score * 100),
        "verdict": qals_result.verdict,
        "horizon": _preview_horizon(qals_result.score),
        "confidence": _preview_confidence(qals_result.score),
        "explanation": [
            first_line,
            "The recommendation stays honest about simulation-first constraints and missing evidence.",
            "The best next step is a hybrid prototype path, not a claim of direct quantum advantage.",
        ],
        "assumptions": list(template["assumptions"]),
        "public_signals": list(template["public_signals"]),
        "next_action": (
            "Use the circuit output, QALS-lite explanation, and architecture map together in one follow-up package."
        ),
        "score_breakdown": qals_result.breakdown,
    }


async def create_circuit_run(
    db: AsyncSession,
    template_key: JobType,
    prompt: str | None = None,
    use_case: UseCase | None = None,
    session_id: uuid.UUID | None = None,
    parameter_overrides: dict[str, Any] | None = None,
) -> CircuitRun:
    """Run a synchronous toy circuit and persist the result for the Build workspace."""

    if template_key not in TEMPLATE_LIBRARY:
        raise ValueError(f"Unsupported circuit template: {template_key.value}")

    template = TEMPLATE_LIBRARY[template_key]
    factory = CIRCUIT_REGISTRY[template_key.value]
    parameters = {**template["parameters"], **(parameter_overrides or {})}
    circuit_result = factory(**parameters)

    assessment_preview = build_assessment_preview(template_key=template_key, use_case=use_case)

    run = CircuitRun(
        session_id=session_id,
        use_case_id=use_case.id if use_case else None,
        template_key=template_key,
        prompt=prompt or template["prompt"],
        guide_response=template["guide_response"],
        explanation=explain_circuit(
            template_key=template_key.value,
            metadata=circuit_result.metadata,
            use_case_title=use_case.title if use_case else None,
        ),
        circuit_text=circuit_result.circuit_text,
        cirq_code=build_cirq_code(template_key=template_key.value, metadata=circuit_result.metadata),
        histogram=_build_histogram_entries(circuit_result.histogram),
        measurements=circuit_result.measurements,
        metadata={
            **circuit_result.metadata,
            "label": template["label"],
            "concept": template["concept"],
            "badge": template["badge"],
            "parameters": parameters,
        },
        assessment_preview=assessment_preview,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


def serialize_circuit_run(run: CircuitRun) -> dict[str, Any]:
    """Map a persisted CircuitRun into the API response contract."""

    template = TEMPLATE_LIBRARY[run.template_key]
    return {
        "id": run.id,
        "session_id": run.session_id,
        "template_key": run.template_key,
        "use_case_id": run.use_case_id,
        "prompt": run.prompt,
        "guide_response": run.guide_response,
        "explanation": run.explanation,
        "circuit_text": run.circuit_text,
        "cirq_code": run.cirq_code,
        "histogram": run.histogram,
        "measurements": run.measurements,
        "metadata": run.metadata,
        "assessment_preview": run.assessment_preview,
        "label": template["label"],
        "concept": template["concept"],
        "badge": template["badge"],
        "created_at": run.created_at,
    }


async def create_architecture_record(
    db: AsyncSession,
    *,
    circuit_run: CircuitRun | None = None,
    assessment_id: str | None = None,
    use_case: UseCase | None = None,
) -> ArchitectureRecord:
    """Generate and persist an architecture snapshot."""

    context: dict[str, Any] = {}
    if circuit_run:
        context["job_type"] = circuit_run.template_key.value
        context["job_result"] = {
            "metadata": circuit_run.metadata,
            "histogram": circuit_run.histogram,
        }
        if isinstance(circuit_run.assessment_preview, dict):
            score = float(circuit_run.assessment_preview.get("score", 0)) / 100.0
            context["qals_score"] = score
            context["verdict"] = str(circuit_run.assessment_preview.get("verdict", ""))

    if use_case:
        context["industry"] = use_case.industry.value
        context["complexity"] = use_case.complexity_score

    if not context:
        raise ValueError("Architecture generation requires circuit_run or use_case context.")

    architecture = build_architecture_map(context)
    record = ArchitectureRecord(
        circuit_run_id=circuit_run.id if circuit_run else None,
        assessment_id=assessment_id,
        use_case_id=use_case.id if use_case else None,
        title=architecture.title,
        summary=architecture.summary,
        components=[dataclasses.asdict(component) for component in architecture.components],
        connections=[list(connection) for connection in architecture.connections],
        notes=list(architecture.notes),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


def serialize_architecture_record(record: ArchitectureRecord) -> dict[str, Any]:
    """Map a stored architecture record into the API response shape."""

    return {
        "id": record.id,
        "circuit_run_id": record.circuit_run_id,
        "assessment_id": record.assessment_id,
        "use_case_id": record.use_case_id,
        "title": record.title,
        "summary": record.summary,
        "components": record.components,
        "connections": record.connections,
        "notes": record.notes,
        "created_at": record.created_at,
    }


def architecture_from_context(context: dict[str, Any]) -> ArchitectureMap:
    """Expose the raw mapper for callers that do not need persistence."""

    return build_architecture_map(context)

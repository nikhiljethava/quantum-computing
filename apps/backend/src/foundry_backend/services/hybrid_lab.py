"""Hybrid Lab service helpers shared by the circuit and architecture routes."""

import dataclasses
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.models.models import (
    AlgorithmContract,
    ArchitectureRecord,
    Assessment,
    CircuitRun,
    JobType,
    UseCase,
)
from foundry_backend.services.result_trust import architecture_result_trust, circuit_result_trust
from foundry_core.circuits import CIRCUIT_REGISTRY
from foundry_core.explainers import build_cirq_code, explain_circuit
from foundry_core.mapping.gcp_mapper import ArchitectureMap, build_architecture_map
from foundry_core.simulation.inspection import (
    NOISE_METADATA_NOTE,
    build_state_preview,
    inspect_circuit,
    run_ideal_histogram,
    run_noisy_histogram,
    run_qsim_histogram,
)


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


def _trust_labels_for_template(template_key: JobType) -> list[str]:
    if template_key in {JobType.coin_flip, JobType.bell_state, JobType.grover}:
        return ["TUTORIAL", "TOY_SIMULATION"]
    if template_key == JobType.routing:
        return ["TOY_SIMULATION", "BENCHMARK_CANDIDATE"]
    if template_key == JobType.chemistry:
        return ["TOY_SIMULATION", "RESEARCH_CANDIDATE", "HARDWARE_GATED"]
    return ["TUTORIAL"]


def build_assessment_preview(template_key: JobType, use_case: UseCase | None) -> dict[str, Any]:
    """Generate a deterministic educational preview for Tutorial Lab outputs."""

    template = TEMPLATE_LIBRARY[template_key]
    first_line = (
        f"{template['label']} is being positioned as a simulator-first educational artifact."
        if use_case is None
        else f"{template['label']} is being framed against the {use_case.title} use case."
    )

    return {
        "score": 0,
        "verdict": "EDUCATION_ONLY",
        "horizon": "SIMULATOR_NOW",
        "confidence": "LOW",
        "trust_labels": _trust_labels_for_template(template_key),
        "explanation": [
            first_line,
            "This tutorial output is not a business recommendation and is not evidence of quantum advantage.",
            "For serious work, run the QALS 3.0 readiness assessment with a declared classical baseline.",
        ],
        "assumptions": list(template["assumptions"]),
        "public_signals": list(template["public_signals"]),
        "next_action": (
            "Continue learning, or open Assess to create an evidence-backed Algorithm Contract."
        ),
        "score_breakdown": {
            "tutorial_only": 1.0,
            "classical_baseline": 0.0,
            "contract_validity": 0.0,
        },
    }


async def create_circuit_run(
    db: AsyncSession,
    template_key: JobType,
    prompt: str | None = None,
    use_case: UseCase | None = None,
    session_id: uuid.UUID | None = None,
    parameter_overrides: dict[str, Any] | None = None,
    repetitions: int | None = None,
    simulator_backend: str = "cirq",
    noise_enabled: bool = False,
    noise_level: float = 0.0,
    include_state_preview: bool = True,
) -> CircuitRun:
    """Run a synchronous toy circuit and persist the result for the Build workspace."""

    if template_key not in TEMPLATE_LIBRARY:
        raise ValueError(f"Unsupported circuit template: {template_key.value}")

    template = TEMPLATE_LIBRARY[template_key]
    factory = CIRCUIT_REGISTRY[template_key.value]
    parameters = {**template["parameters"], **(parameter_overrides or {})}
    if repetitions is not None:
        parameters["repetitions"] = repetitions
    circuit_result = factory(**parameters)
    resolved_repetitions = int(parameters.get("repetitions", repetitions or 1000))

    circuit_metrics = inspect_circuit(circuit_result.circuit)
    requested_backend = simulator_backend if simulator_backend in {"cirq", "qsim"} else "cirq"
    simulator_warning = None
    if requested_backend == "qsim":
        ideal_histogram, simulator_warning = run_qsim_histogram(
            circuit_result.circuit,
            repetitions=resolved_repetitions,
        )
    else:
        ideal_histogram = run_ideal_histogram(
            circuit_result.circuit,
            repetitions=resolved_repetitions,
        )
    actual_backend = "qsim" if requested_backend == "qsim" and simulator_warning is None else "cirq"
    ideal_histogram_entries = _build_histogram_entries(ideal_histogram)

    noisy_histogram_entries = None
    if noise_enabled:
        noisy_histogram_entries = _build_histogram_entries(
            run_noisy_histogram(
                circuit_result.circuit,
                repetitions=resolved_repetitions,
                noise_level=noise_level,
            )
        )

    state_preview = (
        build_state_preview(circuit_result.circuit)
        if include_state_preview
        else {
            "available": False,
            "reason": "State preview was disabled for this run.",
            "top_amplitudes": [],
            "basis_probabilities": [],
        }
    )

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
        histogram=ideal_histogram_entries,
        measurements=circuit_result.measurements,
        run_metadata={
            **circuit_result.metadata,
            "label": template["label"],
            "concept": template["concept"],
            "badge": template["badge"],
            "parameters": parameters,
            "requested_simulator_backend": requested_backend,
            "simulator_backend": actual_backend,
            "simulator_warning": simulator_warning,
            "num_qubits": circuit_metrics["num_qubits"],
            "gate_count": circuit_metrics["gate_count"],
            "one_qubit_gate_count": circuit_metrics["one_qubit_gate_count"],
            "two_qubit_gate_count": circuit_metrics["two_qubit_gate_count"],
            "circuit_depth": circuit_metrics["circuit_depth"],
            "shots": resolved_repetitions,
            "measurement_keys": circuit_metrics["measurement_keys"],
            "ideal_histogram": ideal_histogram_entries,
            "noisy_histogram": noisy_histogram_entries,
            "state_preview": state_preview,
            "noise_enabled": noise_enabled,
            "noise_level": noise_level,
            "noise_note": NOISE_METADATA_NOTE if noise_enabled else None,
            "ideal_vs_noisy": "ideal+noisy" if noise_enabled else "ideal",
            "assumed_noise_model": NOISE_METADATA_NOTE if noise_enabled else None,
            "hardware_readiness_label": "hardware access-controlled",
            "trust_labels": _trust_labels_for_template(template_key),
            "result_caveats": [
                "This is a simulation trust panel, not hardware characterization.",
                "Real hardware results may differ because topology, calibration, and noise are not represented by default.",
                "Toy simulation output does not imply production advantage.",
            ],
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
    metadata = run.run_metadata or {}
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
        "metadata": metadata,
        "assessment_preview": run.assessment_preview,
        "simulator_backend": metadata.get("simulator_backend", "cirq"),
        "simulator_warning": metadata.get("simulator_warning"),
        "num_qubits": metadata.get("num_qubits"),
        "gate_count": metadata.get("gate_count"),
        "one_qubit_gate_count": metadata.get("one_qubit_gate_count"),
        "two_qubit_gate_count": metadata.get("two_qubit_gate_count"),
        "circuit_depth": metadata.get("circuit_depth"),
        "shots": metadata.get("shots"),
        "ideal_vs_noisy": metadata.get("ideal_vs_noisy"),
        "assumed_noise_model": metadata.get("assumed_noise_model"),
        "hardware_readiness_label": metadata.get("hardware_readiness_label", "hardware access-controlled"),
        "trust_labels": metadata.get("trust_labels", _trust_labels_for_template(run.template_key)),
        "result_caveats": metadata.get("result_caveats", []),
        "measurement_keys": metadata.get("measurement_keys", []),
        "ideal_histogram": metadata.get("ideal_histogram", run.histogram),
        "noisy_histogram": metadata.get("noisy_histogram"),
        "state_preview": metadata.get("state_preview"),
        "result_trust": circuit_result_trust(run),
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
    assessment: Assessment | None = None,
    contract: AlgorithmContract | None = None,
    use_case: UseCase | None = None,
) -> ArchitectureRecord:
    """Generate and persist an architecture snapshot."""

    context: dict[str, Any] = {}
    if circuit_run:
        context["job_type"] = circuit_run.template_key.value
        context["job_result"] = {
            "metadata": circuit_run.run_metadata,
            "histogram": circuit_run.histogram,
        }
        if isinstance(circuit_run.assessment_preview, dict):
            score = float(circuit_run.assessment_preview.get("score", 0)) / 100.0
            context["qals_score"] = score
            context["verdict"] = str(circuit_run.assessment_preview.get("verdict", ""))

    if use_case:
        context["industry"] = use_case.industry.value
        context["complexity"] = use_case.complexity_score

    if assessment:
        output = assessment.qals_output or {}
        context.update(
            {
                "qals_score": assessment.qals_score,
                "verdict": output.get("verdict", assessment.verdict),
                "problem_class": output.get("problem_class", assessment.problem_class),
                "contract_type": output.get("recommended_contract_type", "TUTORIAL"),
                "time_horizon": output.get("time_horizon", assessment.time_horizon),
                "confidence": output.get("confidence", assessment.confidence),
                "classical_baseline": output.get("classical_baseline_summary", ""),
                "contract_validity_status": output.get("contract_validity_status", ""),
                "trust_labels": output.get("trust_labels", assessment.trust_labels or []),
                "assumptions": output.get("assumptions", []),
                "missing_evidence": output.get("missing_evidence", []),
                "caveats": output.get("caveats", []),
            }
        )

    if contract:
        context.update(
            {
                "contract_type": contract.contract_type,
                "contract_validity_status": contract.validity_status,
                "classical_baseline": contract.classical_baseline,
                "trust_labels": contract.trust_labels,
                "assumptions": contract.assumptions,
                "caveats": contract.caveats,
            }
        )

    if not context:
        raise ValueError(
            "Architecture generation requires assessment, contract, circuit-run, or use-case context."
        )

    architecture = build_architecture_map(context)
    resolved_assessment_id = assessment.id if assessment else assessment_id
    trust_context = architecture_result_trust(
        assessment=assessment,
        contract=contract,
        circuit_run=circuit_run,
        context=context,
    )
    record = ArchitectureRecord(
        circuit_run_id=circuit_run.id if circuit_run else None,
        assessment_id=resolved_assessment_id,
        contract_id=contract.id if contract else None,
        use_case_id=use_case.id if use_case else None,
        problem_class=architecture.problem_class,
        contract_type=architecture.contract_type,
        title=architecture.title,
        summary=architecture.summary,
        components=[dataclasses.asdict(component) for component in architecture.components],
        connections=[list(connection) for connection in architecture.connections],
        notes=list(architecture.notes),
        trust_context=trust_context,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


def serialize_architecture_record(record: ArchitectureRecord) -> dict[str, Any]:
    """Map a stored architecture record into the API response shape."""

    trust_context = getattr(record, "trust_context", {}) or {}
    result_trust = (
        {
            **trust_context,
            "provenance": [
                *list(trust_context.get("provenance", [])),
                f"Architecture map {record.id}",
            ],
            "generated_at": record.created_at,
        }
        if trust_context
        else architecture_result_trust(
            architecture_id=record.id,
            created_at=record.created_at,
            context={},
        )
    )
    return {
        "id": record.id,
        "circuit_run_id": record.circuit_run_id,
        "assessment_id": record.assessment_id,
        "contract_id": getattr(record, "contract_id", None),
        "use_case_id": record.use_case_id,
        "problem_class": getattr(record, "problem_class", None) or "UNKNOWN",
        "contract_type": getattr(record, "contract_type", None) or "TUTORIAL",
        "time_horizon": trust_context.get("time_horizon", "SIMULATOR_NOW"),
        "assumptions": trust_context.get("assumptions", []),
        "trust_labels": trust_context.get("trust_labels", []),
        "title": record.title,
        "summary": record.summary,
        "components": record.components,
        "connections": record.connections,
        "notes": record.notes,
        "result_trust": result_trust,
        "created_at": record.created_at,
    }


def architecture_from_context(context: dict[str, Any]) -> ArchitectureMap:
    """Expose the raw mapper for callers that do not need persistence."""

    return build_architecture_map(context)

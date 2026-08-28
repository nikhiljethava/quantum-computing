"""Context-aware Quantum Foundry guide tutor."""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from foundry_backend.core.config import settings
from foundry_backend.models.models import ArchitectureRecord, CircuitRun, UseCase
from foundry_backend.schemas.schemas import GuideAskRequest

HARDWARE_ACCESS_GUARDRAIL = (
    "Google quantum hardware access is restricted to approved groups. "
    "Quantum Foundry is simulation-first unless approved access is configured."
)

GOOGLE_SOURCES = {
    "cirq": {
        "title": "Cirq overview",
        "url": "https://quantumai.google/cirq",
        "source_type": "google_doc",
    },
    "qsim": {
        "title": "qsim overview",
        "url": "https://quantumai.google/qsim",
        "source_type": "google_doc",
    },
    "openfermion": {
        "title": "OpenFermion overview",
        "url": "https://quantumai.google/openfermion",
        "source_type": "google_doc",
    },
    "hardware": {
        "title": HARDWARE_ACCESS_GUARDRAIL,
        "url": "https://quantumai.google/cirq/google/access",
        "source_type": "google_doc",
    },
    "cloud_run": {
        "title": "Cloud Run documentation",
        "url": "https://cloud.google.com/run/docs",
        "source_type": "google_cloud_doc",
    },
    "vertex": {
        "title": "Vertex AI Gemini documentation",
        "url": "https://cloud.google.com/vertex-ai/generative-ai/docs",
        "source_type": "google_cloud_doc",
    },
}

LESSON_SNIPPETS = {
    "what-is-a-qubit": "A qubit is a two-level quantum system represented by amplitudes for |0> and |1>.",
    "superposition": "Superposition means amplitudes can describe multiple basis states before measurement.",
    "measurement": "Measurement samples a classical outcome from a quantum state's probability distribution.",
    "entanglement": "Entanglement creates correlations that cannot be explained as independent classical bits.",
    "grover-search": "Grover search illustrates amplitude amplification on a marked state in a toy search space.",
    "qaoa-intuition": "QAOA alternates cost and mixing operations to explore combinatorial optimization candidates.",
    "simulation-first-architecture": "Quantum Foundry maps toy circuits to Cloud Run, workers, storage, and exports first.",
}


async def build_context_bundle(db: AsyncSession, request: GuideAskRequest) -> dict[str, Any]:
    """Collect local app context for a guide answer."""

    lesson = LESSON_SNIPPETS.get(request.lesson_slug or "")
    use_case = await db.get(UseCase, request.use_case_id) if request.use_case_id else None
    circuit_run = await db.get(CircuitRun, request.circuit_run_id) if request.circuit_run_id else None
    architecture = (
        await db.get(ArchitectureRecord, request.architecture_id)
        if request.architecture_id
        else None
    )
    return {
        "lesson": lesson,
        "use_case": use_case,
        "circuit_run": circuit_run,
        "architecture": architecture,
    }


def _source(title: str, source_type: str, url: str | None = None) -> dict[str, str | None]:
    return {"title": title, "url": url, "source_type": source_type}


def _action(label: str, href: str, action_type: str) -> dict[str, str]:
    return {"label": label, "href": href, "action_type": action_type}


async def ask_guide(db: AsyncSession, request: GuideAskRequest) -> dict[str, Any]:
    """Answer with deterministic local context; Vertex integration is config-gated."""

    context = await build_context_bundle(db, request)
    sources: list[dict[str, Any]] = [GOOGLE_SOURCES["cirq"], GOOGLE_SOURCES["cloud_run"]]
    actions: list[dict[str, str]] = []
    answer_parts = [
        "I am the Quantum Foundry Guide. I will keep this simulation-first, "
        "Cirq-based, and honest about what can be run today."
    ]

    lesson = context["lesson"]
    if lesson:
        answer_parts.append(f"Lesson context: {lesson}")
        sources.append(_source(f"Lesson: {request.lesson_slug}", "app_lesson", None))
        actions.append(_action("Run the related circuit in Build", f"/build?lesson={request.lesson_slug}", "build"))

    use_case = context["use_case"]
    if use_case:
        blueprint = use_case.blueprint or {}
        maturity = blueprint.get("maturity_label", use_case.horizon)
        answer_parts.append(
            f"Use-case context: {use_case.title} is best treated as `{maturity}`. "
            f"The classical baseline is: {blueprint.get('classical_baseline', use_case.description)}"
        )
        answer_parts.append(
            f"The workflow can use these technologies descriptively: {', '.join(blueprint.get('google_stack', ['Cirq', 'qsim', 'Cloud Run', 'Cloud Storage']))}."
        )
        if use_case.evidence_items:
            answer_parts.append(f"Evidence signal: {use_case.evidence_items[0].get('claim', '')}")
        sources.append(_source(use_case.title, "app_use_case", None))
        actions.append(_action("Assess this use case", f"/assess?use_case_id={use_case.id}", "assess"))
        slug = use_case.slug or str(use_case.id)
        actions.append(_action("Open the use-case page", f"/use-cases/{slug}", "use_case"))

    circuit_run = context["circuit_run"]
    if circuit_run:
        metadata = circuit_run.run_metadata or {}
        answer_parts.append(
            f"Circuit context: this is a {circuit_run.template_key.value} Cirq run. "
            f"It used the {metadata.get('simulator_backend', 'cirq')} simulator path and "
            f"has {metadata.get('num_qubits', 'unknown')} qubits, "
            f"{metadata.get('gate_count', 'unknown')} gates, and depth {metadata.get('circuit_depth', 'unknown')}."
        )
        answer_parts.append(circuit_run.explanation)
        actions.append(_action("Export a Colab notebook", "/build#exports", "build"))

    architecture = context["architecture"]
    if architecture:
        answer_parts.append(f"Architecture context: {architecture.summary}")
        actions.append(_action("Open Map", "/map", "map"))

    question_lower = request.question.lower()
    if any(term in question_lower for term in ["hardware", "qpu", "quantum computer", "processor"]):
        sources.append(GOOGLE_SOURCES["hardware"])
        answer_parts.append(HARDWARE_ACCESS_GUARDRAIL)

    if "qsim" in question_lower:
        sources.append(GOOGLE_SOURCES["qsim"])
    if "fermion" in question_lower or "chemistry" in question_lower:
        sources.append(GOOGLE_SOURCES["openfermion"])
    if "gemini" in question_lower or settings.guide_provider == "vertex":
        sources.append(GOOGLE_SOURCES["vertex"])

    if not actions:
        actions.append(_action("Open the Algorithm Experiment Workspace", "/build", "build"))
        actions.append(_action("Explore flagship use cases", "/explore", "use_case"))

    safety_notes = [
        "No quantum advantage is implied by this response.",
        HARDWARE_ACCESS_GUARDRAIL,
    ]
    if settings.guide_provider == "vertex":
        safety_notes.append(
            "Vertex AI Gemini/RAG mode is configuration-gated; local deterministic context remains the fallback."
        )

    return {
        "answer": "\n\n".join(part for part in answer_parts if part),
        "cited_sources": sources,
        "recommended_next_actions": actions[:4],
        "safety_notes": safety_notes,
    }

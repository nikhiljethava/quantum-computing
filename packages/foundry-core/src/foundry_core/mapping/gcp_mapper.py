"""
Google Cloud hybrid architecture mapper.

Generates a structured Google Cloud component graph based on job/assessment context.
This is a rule-based mapper, NOT an ML model.
The output is consumed by the Architecture Mapper frontend page to render
an interactive diagram.

TODO(gcp-deploy): replace static component definitions with live Google Cloud resource metadata.
"""

import dataclasses
from typing import Any

HARDWARE_ACCESS_NOTE = (
    "Google quantum hardware access is restricted to approved groups. "
    "Quantum Foundry is simulation-first unless approved access is configured."
)


# ---------------------------------------------------------------------------
# Result types (defined here to avoid circular imports with backend)
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class GcpComponent:
    id: str
    name: str
    service: str
    description: str
    # TODO(gcp-deploy): add icon_url only if it cannot imply product affiliation.


@dataclasses.dataclass
class ArchitectureMap:
    title: str
    summary: str
    components: list[GcpComponent]
    connections: list[tuple[str, str]]  # (source_id, target_id)
    notes: list[str]


# ---------------------------------------------------------------------------
# Static component library
# ---------------------------------------------------------------------------

_COMPONENTS: dict[str, GcpComponent] = {
    "cloud_run": GcpComponent(
        id="cloud_run",
        name="Cloud Run",
        service="Cloud Run",
        description="Serverless container host for the app and FastAPI assessment API.",
    ),
    "bigquery": GcpComponent(
        id="bigquery",
        name="BigQuery",
        service="BigQuery",
        description="Warehouse for structured benchmark data and baseline metrics.",
    ),
    "cloud_sql": GcpComponent(
        id="cloud_sql",
        name="Cloud SQL (PostgreSQL)",
        service="Cloud SQL",
        description="Managed PostgreSQL instance for assessments, bundles, jobs, and state.",
    ),
    "cloud_tasks": GcpComponent(
        id="cloud_tasks",
        name="Cloud Tasks",
        service="Cloud Tasks",
        description="Managed async task queue replacing the local DB-backed worker queue.",
    ),
    "cloud_storage": GcpComponent(
        id="cloud_storage",
        name="Cloud Storage",
        service="Cloud Storage",
        description="Object store for evidence files, simulation artifacts, and memo exports.",
    ),
    "classical_preprocessing": GcpComponent(
        id="classical_preprocessing",
        name="Classical Preprocessing",
        service="Cloud Run",
        description="Validates inputs, attaches the declared classical baseline, and prepares the benchmark instance.",
    ),
    "classical_postprocessing": GcpComponent(
        id="classical_postprocessing",
        name="Classical Post-Processing",
        service="Cloud Run",
        description="Compares simulator output with the baseline and packages caveats, evidence, and next actions.",
    ),
    "artifact_export": GcpComponent(
        id="artifact_export",
        name="Algorithm Brief Export",
        service="Cloud Storage",
        description="Stores the Quantum Algorithm Brief, PQC Migration Memo, and experiment bundle artifacts.",
    ),
    "vertex_ai": GcpComponent(
        id="vertex_ai",
        name="Vertex AI",
        service="Vertex AI",
        description="Managed ML platform for VQE optimization loops and classical co-processors.",
    ),
    "quantum_computing_service": GcpComponent(
        id="quantum_computing_service",
        name="Google Quantum Computing Service",
        service="Quantum Computing Service",
        description=HARDWARE_ACCESS_NOTE,
    ),
    "hardware_gate": GcpComponent(
        id="hardware_gate",
        name="Optional Hardware Gate",
        service="Access Control",
        description="Hardware access-controlled branch; not part of the default simulator-first workflow.",
    ),
    "circuit_runner": GcpComponent(
        id="circuit_runner",
        name="Quantum Kernel / Simulation Worker",
        service="Cloud Run Jobs",
        description=(
            "Python worker that executes Cirq/OpenFermion/qsim simulation or a clearly labeled stub."
        ),
    ),
    "frontend": GcpComponent(
        id="frontend",
        name="Next.js Frontend",
        service="Cloud Run / Firebase Hosting",
        description="The Quantum Foundry web application.",
    ),
    "api_gateway": GcpComponent(
        id="api_gateway",
        name="API Gateway",
        service="Cloud Endpoints / API Gateway",
        description="Manages API versioning, authentication, and rate limiting.",
    ),
}

BASE_CONNECTIONS: list[tuple[str, str]] = [
    ("frontend", "api_gateway"),
    ("api_gateway", "cloud_run"),
    ("cloud_run", "cloud_sql"),
    ("cloud_storage", "classical_preprocessing"),
    ("bigquery", "classical_preprocessing"),
    ("classical_preprocessing", "cloud_tasks"),
    ("cloud_run", "cloud_tasks"),
    ("cloud_tasks", "circuit_runner"),
    ("circuit_runner", "classical_postprocessing"),
    ("classical_postprocessing", "artifact_export"),
    ("hardware_gate", "quantum_computing_service"),
]

BASE_NOTES: list[str] = [
    "TODO(gcp-deploy): Set STORAGE_BACKEND=gcs and GCS_BUCKET env var on Cloud Run.",
    "TODO(gcp-deploy): Set JOB_BACKEND=cloud_tasks and configure Cloud Tasks queue name.",
    HARDWARE_ACCESS_NOTE,
    "Simulation runs entirely on classical hardware (qsim or Cirq simulator) in this architecture.",
    "The map keeps the classical/quantum split visible: data, preprocessing, simulation worker, post-processing, storage, and export/memo.",
]


def build_architecture_map(context: dict[str, Any]) -> ArchitectureMap:
    """
    Build an ArchitectureMap from execution context.

    Args:
        context: Dict with optional keys: job_type, job_result, qals_score,
                 verdict, industry, complexity.

    Returns:
        ArchitectureMap describing the Google Cloud deployment topology.
    """
    job_type: str = context.get("job_type", "")
    qals_score: float = context.get("qals_score", 0.0)
    verdict: str = context.get("verdict", "")
    industry: str = context.get("industry", "")

    # Always include the core services
    component_ids = {
        "frontend", "api_gateway", "cloud_run", "cloud_sql", "bigquery",
        "cloud_tasks", "circuit_runner", "cloud_storage", "classical_preprocessing",
        "classical_postprocessing", "artifact_export", "hardware_gate",
    }
    connections = list(BASE_CONNECTIONS)
    notes = list(BASE_NOTES)

    # Add Vertex AI for VQE / optimization workloads
    if job_type in ("chemistry", "routing") or qals_score >= 0.55:
        component_ids.add("vertex_ai")
        connections.append(("circuit_runner", "vertex_ai"))
        notes.append("Vertex AI added for classical co-processing and VQE optimization loops.")

    # Add the approved-access hardware service only for strong-fit scenarios.
    # The access-control gate itself is always shown so users see the optional branch.
    if qals_score >= 0.75 or verdict == "Strong Quantum Fit":
        component_ids.add("quantum_computing_service")
        connections.append(("circuit_runner", "quantum_computing_service"))
        notes.append(HARDWARE_ACCESS_NOTE)

    components = [_COMPONENTS[cid] for cid in component_ids if cid in _COMPONENTS]

    # Derive a meaningful title
    if job_type:
        title = f"Google Cloud Hybrid Architecture — {job_type.replace('_', ' ').title()} Workload"
    elif industry:
        title = f"Google Cloud Hybrid Architecture — {industry.title()} Use Case"
    else:
        title = "Google Cloud Hybrid Architecture — General Quantum Foundry Deployment"

    hardware_summary = (
        HARDWARE_ACCESS_NOTE
        if "quantum_computing_service" in component_ids
        else HARDWARE_ACCESS_NOTE
    )
    summary = (
        f"A Cloud Run–hosted FastAPI backend offloads circuit simulations to an async "
        f"Cloud Run Job worker via Cloud Tasks. Data lands in Cloud Storage or BigQuery, "
        f"classical preprocessing prepares the benchmark, the worker runs the quantum kernel "
        f"or simulation stub, and classical post-processing exports the memo. "
        f"{'Vertex AI handles classical co-processing. ' if 'vertex_ai' in component_ids else ''}"
        f"{hardware_summary}"
    )

    return ArchitectureMap(
        title=title,
        summary=summary,
        components=components,
        connections=connections,
        notes=notes,
    )

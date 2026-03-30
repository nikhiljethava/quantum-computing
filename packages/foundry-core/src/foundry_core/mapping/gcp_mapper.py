"""
GCP hybrid architecture mapper.

Generates a structured GCP component graph based on job/assessment context.
This is a rule-based mapper, NOT an ML model.
The output is consumed by the Architecture Mapper frontend page to render
an interactive diagram.

TODO(gcp-deploy): replace static component definitions with live GCP resource metadata.
"""

import dataclasses
from typing import Any


# ---------------------------------------------------------------------------
# Result types (defined here to avoid circular imports with backend)
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class GcpComponent:
    id: str
    name: str
    service: str
    description: str
    # TODO(gcp-deploy): add icon_url pointing to GCP icon CDN


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
        description="Serverless container host for the FastAPI backend.",
    ),
    "cloud_sql": GcpComponent(
        id="cloud_sql",
        name="Cloud SQL (PostgreSQL)",
        service="Cloud SQL",
        description="Managed PostgreSQL instance for persistent state.",
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
        description="Object store for simulation artifacts and circuit exports.",
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
        description="Access to Google's superconducting quantum processors (behind config flag).",
    ),
    "circuit_runner": GcpComponent(
        id="circuit_runner",
        name="Circuit Runner (Worker)",
        service="Cloud Run Jobs",
        description="Async worker container that executes Cirq simulations or dispatches to QCS.",
    ),
    "frontend": GcpComponent(
        id="frontend",
        name="Next.js Frontend",
        service="Cloud Run / Firebase Hosting",
        description="The GCP Quantum Foundry web application.",
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
    ("cloud_run", "cloud_tasks"),
    ("cloud_tasks", "circuit_runner"),
    ("circuit_runner", "cloud_storage"),
]

BASE_NOTES: list[str] = [
    "TODO(gcp-deploy): Set STORAGE_BACKEND=gcs and GCS_BUCKET env var on Cloud Run.",
    "TODO(gcp-deploy): Set JOB_BACKEND=cloud_tasks and configure Cloud Tasks queue name.",
    "TODO(gcp-deploy): Enable QCS API and set hardware config flags before real-device runs.",
    "Simulation runs entirely on classical hardware (qsim or Cirq simulator) in this architecture.",
]


def build_architecture_map(context: dict[str, Any]) -> ArchitectureMap:
    """
    Build an ArchitectureMap from execution context.

    Args:
        context: Dict with optional keys: job_type, job_result, qals_score,
                 verdict, industry, complexity.

    Returns:
        ArchitectureMap describing the GCP deployment topology.
    """
    job_type: str = context.get("job_type", "")
    qals_score: float = context.get("qals_score", 0.0)
    verdict: str = context.get("verdict", "")
    industry: str = context.get("industry", "")

    # Always include the core services
    component_ids = {
        "frontend", "api_gateway", "cloud_run", "cloud_sql",
        "cloud_tasks", "circuit_runner", "cloud_storage",
    }
    connections = list(BASE_CONNECTIONS)
    notes = list(BASE_NOTES)

    # Add Vertex AI for VQE / optimization workloads
    if job_type in ("chemistry", "routing") or qals_score >= 0.55:
        component_ids.add("vertex_ai")
        connections.append(("circuit_runner", "vertex_ai"))
        notes.append("Vertex AI added for classical co-processing and VQE optimization loops.")

    # Add QCS for strong quantum fit (behind config flag)
    if qals_score >= 0.75 or verdict == "Strong Quantum Fit":
        component_ids.add("quantum_computing_service")
        connections.append(("circuit_runner", "quantum_computing_service"))
        notes.append(
            "Google Quantum Computing Service (QCS) added — requires ENABLE_REAL_HARDWARE=true config flag."
        )

    components = [_COMPONENTS[cid] for cid in component_ids if cid in _COMPONENTS]

    # Derive a meaningful title
    if job_type:
        title = f"GCP Hybrid Architecture — {job_type.replace('_', ' ').title()} Workload"
    elif industry:
        title = f"GCP Hybrid Architecture — {industry.title()} Use Case"
    else:
        title = "GCP Hybrid Architecture — General Quantum Foundry Deployment"

    summary = (
        f"A Cloud Run–hosted FastAPI backend offloads circuit simulations to an async "
        f"Cloud Run Job worker via Cloud Tasks. Artifacts are stored in Cloud Storage. "
        f"{'Vertex AI handles classical co-processing. ' if 'vertex_ai' in component_ids else ''}"
        f"{'Real quantum hardware access via QCS is gated by a config flag.' if 'quantum_computing_service' in component_ids else 'Real hardware is not included in this configuration.'}"
    )

    return ArchitectureMap(
        title=title,
        summary=summary,
        components=components,
        connections=connections,
        notes=notes,
    )

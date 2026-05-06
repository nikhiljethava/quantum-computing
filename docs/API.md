# API

Quantum Foundry is an independent personal project and is not an official Google product.

Quantum Foundry is licensed under Apache-2.0. See the root [LICENSE](../LICENSE) file.

The FastAPI backend serves product APIs under `/api/v1`. Local API docs are available at `/docs` when the backend is running.

## Status

- **Implemented**: Health, projects, sessions, use cases, assessments, circuits, architectures, artifacts, jobs, guide, and usage analytics.
- **Partially implemented**: Worker dispatch depends on local or Cloud Tasks configuration. Guide behavior is local by default and Vertex AI/Gemini-gated.
- **Planned**: Production auth and stronger API versioning.

## Health

```http
GET /health
GET /api/v1/health
```

Returns a lightweight service status and environment string.

## Projects

```http
GET /api/v1/projects
POST /api/v1/projects
PATCH /api/v1/projects/{project_id}
```

Projects group saved workspace sessions.

Example create request:

```json
{
  "name": "Battery materials exploration",
  "description": "Learning path, assessment, and Cirq Lab runs.",
  "status": "active"
}
```

## Sessions

```http
GET /api/v1/sessions
POST /api/v1/sessions
GET /api/v1/sessions/{session_id}
PATCH /api/v1/sessions/{session_id}
```

Sessions preserve Build workspace state such as selected starter, project, selected use case, and latest circuit run.

## Use Cases

```http
GET /api/v1/use-cases
GET /api/v1/use-cases/{use_case_id}
GET /api/v1/use-cases/slug/{slug}
```

The list endpoint supports filters such as `featured_only=true`, `industry`, `limit`, and `offset` depending on route parameters.

Use-case records include stable fields such as title, industry, description, horizon, complexity score, featured flags, blueprint, and evidence items.

## Assessments

```http
POST /api/v1/assessments
```

Runs the deterministic QALS-lite readiness heuristic and stores the result.

Example request:

```json
{
  "use_case_id": "00000000-0000-0000-0000-000000000000",
  "user_inputs": {
    "problem_size": "large",
    "data_structure": "structured",
    "classical_hardness": "hard",
    "timeline": "1-2 years"
  }
}
```

The response includes recommendation fields plus backward-compatible `qals_score`, `verdict`, and `score_breakdown`.

## Circuits

```http
GET /api/v1/circuits/templates
POST /api/v1/circuits/run
GET /api/v1/circuits/runs/{run_id}
POST /api/v1/circuits/gemini-update
```

`POST /api/v1/circuits/run` generates and simulates a starter Cirq circuit.

Example request:

```json
{
  "template_key": "bell_state",
  "repetitions": 1000,
  "simulator_backend": "cirq",
  "noise_enabled": false,
  "include_state_preview": true
}
```

The response can include Cirq code, circuit diagram, histogram, metrics, state preview, educational explanation, and assessment preview.

The Gemini update route uses a user-supplied API key ephemerally for draft assistance. It is not required for the core product flow.

## Architectures

```http
POST /api/v1/architectures
```

Generates a rule-based Google Cloud architecture map from a circuit run, job, assessment, or use case context.

At least one context identifier is required.

## Artifacts

```http
POST /api/v1/artifacts
GET /api/v1/artifacts
GET /api/v1/artifacts/{artifact_id}
GET /api/v1/artifacts/{artifact_id}/download
```

Supported export types include Cirq code, Colab notebook, assessment JSON, architecture JSON, session summary, and worker job output. Artifact storage can be local or Cloud Storage depending on configuration.

## Jobs

```http
POST /api/v1/jobs
GET /api/v1/jobs
GET /api/v1/jobs/{job_id}
```

Jobs support worker-backed simulations and export generation. Job dispatch uses the configured job backend.

Example create request:

```json
{
  "job_type": "bell_state",
  "payload": {
    "repetitions": 1000
  }
}
```

## Guide

```http
POST /api/v1/guide/ask
```

Returns a context-aware guide answer, cited sources, recommended next actions, and safety notes. Local mode is deterministic. Vertex AI/Gemini mode is configuration-gated.

## Usage Analytics

```http
POST /api/v1/usage
GET /api/v1/usage?page_path=/jobs
```

Usage analytics count recent visits and unique visitors. City values are only populated when a trusted proxy, CDN, or load balancer forwards a city header. Direct Cloud Run traffic usually records location as unavailable.

## Error Shape

FastAPI validation errors use the default validation response. Application errors generally return JSON with a `detail` field:

```json
{
  "detail": "UseCase 00000000-0000-0000-0000-000000000000 not found."
}
```

## Auth Assumptions

Local development and the current public prototype do not require end-user auth. Future internal or external preview auth should be added through an explicit adapter and documented before use.

## Hardware Access

Google quantum hardware access is restricted to approved groups. Quantum Foundry is simulation-first unless approved access is configured.

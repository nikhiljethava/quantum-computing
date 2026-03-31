# GCP Quantum Foundry API Surface

Base URL in local development: `http://localhost:8000/api/v1`

## Health

- `GET /health`
  Lightweight API health check.

## Projects

- `GET /projects`
  List saved projects.
- `POST /projects`
  Create a project container for saved sessions.

## Sessions

- `GET /sessions`
  List saved sessions, optionally filtered by project.
- `POST /sessions`
  Create a saved workspace session.
- `GET /sessions/{session_id}`
  Fetch a saved session with latest run, architecture, and artifacts.
- `PATCH /sessions/{session_id}`
  Update session title, project linkage, or selected workspace state.

## Use cases

- `GET /use-cases`
  List seeded industry use cases.
- `GET /use-cases/{use_case_id}`
  Fetch a single seeded use case.

## Assessments

- `POST /assessments`
  Run deterministic QALS-lite scoring for a use case and input set.

## Circuits

- `GET /circuits/templates`
  List starter lanes shown in the Hybrid Lab.
- `POST /circuits/run`
  Generate and synchronously simulate a starter circuit.
- `GET /circuits/runs/{run_id}`
  Fetch a persisted circuit run.

## Architectures

- `POST /architectures/generate`
  Generate a persisted hybrid GCP architecture from a circuit run and use case.
- `GET /architectures/{architecture_id}`
  Fetch a stored architecture record.

## Artifacts

- `POST /artifacts`
  Create an export artifact such as Cirq code, assessment JSON, architecture JSON, or session summary.
- `GET /artifacts`
  List export artifacts.
- `GET /artifacts/{artifact_id}`
  Fetch artifact metadata.
- `GET /artifacts/{artifact_id}/download`
  Download a generated artifact.

## Jobs

- `POST /jobs`
  Queue a worker-backed simulation or export job.
- `GET /jobs`
  List recent jobs with optional status filtering.
- `GET /jobs/{job_id}`
  Poll a single job until it completes.

## Notes

- The Build workspace uses both synchronous and worker-backed paths.
- Simulation is the default execution mode in v1.
- Real hardware is not enabled by default.
- The authoritative live reference is the OpenAPI UI at `http://localhost:8000/docs`.

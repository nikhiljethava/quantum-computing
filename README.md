# GCP Quantum Foundry

GCP Quantum Foundry is a production-minded, local-first monorepo for a
visual-first interactive quantum launchpad. The product is organized around one
guided journey:

`Learn -> Explore -> Assess -> Build -> Map`

The app now includes a complete local demo experience with:

- a concept-first Learn surface
- an industry atlas with live use-case detail and assessment entry points
- a live QALS-lite Assess workspace
- a Build / Hybrid Lab that generates and simulates toy circuits
- a live architecture mapper and downloadable artifacts
- saved projects, saved sessions, and worker job activity

## Product guardrails

- Simulation first. No real Google quantum hardware is enabled by default.
- QALS-lite is a heuristic readiness aid, not a claim of quantum advantage.
- The visible product should feel like one guide plus one visual workspace,
  not a generic chatbot.
- MCP is optional and should remain an adapter layer for retrieval and
  enterprise connectors, not a dependency for core product logic.

## Repository layout

```text
.
├── apps
│   ├── backend
│   │   ├── alembic
│   │   ├── src/foundry_backend
│   │   └── tests
│   ├── frontend
│   │   └── src
│   └── worker
│       ├── src/foundry_worker
│       └── tests
├── docs
│   ├── api.md
│   ├── architecture.md
│   └── demo-script.md
├── packages
│   └── foundry-core
│       ├── src/foundry_core
│       └── tests
├── .env.example
├── cloudbuild.yaml
├── docker-compose.yml
└── Makefile
```

## What you can preview

After startup, the strongest routes are:

- `http://localhost:3000/` - Learn
- `http://localhost:3000/explore` - Industry Atlas
- `http://localhost:3000/assess` - live QALS-lite workspace
- `http://localhost:3000/build` - Hybrid Lab
- `http://localhost:3000/map` - live architecture mapper
- `http://localhost:3000/projects` - saved projects
- `http://localhost:3000/sessions` - saved sessions
- `http://localhost:3000/jobs` - worker activity
- `http://localhost:8000/docs` - FastAPI docs

## Local quick start

1. Copy the environment template.

```bash
cp .env.example .env
```

2. Start the full stack.

```bash
make up
```

3. Run database migrations in a separate terminal after the containers are up.

```bash
make migrate
```

4. Open the applications.

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

## Manual development

### Python services

```bash
python3.11 -m venv .venv
source .venv/bin/activate
make install-python
```

### Frontend

```bash
make install-frontend
make dev-frontend
```

### Backend

```bash
source .venv/bin/activate
make dev-backend
```

### Worker

```bash
source .venv/bin/activate
make dev-worker
```

## Common commands

- `make up`: start Postgres, backend, worker, and frontend with Docker Compose
- `make down`: stop the local stack
- `make logs`: tail service logs
- `make migrate`: run Alembic migrations
- `make test`: run Python test suites
- `make test-backend`: run backend tests
- `make test-worker`: run worker tests
- `cd apps/frontend && npm run lint`: run frontend lint
- `cd apps/frontend && npm run build -- --webpack`: verify production build

## Product surfaces

- Learn
  Concept-first landing page with approachable quantum explanations and direct
  paths into Explore and Build.
- Explore
  Seeded industry atlas with filters, detail drawer, and direct handoff into
  Assess and Build.
- Assess
  Live QALS-lite workflow backed by the API with transparent assumptions and
  simulation-first language.
- Build
  Prompt-to-circuit workspace with live circuit runs, worker-backed runs,
  artifacts, and workspace persistence.
- Map
  Live architecture generation tied to real circuit runs plus downloadable JSON
  export.
- Projects / Sessions / Jobs
  Persistent workspace history, saved demo narratives, and worker activity
  tracking.

## Current architecture

- `apps/frontend`
  Next.js App Router interface for the full Learn -> Explore -> Assess ->
  Build -> Map flow.
- `apps/backend`
  FastAPI service for persistence, assessments, circuits, architectures,
  artifacts, jobs, projects, and sessions.
- `apps/worker`
  Python worker that polls queued jobs and produces persisted outputs for async
  runs and exports.
- `packages/foundry-core`
  Shared deterministic logic for circuit templates, simulation, explainers,
  readiness scoring, architecture mapping, storage, and job abstractions.

## Verification

- Backend and worker tests run under Python 3.11.
- Frontend verification uses `eslint` and a production `next build`.
- The repo is designed to run locally first, then move to Cloud Run with Cloud
  SQL, Cloud Storage, and Cloud Tasks adapters later.

## Cloud Build launch path

The repo now includes [cloudbuild.yaml](/Users/nikhiljethava/Documents/Codex/quantum-computing/cloudbuild.yaml)
for a first GCP launch path:

- `apps/frontend` -> Cloud Run frontend service
- `apps/backend` -> Cloud Run API service
- `apps/worker` -> Cloud Run task worker service
- PostgreSQL -> Cloud SQL
- artifact exports -> Cloud Storage
- async jobs -> Cloud Tasks -> worker HTTP endpoint

See [docs/gcp-cloud-build.md](/Users/nikhiljethava/Documents/Codex/quantum-computing/docs/gcp-cloud-build.md)
for prerequisites, required secrets, service-account roles, and the exact
`gcloud builds submit` command.

## GCP and MCP path

- Cloud Run is the first hosted target for frontend, backend, and worker.
- Cloud SQL is the first persistence target.
- Cloud Storage and Cloud Tasks are now first-class adapter-backed deploy paths.
- MCP is optional and reserved for retrieval and enterprise connectors, not
  core product logic.

## Demo flow

See [docs/demo-script.md](/Users/nikhiljethava/Documents/Codex/quantum-computing/docs/demo-script.md)
for the recommended end-to-end walkthrough and
[docs/api.md](/Users/nikhiljethava/Documents/Codex/quantum-computing/docs/api.md)
for the current API surface.

# GCP Quantum Foundry

GCP Quantum Foundry is a production-minded, local-first monorepo for a
visual-first interactive quantum launchpad. The product is designed around a
single guided journey:

`Learn -> Explore -> Assess -> Build -> Map`

The current repository focus is Phase 1 scaffolding and developer experience.
It already includes a Next.js frontend shell, a FastAPI backend shell, a
separate worker process, Docker-based local infrastructure, and a shared Python
package for quantum/domain logic.

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
│   └── architecture.md
├── packages
│   └── foundry-core
│       ├── src/foundry_core
│       └── tests
├── .env.example
├── docker-compose.yml
└── Makefile
```

## Local quick start

1. Copy the environment template.

```bash
cp .env.example .env
```

2. Start the full stack.

```bash
make up
```

3. Open the applications.

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

4. Run database migrations in a separate terminal after the containers are up.

```bash
make migrate
```

## Manual development

### Python services

```bash
python3 -m venv .venv
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

## Phase 1 status

This scaffold intentionally stops short of the full product experience. Phase 1
covers:

- repo structure and local runtime wiring
- environment variable handling
- backend health endpoints
- shared package boundaries for later quantum logic
- architecture notes and future GCP migration hooks

The next major phase is backend domain implementation:
projects, sessions, use cases, assessments, circuits, architecture maps,
artifacts, and jobs.

## GCP and MCP path

- Cloud Run is the first hosted target for the frontend, backend, and worker.
- Cloud SQL is the first target for PostgreSQL persistence.
- Cloud Storage and Cloud Tasks are deferred behind storage and queue
  abstractions.
- MCP can be added later for retrieval and enterprise integrations, but the
  local corpus and deterministic product logic remain the default path.

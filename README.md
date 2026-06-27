# Quantum Foundry

> **Independent personal project — not an official Google product.**
>
> This project is not affiliated with, sponsored by, endorsed by, or maintained by Google LLC. It uses publicly available Google Cloud and Google Quantum AI ecosystem technologies where applicable.

Quantum Foundry is a personal learning and prototyping app for turning enterprise quantum ideas into Algorithm Contracts, attaching every serious build artifact to an evidence-backed assessment, simulating Cirq-based toy experiments, and mapping hybrid quantum-classical workflows to Google Cloud architecture patterns.

Recommended GitHub repository description:

> Independent personal project for learning quantum computing with Cirq-based simulations and Google Cloud architecture patterns. Not an official Google product.

## What This Project Is

Quantum Foundry is an educational product scaffold that helps users:

- Learn quantum concepts with visual explanations.
- Explore industry use cases with business context and evidence.
- Assess readiness with QALS 3.0, a transparent Algorithm Contract rule/evidence engine.
- Build Algorithm Experiment Bundles only after assessment and contract creation, while keeping tutorial circuits labeled tutorial-only.
- Compare ideal and educational-noise simulation results.
- Map hybrid workflows to Google Cloud architecture patterns.
- Export educational artifacts such as Cirq code, JSON summaries, and Colab notebooks.

## What This Project Is Not

- It is not an official Google product.
- It is not endorsed, sponsored, reviewed, or maintained by Google.
- It does not provide public access to Google quantum hardware.
- It does not claim quantum advantage.
- It is not a production quantum-computing service.
- It is a personal educational and prototyping project.

## Why This Project Exists

Quantum computing can feel inaccessible because product teams often see either dense research material or overconfident business claims. Quantum Foundry is meant to sit in the middle: an approachable app that teaches concepts, encourages careful assessment, and shows how a simulator-first workflow could be prototyped with cloud services.

## Product Walkthrough

The intended journey is:

1. **Learn** quantum concepts through structured lessons.
2. **Explore** featured industry use cases before starting a blank workload form.
3. **Assess** a use case with QALS 3.0, a deterministic Algorithm Contract assessment.
4. **Build** an Algorithm Experiment Bundle with hypothesis, classical baseline, algorithm candidate, toy implementation, result trust metrics, limitations, next evidence, GCP map, and exports.
5. **Map** the decision, experiment, and Google Cloud architecture patterns.
6. **Save and export** sessions, code, architecture JSON, notebooks, Quantum Algorithm Briefs, and PQC Migration Memos.

## Core Surfaces

- `/` introduces the product and visible independent-project disclaimer.
- `/learn` contains structured learning paths.
- `/explore` highlights flagship use cases and keeps the catalog accessible.
- `/assess` turns readiness scoring into an Algorithm Contract, verdict, and next steps.
- `/build` is the Cirq Lab for circuit templates, metrics, histograms, state preview, optional qsim fallback, and exports.
- `/map` shows a simulator-first Google Cloud architecture map.
- `/use-cases/[slug]` provides public, shareable use-case pages.
- `/about` explains ownership, limitations, hardware access, and attribution.

## Technology Stack

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- TanStack Query
- Framer Motion

Backend:

- FastAPI
- Pydantic v2
- SQLAlchemy 2
- Alembic
- PostgreSQL

Quantum and shared logic:

- Cirq for circuit construction and simulation
- qsim/qsimcirq as an optional simulator path when installed
- OpenFermion hooks and learning content where applicable
- `packages/foundry-core` for circuits, simulation helpers, assessment, mapping, storage, and jobs

Cloud deployment path:

- Cloud Run
- Cloud SQL for PostgreSQL
- Cloud Storage
- Cloud Tasks
- Cloud Build
- Artifact Registry
- Vertex AI/Gemini only when configured

## Architecture Overview

The repository is a monorepo:

```text
apps/frontend      Next.js frontend
apps/backend       FastAPI backend
apps/worker        Python worker for jobs and artifacts
packages/foundry-core shared Python package
docs               documentation hub
infra              deployment skeletons
```

Local development uses Docker Compose for PostgreSQL and service orchestration. Product records live in PostgreSQL. Exported artifacts use a storage abstraction so local storage can be swapped for Cloud Storage in deployment. Jobs use an abstraction so local worker processing can move toward Cloud Tasks and Cloud Run Jobs.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

For the QALS 3.0 rule engine, verdict meanings, trust labels, async job model,
simulator-first guardrail, and extension guidance, see
[docs/QALS_2_WORKBENCH.md](docs/QALS_2_WORKBENCH.md).

## Simulation and Hardware-Access Guardrails

- Simulation-first by default.
- QALS 3.0 is a deterministic Algorithm Contract heuristic, not a scientific proof or ML score.
- Circuit results are educational unless otherwise stated.
- Noise comparison is an educational approximation unless explicitly configured with a calibrated model.
- Google quantum hardware access is restricted to approved groups. Quantum Foundry is simulation-first unless approved access is configured.

## Local Development

Prerequisites:

- Node.js compatible with the frontend package.
- Python 3.11.
- Docker or Docker Desktop.
- PostgreSQL through Docker Compose or a compatible local service.

Common commands:

```bash
docker compose up --build
```

Frontend:

```bash
cd apps/frontend
npm install
npm run dev
```

Backend tests:

```bash
PYTHONPATH=packages/foundry-core/src:apps/backend/src:apps/worker/src \
python3.11 -m pytest packages/foundry-core/tests apps/backend/tests
```

Frontend checks:

```bash
cd apps/frontend
npm run lint
npm run build -- --webpack
```

See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

## Environment Variables

Configuration is documented in [.env.example](.env.example) and [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md). Do not commit real secrets.

Important groups:

- Frontend API URL
- Database URL
- Storage backend and artifact path
- Cloud Storage bucket
- Job backend and Cloud Tasks queue
- Vertex/Gemini guide configuration
- Deployment metadata

## Database and Migrations

The backend uses SQLAlchemy models and Alembic migrations. Run migrations before starting an environment that needs schema changes:

```bash
cd apps/backend
alembic upgrade head
```

Seed use cases:

```bash
python -m foundry_backend.seeds.seed_use_cases
```

See [docs/DATABASE_AND_MIGRATIONS.md](docs/DATABASE_AND_MIGRATIONS.md).

## Testing

Primary checks:

- Backend and foundry-core: `pytest`
- Frontend lint: `npm run lint`
- Frontend production build: `npm run build -- --webpack`
- Manual route smoke tests for `/`, `/learn`, `/explore`, `/assess`, `/build`, `/map`, `/about`, and `/use-cases/portfolio-optimization`

See [docs/TESTING.md](docs/TESTING.md).

## Deployment

The first hosted target is Cloud Run. The deployment path uses Cloud Build and Artifact Registry to build images, then deploys frontend, backend, worker, migration, and seed steps as configured.

See:

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/CLOUD_BUILD.md](docs/CLOUD_BUILD.md)
- [docs/GOOGLE_CLOUD_STACK.md](docs/GOOGLE_CLOUD_STACK.md)

## Documentation Index

Start with [docs/README.md](docs/README.md). It links to product, architecture, cloud, simulation, deployment, testing, troubleshooting, security, and contribution docs.

## Roadmap

Now:

- Personal-project branding and disclaimers
- Public route clarity
- Documentation quality
- Capability-aware UI language

Next:

- Persistent learning profiles
- Deeper Vertex AI/Gemini guide configuration if needed
- More OpenFermion learning examples

Later:

- Richer industry atlas
- Badges or completion certificates
- Approved-access hardware path only if applicable

Won't do:

- Claim official Google affiliation
- Claim Google endorsement
- Claim quantum advantage without strong evidence and qualification
- Expose public quantum hardware execution
- Add non-Google quantum SDKs as primary exports

See [docs/ROADMAP.md](docs/ROADMAP.md).

## Trademark and Attribution Notice

Google, Google Cloud, GCP, Vertex AI, Gemini, Cirq, qsim, OpenFermion, and related names are trademarks or products of their respective owners. All references are descriptive. Quantum Foundry is independently created and maintained by Nikhil Jethava and is not affiliated with, sponsored by, endorsed by, or maintained by Google LLC.

## License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text and [NOTICE](./NOTICE) for attribution and trademark context.

SPDX identifier: `Apache-2.0`

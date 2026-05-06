# Quantum Foundry Documentation

Quantum Foundry is an independent personal project and is not an official Google product.

Quantum Foundry is licensed under Apache-2.0. See the root [LICENSE](../LICENSE) file.

This documentation hub distinguishes implemented behavior from partially implemented and planned work. Google Cloud, Cirq, qsim, OpenFermion, Vertex AI, Gemini, and related names are referenced descriptively.

## Status Key

- **Implemented**: Present in the current app.
- **Partially implemented**: Present but intentionally limited or configuration-dependent.
- **Planned**: Documented as future work only.

## Documentation Index

- [PRODUCT.md](PRODUCT.md): Product vision, target users, core journey, and limitations.
- [ARCHITECTURE.md](ARCHITECTURE.md): Frontend, backend, worker, foundry-core, database, artifacts, jobs, and deployment architecture.
- [GOOGLE_CLOUD_STACK.md](GOOGLE_CLOUD_STACK.md): Google Cloud services used descriptively by the project and what is implemented versus planned.
- [QUANTUM_SIMULATION.md](QUANTUM_SIMULATION.md): Simulation-first Cirq approach, qsim fallback, state previews, noise comparison, and limits.
- [HARDWARE_ACCESS.md](HARDWARE_ACCESS.md): Hardware-access wording, approved-access constraints, and what not to claim.
- [BRANDING_AND_ATTRIBUTION.md](BRANDING_AND_ATTRIBUTION.md): Independent-project naming, phrases to avoid, and attribution guidance.
- [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md): Prerequisites, local services, setup, and startup troubleshooting.
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md): Environment-variable table and configuration groups.
- [DATABASE_AND_MIGRATIONS.md](DATABASE_AND_MIGRATIONS.md): SQLAlchemy, Alembic, migrations, seeding, and schema inspection.
- [API.md](API.md): Implemented API routes, request examples, response assumptions, and auth notes.
- [FRONTEND.md](FRONTEND.md): Next.js structure, routes, components, styling, metadata, and limitations.
- [BACKEND.md](BACKEND.md): FastAPI structure, routers, services, models, schemas, and tests.
- [WORKER.md](WORKER.md): Worker purpose, job types, local development, and deployment behavior.
- [DEPLOYMENT.md](DEPLOYMENT.md): Cloud Run, Cloud SQL, Cloud Storage, Cloud Tasks, service accounts, and smoke tests.
- [CLOUD_BUILD.md](CLOUD_BUILD.md): Cloud Build trigger, substitutions, image builds, migration/seed jobs, and common failures.
- [TESTING.md](TESTING.md): Release test strategy, smoke tests, deployment checks, and guardrails.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md): Demo paths, talk track, and overclaiming guardrails.
- [ROADMAP.md](ROADMAP.md): Now, next, later, and won't-do items.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md): Common local, backend, storage, qsim, guide, and deployment issues.
- [SECURITY.md](SECURITY.md): Personal-project security posture, secrets, IAM, and disclosure notes.
- [CONTRIBUTING.md](CONTRIBUTING.md): Setup, branch naming, PR checklist, style, and disclaimer checks.
- [DECISIONS.md](DECISIONS.md): Lightweight architecture decision record index.

## Compatibility Stubs

These lowercase files remain as forwarding stubs for older links:

- [architecture.md](architecture.md) -> [ARCHITECTURE.md](ARCHITECTURE.md)
- [api.md](api.md) -> [API.md](API.md)
- [demo-script.md](demo-script.md) -> [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- [gcp-cloud-build.md](gcp-cloud-build.md) -> [CLOUD_BUILD.md](CLOUD_BUILD.md)

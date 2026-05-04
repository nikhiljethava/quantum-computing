# Google Cloud Stack

Quantum Foundry is an independent personal project and is not an official Google product.

## Why Google Cloud Services Are Used

The app maps simulator-first quantum workflows to Google Cloud services because Cloud Run, Cloud SQL, Cloud Storage, Cloud Tasks, Cloud Build, and Artifact Registry are practical building blocks for a containerized educational product.

## Implemented vs Planned

| Service | Status | Use |
| --- | --- | --- |
| Cloud Run frontend | Implemented for deployment | Hosts the Next.js app |
| Cloud Run backend | Implemented for deployment | Hosts FastAPI |
| Worker service | Implemented locally, deployment-ready | Processes jobs and exports |
| Cloud SQL | Implemented target | PostgreSQL product state |
| Cloud Storage | Partially implemented | Artifact storage adapter |
| Cloud Tasks | Planned/adapter path | Production queue replacement |
| Cloud Build | Implemented path | Build and deploy pipeline |
| Artifact Registry | Implemented path | Container images |
| Cloud Run Jobs | Planned/adapter path | Long-running simulations and maintenance jobs |
| BigQuery | Planned/use-case mapping | Analytics and scenario inputs |
| Vertex AI/Gemini | Partially implemented | Config-gated guide or circuit assist workflows |

## Naming Guidance

Use “uses Google Cloud services” or “built with Google Cloud technologies.” Do not describe Quantum Foundry as a provider-owned app or a service created by Google.

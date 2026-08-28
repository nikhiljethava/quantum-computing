# Environment Variables

Quantum Foundry is an independent personal project and is not an official Google product.

Do not commit real secrets. Use Secret Manager or deployment-specific secret injection for production.

| Variable | Required | Used by | Default | Description | Example |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Frontend | `http://127.0.0.1:8000` | Backend API base URL | `https://api.example.run.app` |
| `NEXT_PUBLIC_SERIES_ARTICLE_01_URL` | No | Frontend | empty | Trusted HTTPS canonical URL for Series Article 1; the external CTA is hidden when empty or invalid | `https://example.substack.com/p/article-one` |
| `NEXT_PUBLIC_SERIES_ARTICLE_02_URL` | No | Frontend | empty | Trusted HTTPS canonical URL for Series Article 2; the external CTA is hidden when empty or invalid | `https://example.substack.com/p/article-two` |
| `DATABASE_URL` | Yes | Backend, worker | none | SQLAlchemy async PostgreSQL URL | `postgresql+asyncpg://...` |
| `COMPOSE_DATABASE_URL` | Local | Docker Compose | local Postgres | Compose database URL | `postgresql+asyncpg://foundry:...` |
| `STORAGE_BACKEND` | No | Backend, worker | `local` | Artifact storage backend | `local` or `gcs` |
| `ARTIFACT_DIR` | Local | Backend, worker | `./artifacts` | Local artifact directory | `/app/artifacts` |
| `GCS_BUCKET` | Deployment | Backend, worker | empty | Cloud Storage bucket | `quantum-foundry-artifacts` |
| `JOB_BACKEND` | No | Backend, worker | `local` | Job backend abstraction | `local` or `cloud_tasks` |
| `CLOUD_TASKS_QUEUE` | Planned | Backend | empty | Cloud Tasks queue name | `foundry-jobs` |
| `ENVIRONMENT` | No | All services | `development` | Runtime environment label | `production` |
| `CORS_ORIGINS_STR` | Yes | Backend | local origins | Allowed browser origins | `https://app.example.com` |
| `GUIDE_PROVIDER` | No | Backend | `local` | Guide provider | `local` or `vertex` |
| `VERTEX_AI_PROJECT` | Vertex | Backend | empty | Vertex AI project | `my-project` |
| `VERTEX_AI_LOCATION` | Vertex | Backend | `us-central1` | Vertex AI location | `us-central1` |
| `VERTEX_RAG_CORPUS_ID` | Planned | Backend | empty | Optional RAG corpus id | `projects/...` |
| `GEMINI_API_KEY` | Optional | User flow | none | User-supplied circuit draft assist key if configured | never commit |
| `BUILD_SHA` | Deployment | Frontend/backend | empty | Build metadata | commit SHA |
| `BUILD_TIME` | Deployment | Frontend/backend | empty | Build timestamp | ISO timestamp |

Capability flags for qsim/OpenFermion should be documented when introduced as runtime flags. Today qsim is optional dependency behavior, not a required environment variable.

Series canonical URLs are read at frontend build time. Only absolute HTTPS URLs are accepted by the content model. They are not populated from query parameters, and an invalid value fails closed by hiding the CTA.

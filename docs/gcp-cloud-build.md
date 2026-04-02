# Cloud Build -> Cloud Run Launch Guide

This repo now includes
[cloudbuild.yaml](/Users/nikhiljethava/Documents/Codex/quantum-computing/cloudbuild.yaml)
for a first hosted launch on Google Cloud.

## Target shape

- `apps/frontend` -> Cloud Run public frontend
- `apps/backend` -> Cloud Run public API
- `apps/worker` -> Cloud Run private worker endpoint
- PostgreSQL -> Cloud SQL for PostgreSQL
- artifacts -> Cloud Storage
- async jobs -> Cloud Tasks -> worker HTTP endpoint

## Before the first build

Enable these APIs in the target GCP project:

- Cloud Build
- Artifact Registry
- Cloud Run
- Cloud SQL Admin
- Secret Manager
- Cloud Tasks
- IAM Credentials API

Create these resources:

- one Artifact Registry Docker repo
- one Cloud SQL Postgres instance and database
- one Cloud Storage bucket for artifacts
- one Cloud Tasks queue
- one runtime service account for Cloud Run services and jobs
- one task invoker service account used by Cloud Tasks when calling the worker

## Required roles

Cloud Build service account:

- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/artifactregistry.admin` or equivalent writer/admin split
- `roles/cloudtasks.admin`

Cloud Run runtime service account:

- `roles/cloudsql.client`
- `roles/storage.objectAdmin` on the artifact bucket
- `roles/secretmanager.secretAccessor`

Cloud Tasks invoker service account:

- `roles/run.invoker` on the worker service

## Database secret

Store the SQLAlchemy URL in Secret Manager.

Recommended Cloud SQL socket format:

```text
postgresql+asyncpg://DB_USER:DB_PASSWORD@/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE
```

Name the secret something like `quantum-foundry-database-url`.

## First deploy

From the repo root:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_AR_REPOSITORY=quantum-foundry,_GCS_BUCKET=YOUR_BUCKET,_DATABASE_URL_SECRET=quantum-foundry-database-url,_CLOUD_SQL_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE,_CLOUD_TASKS_LOCATION=us-central1,_CLOUD_TASKS_QUEUE=quantum-foundry-jobs,_RUNTIME_SERVICE_ACCOUNT=quantum-foundry-runtime@PROJECT_ID.iam.gserviceaccount.com,_TASKS_INVOKER_SERVICE_ACCOUNT=quantum-foundry-tasks@PROJECT_ID.iam.gserviceaccount.com
```

What the build does:

1. ensures the Artifact Registry repo exists
2. ensures the Cloud Tasks queue exists
3. builds and pushes backend and worker images
4. deploys the worker to Cloud Run
5. deploys and executes migration + seed jobs from the backend image
6. deploys the backend with Cloud Tasks and GCS enabled
7. builds the frontend with the live backend URL baked into `NEXT_PUBLIC_API_URL`
8. deploys the frontend
9. updates backend CORS once the frontend URL is known

## Notes

- The frontend uses `NEXT_PUBLIC_API_URL` at build time, so Cloud Build deploys
  the backend first and then builds the frontend against the live backend URL.
- The worker stays dual-mode:
  local Docker Compose runs the DB poller, while Cloud Run runs the HTTP task
  endpoint.
- The user-supplied Gemini API key remains client-provided and is not part of
  GCP secret configuration for v1.

## After deploy

Check:

- frontend Cloud Run URL loads `/`, `/build`, `/explore`, and `/assess`
- backend `/health` returns `ok`
- saving a workspace still works
- `Run in worker` completes through Cloud Tasks
- session summary exports land in Cloud Storage-backed artifacts

## Known launch gaps

- auth is still preview-grade and intentionally out of scope for this v1 deploy
- Terraform is still not implemented
- stricter network hardening, VPC egress policy, and custom domain setup are
  still follow-on tasks

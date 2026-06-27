# Deployment

Quantum Foundry is an independent personal project and is not an official Google product.

## Overview

The first hosted target is Cloud Run. Cloud Build can build images, run migrations/seeds, and deploy services.

## Services

- Frontend Cloud Run service.
- Backend Cloud Run service.
- Private worker service or job.
- Cloud SQL PostgreSQL.
- Cloud Storage artifact bucket.
- Cloud Tasks queue when configured.
- Artifact Registry repository.

## Deployment Sequence

1. Build frontend, backend, and worker images.
2. Push images to Artifact Registry.
3. Run database migrations.
4. Run seed job.
5. Deploy backend.
6. Deploy worker privately.
7. Deploy frontend with backend URL.
8. Run smoke tests.

## Frontend Access Modes

Cloud Build uses `FRONTEND_ACCESS_MODE=public|iap-protected` to make the
frontend access policy explicit.

- `public` disables Cloud Run IAP with `--no-iap`, then enables public
  invocation with `--no-invoker-iam-check` when supported. Older gcloud
  versions fall back to granting `allUsers` `roles/run.invoker`.
- `iap-protected` enables Cloud Run IAP with `--iap`, grants the IAP service
  agent `roles/run.invoker`, and grants comma-separated `IAP_ALLOWED_MEMBERS`
  `roles/iap.httpsResourceAccessor`.

After deployment, `scripts/check-frontend-access.sh` verifies the frontend URL.
Public mode fails fast if the response contains an IAP-generated header, Google
OAuth redirect, or auth-related `401`/`403`.

## IAM

Use least-privilege service accounts for Cloud SQL, Cloud Storage, Cloud Tasks, and Cloud Run invocation.

## Rollback

Rollback through Cloud Run revisions and compatible database migration strategy. Prefer forward database fixes when migrations are not safely reversible.

## Smoke Tests

- `/`
- `/about`
- `/learn`
- `/explore`
- `/build`
- `/map`
- `/api/v1/health`

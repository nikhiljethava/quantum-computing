# Troubleshooting

Quantum Foundry is an independent personal project and is not an official Google product.

## Frontend Cannot Reach Backend

Check `NEXT_PUBLIC_API_URL`, backend service health, and CORS origins.

## CORS Issues

Update `CORS_ORIGINS_STR` to include the frontend origin.

## Database Connection Errors

Verify `DATABASE_URL`, Cloud SQL connectivity, and PostgreSQL health.

## Migration Failures

Run `alembic current` and inspect the failing revision. Confirm the database user has DDL privileges.

## Cloud Tasks Errors

Confirm queue name, region, IAM roles, and target service authentication.

## Cloud Storage Artifact Errors

Check `STORAGE_BACKEND`, `GCS_BUCKET`, service account roles, and object path.

## qsim Unavailable

Expected behavior: qsim mode falls back to Cirq if qsimcirq is not installed.

## OpenFermion Unavailable

OpenFermion is not required for the core v1 flow.

## Vertex Guide Unavailable

Use `GUIDE_PROVIDER=local` until Vertex AI/Gemini credentials and configuration are ready.

## Colab Export Errors

Verify the circuit run exists and artifact storage is writable.

## Stale Cloud Run Revision

Check traffic split, revision URL, and build SHA.

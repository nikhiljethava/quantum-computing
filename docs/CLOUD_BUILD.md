# Cloud Build

Quantum Foundry is an independent personal project and is not an official Google product.

## Trigger Setup

Create a Cloud Build trigger from the GitHub repository. Configure substitutions for project, region, service names, image repository, database, and artifact bucket.

## Pipeline Responsibilities

- Build images.
- Push images to Artifact Registry.
- Inject build metadata such as commit SHA and build time when configured.
- Run migration job.
- Run seed job.
- Deploy frontend, backend, and worker.
- Verify Cloud Run URLs and traffic.

## Common Failures

- Missing API enablement.
- Missing IAM role for Cloud SQL or Cloud Storage.
- Invalid substitution.
- Migration failure because the database is not reachable.
- Frontend built with the wrong `NEXT_PUBLIC_API_URL`.

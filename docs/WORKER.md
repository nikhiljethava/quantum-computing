# Worker

Quantum Foundry is an independent personal project and is not an official Google product.

## Purpose

The worker handles asynchronous jobs that should not block API request/response flows.

## Implemented Job Types

- Circuit simulation jobs.
- Artifact generation jobs.
- Session summary export jobs.

## Local Development

Run with Docker Compose or directly with the worker package environment configured.

## Production Deployment

The worker is intended to run as a private service or job. Cloud Tasks can invoke it when the queue adapter is configured.

## Authentication Assumptions

Local worker execution is trusted inside the development environment. Production should use service-to-service authentication and least-privilege service accounts.

## Troubleshooting

- Jobs stuck queued: verify worker is running and database URL matches backend.
- Failed exports: inspect artifact storage environment variables.
- Duplicate retries: verify retry policy and idempotency assumptions.

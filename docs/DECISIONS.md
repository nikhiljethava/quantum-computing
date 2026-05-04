# Decisions

Quantum Foundry is an independent personal project and is not an official Google product.

## ADR-001: Personal Project Branding and Disclaimer

- **Status**: Accepted.
- **Context**: Previous naming could imply official Google/GCP affiliation.
- **Decision**: Public product name is Quantum Foundry with visible independent-project disclaimer.
- **Consequences**: Google products are referenced descriptively only.

## ADR-002: Simulation-First Quantum Strategy

- **Status**: Accepted.
- **Context**: Public hardware access should not be implied.
- **Decision**: The app defaults to simulation.
- **Consequences**: Hardware paths require approved-access language.

## ADR-003: Cirq as Primary SDK

- **Status**: Accepted.
- **Context**: The product focuses on Cirq-based learning and simulation.
- **Decision**: Cirq remains primary.
- **Consequences**: Other quantum SDKs are not primary export paths.

## ADR-004: qsim Optional Fallback Strategy

- **Status**: Accepted.
- **Context**: qsim may not be available in every environment.
- **Decision**: qsim is optional and falls back to Cirq.
- **Consequences**: App startup does not require qsimcirq.

## ADR-005: No Public Google Hardware Access Claim

- **Status**: Accepted.
- **Context**: Hardware access is restricted.
- **Decision**: Use exact hardware disclaimer where relevant.
- **Consequences**: No public hardware CTA.

## ADR-006: Next.js Retained for Frontend

- **Status**: Accepted.
- **Context**: Current app is built in Next.js.
- **Decision**: Keep Next.js.
- **Consequences**: No frontend migration in current scope.

## ADR-007: Google Cloud Deployment Target

- **Status**: Accepted.
- **Context**: Cloud Run is the first hosted target.
- **Decision**: Use Cloud Run, Cloud SQL, Cloud Storage, Cloud Tasks, and Cloud Build patterns.
- **Consequences**: Cloud references remain descriptive, not brand ownership claims.

## ADR-008: Documentation-First Repo Structure

- **Status**: Accepted.
- **Context**: Public repo needs clear project status and guardrails.
- **Decision**: Maintain docs hub and route-specific docs.
- **Consequences**: User-visible changes should update docs.

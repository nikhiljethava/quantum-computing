# Database and Migrations

Quantum Foundry is an independent personal project and is not an official Google product.

## Technology

- Database: PostgreSQL.
- ORM: SQLAlchemy 2.
- Migrations: Alembic.
- Schemas: Pydantic API contracts.

## Run Migrations Locally

```bash
cd apps/backend
alembic upgrade head
```

With Docker Compose:

```bash
docker compose exec backend alembic upgrade head
```

## Seed Data

```bash
python -m foundry_backend.seeds.seed_use_cases
```

Seed data includes use cases, featured ranks, blueprints, evidence, and slugs.

## Phase 0 Migration

`0011_phase0_result_trust_maps` adds nullable contract/problem classification and JSON trust
context to architecture records. It also adds a nullable Algorithm Contract reference and JSON
trust context to artifacts. Existing rows remain valid; all new API fields are additive and default
to `null`, an empty object, or documented tutorial/classical compatibility values.

## Deployment

Deployment should run migrations before shifting traffic to a new backend revision. Seed jobs should run after migrations and before public smoke tests.

## Rollback Guidance

- Prefer forward fixes for public deployments.
- Use Alembic downgrade only when the migration is known to be reversible and no production data depends on the new schema.
- Back up production databases before risky schema changes.

## Inspect Current Schema

Use `alembic current`, `alembic history`, and SQL inspection tools such as `psql` or Cloud SQL Studio.

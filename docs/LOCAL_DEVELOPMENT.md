# Local Development

Quantum Foundry is an independent personal project and is not an official Google product.

## Prerequisites

- Node.js for the Next.js frontend.
- Python 3.11.
- Docker or Docker Desktop.
- PostgreSQL via Docker Compose or local service.

## Environment Setup

Copy `.env.example` to `.env` and fill local values. Do not commit real secrets.

## Start Services

```bash
docker compose up --build
```

Common URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## Migrations and Seeds

```bash
cd apps/backend
alembic upgrade head
python -m foundry_backend.seeds.seed_use_cases
```

## Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

## Troubleshooting Startup

- Backend cannot reach database: verify `DATABASE_URL` and Docker Compose network.
- Frontend cannot reach backend: verify `NEXT_PUBLIC_API_URL`.
- Missing seed data: run the seed script.
- qsim unavailable: Cirq fallback is expected.

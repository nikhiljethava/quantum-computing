.PHONY: install install-python install-frontend up down logs migrate dev-backend dev-worker dev-frontend test test-backend test-core test-worker compose-config

install: install-python install-frontend

install-python:
	python3 -m pip install -e packages/foundry-core
	python3 -m pip install -e 'apps/backend[dev]'
	python3 -m pip install -e 'apps/worker[dev]'

install-frontend:
	cd apps/frontend && npm install

up:
	docker compose up --build

down:
	docker compose down --remove-orphans

logs:
	docker compose logs -f

compose-config:
	docker compose config

migrate:
	cd apps/backend && alembic upgrade head

dev-backend:
	PYTHONPATH=apps/backend/src:packages/foundry-core/src uvicorn foundry_backend.main:app --reload --host 0.0.0.0 --port 8000

dev-worker:
	PYTHONPATH=apps/worker/src:apps/backend/src:packages/foundry-core/src python3 -m foundry_worker.main

dev-frontend:
	cd apps/frontend && npm run dev

test: test-core test-backend test-worker

test-core:
	PYTHONPATH=packages/foundry-core/src python3 -m pytest packages/foundry-core/tests

test-backend:
	PYTHONPATH=apps/backend/src:packages/foundry-core/src python3 -m pytest apps/backend/tests

test-worker:
	PYTHONPATH=apps/worker/src:apps/backend/src:packages/foundry-core/src python3 -m pytest apps/worker/tests

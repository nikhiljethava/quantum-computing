.PHONY: install install-python install-frontend up down logs migrate dev-backend dev-worker dev-frontend test test-backend test-core test-worker compose-config

PYTHON ?= $(shell command -v python3.11 2>/dev/null || command -v python3 2>/dev/null)

install: install-python install-frontend

install-python:
	$(PYTHON) -m pip install -e packages/foundry-core
	$(PYTHON) -m pip install -e 'apps/backend[dev]'
	$(PYTHON) -m pip install -e 'apps/worker[dev]'

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
	PYTHONPATH=apps/worker/src:apps/backend/src:packages/foundry-core/src $(PYTHON) -m foundry_worker.main

dev-frontend:
	cd apps/frontend && npm run dev

test: test-core test-backend test-worker

test-core:
	MPLCONFIGDIR=/tmp/matplotlib PYTHONPATH=packages/foundry-core/src $(PYTHON) -m pytest packages/foundry-core/tests

test-backend:
	MPLCONFIGDIR=/tmp/matplotlib PYTHONPATH=apps/backend/src:packages/foundry-core/src $(PYTHON) -m pytest apps/backend/tests

test-worker:
	MPLCONFIGDIR=/tmp/matplotlib PYTHONPATH=apps/worker/src:apps/backend/src:packages/foundry-core/src $(PYTHON) -m pytest apps/worker/tests

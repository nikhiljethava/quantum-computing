FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install foundry-core (shared library)
COPY packages/foundry-core /foundry-core
RUN pip install --no-cache-dir -e /foundry-core

# Copy and install backend
COPY apps/backend/pyproject.toml /app/pyproject.toml
COPY apps/backend/src /app/src
RUN pip install --no-cache-dir -e .

# Alembic config and migrations
COPY apps/backend/alembic.ini /app/alembic.ini
COPY apps/backend/alembic /app/alembic

# Create artifacts directory
RUN mkdir -p /app/artifacts

CMD ["uvicorn", "foundry_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

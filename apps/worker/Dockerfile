FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install foundry-core
COPY packages/foundry-core /foundry-core
RUN pip install --no-cache-dir -e /foundry-core

# Install backend (worker re-uses its models)
COPY apps/backend/pyproject.toml /backend/pyproject.toml
COPY apps/backend/src /backend/src
RUN pip install --no-cache-dir -e /backend

# Install worker
COPY apps/worker/pyproject.toml /app/pyproject.toml
COPY apps/worker/src /app/src
RUN pip install --no-cache-dir -e .

RUN mkdir -p /app/artifacts

CMD ["python", "-m", "foundry_worker.main"]

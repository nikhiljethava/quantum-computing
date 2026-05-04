# Testing

Quantum Foundry is an independent personal project and is not an official Google product.

## Backend and Core

```bash
PYTHONPATH=packages/foundry-core/src:apps/backend/src:apps/worker/src \
python3.11 -m pytest packages/foundry-core/tests apps/backend/tests
```

## Frontend

```bash
cd apps/frontend
npm run lint
npm run build -- --webpack
```

## Type Checks

The production Next.js build runs TypeScript checks. Add `npm run typecheck` if a dedicated script is introduced.

## Manual QA Checklist

- Homepage shows independent-project notice.
- `/about` exists and is linked.
- Footer disclaimer appears.
- `/learn`, `/explore`, `/assess`, `/build`, `/map`, and `/use-cases/portfolio-optimization` load.
- No page implies official Google affiliation.
- No page claims public Google quantum hardware access.
- No page claims quantum advantage.

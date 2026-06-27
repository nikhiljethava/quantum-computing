# Testing

Quantum Foundry is an independent personal project and is not an official Google product.

## Release Testing Strategy

Use this plan before pushing a production-facing change or promoting a Cloud Run revision. It covers the main product loop: Learn -> Explore -> Assess -> Build -> Map -> Export -> Jobs.

For the detailed Algorithm Contract workflow cases, use [QALS 3.0 End-to-End Test Cases](./QALS_3_E2E_TEST_CASES.md). That matrix covers assessment-first guardrails, Algorithm Contract creation, Algorithm Experiment Bundle flow, Result Trust panel, hybrid map, Quantum Algorithm Brief export, and PQC Migration Memo export.

### 1. Static And Unit Checks

Run the local test suite first so implementation regressions are caught before browser or deployment work.

- `make test` runs foundry-core, backend, and worker tests.
- `npm run lint` from `apps/frontend` runs the frontend lint rules.
- `npm run build -- --webpack` from `apps/frontend` runs the production Next.js build and TypeScript checks.
- `git diff --check` catches whitespace and patch-format issues.

### 2. Local Service Smoke Tests

With the local frontend and backend running, verify the API contract used by public pages.

| Area | Endpoint or route | Expected result |
| --- | --- | --- |
| Backend health | `GET /health` | `200` with backend service status |
| Catalog | `GET /api/v1/use-cases` | seeded use cases and featured Algorithm Contract examples |
| Featured catalog | `GET /api/v1/use-cases?featured_only=true` | battery/materials, logistics, PQC readiness, and Grover/oracle scoping examples |
| Circuit templates | `GET /api/v1/circuits/templates` | starter templates for coin flip, Bell, Grover, routing, chemistry |
| Circuit run | `POST /api/v1/circuits/run` | histogram, Cirq code, metrics, state preview when applicable |
| Assessment | `POST /api/v1/assessments` | verdict, Algorithm Contract fields, missing inputs, trust labels, and secondary score |
| Contract | `POST /api/v1/assessments/{id}/contracts` | persisted Algorithm Contract with validity and build eligibility |
| Architecture map | `POST /api/v1/architectures` | Google Cloud architecture graph payload |
| Guide | `POST /api/v1/guide/ask` | deterministic local answer, citations, and next action |
| Usage analytics | `GET /api/v1/usage?page_path=/jobs` | last-30-day visits summary, even when zero |

### 3. Browser Journey Tests

Exercise these pages manually or with a browser automation harness once one is added.

1. Open `/` and confirm the independent-project notice is visible without scrolling.
2. Open `/learn`, start the Beginner path, complete one quiz, and confirm local progress is shown.
3. Open `/explore` and confirm the default view highlights the V1 flagship lanes and algorithm-pattern cards.
4. Open `/use-cases/portfolio-optimization` and confirm evidence cards, Google Cloud architecture notes, and hardware-access disclaimer render.
5. Open `/assess?starter=routing` or select a use case from Explore, run QALS 3.0, and confirm the verdict and contract are visually primary over the score.
6. Open `/build?starter=bell_state&lesson=entanglement`, run a circuit, and verify metrics, histogram, state preview, Cirq code, and lab controls.
7. Enable noise mode on Build and verify ideal/noisy comparison appears with the educational approximation copy.
8. Export Cirq code and Colab notebook from Build and confirm artifacts download.
9. Open `/map`, generate a workflow, and verify simulator-first architecture wording.
10. Open `/jobs` and confirm usage statistics render a valid empty state or real last-30-day counts.

### 4. Cloud Run Deployment Checks

After Cloud Build deploys, test the deployed services directly. Replace the URLs with the values printed by Cloud Build.

```bash
curl -i https://BACKEND_URL/health
curl -i https://BACKEND_URL/api/v1/use-cases
curl -i -X OPTIONS https://BACKEND_URL/api/v1/use-cases \
  -H 'Origin: FRONTEND_URL' \
  -H 'Access-Control-Request-Method: GET'
```

Expected production results:

- Backend health returns `200`.
- Use-case catalog returns `200` with JSON, not `500`.
- CORS preflight returns an allowed origin for the active frontend Cloud Run URL.
- The frontend service URL loads the same branding and disclaimer as local.
- Legacy frontend URLs redirect to the active frontend URL if configured.

### 5. Database And Migration Checks

Production data routes depend on Cloud SQL and migrations. A healthy `/health` endpoint is not enough.

- Confirm Cloud Build ran the migration job successfully.
- Confirm Cloud Build ran the seed job successfully.
- Confirm `DATABASE_URL` is populated from Secret Manager.
- Confirm the backend service has the Cloud SQL instance attached.
- Confirm `GET /api/v1/use-cases` returns seeded records in production.

### 6. Regression Guardrails

Review visible copy and generated artifacts for these product-safety rules.

- Product name is `Quantum Foundry`, not a name starting with GCP or Google.
- Independent personal project disclaimer is visible on public pages.
- Google Cloud, Cirq, qsim, OpenFermion, Vertex AI, and Gemini references are descriptive.
- Hardware wording uses: "Google quantum hardware access is restricted to approved groups. Quantum Foundry is simulation-first unless approved access is configured."
- No public hardware-run CTA appears.
- No page claims quantum advantage.

## Commands

### Backend and Core

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

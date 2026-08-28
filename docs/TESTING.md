# Testing

Quantum Foundry is an independent personal project and is not an official Google product.

## Release Testing Strategy

Use this plan before pushing a production-facing change or promoting a Cloud Run revision. It covers the public loop: Article or homepage -> companion or Learn -> guided example -> Quick Assessment -> Full Algorithm Contract -> Build -> Map -> Export -> Jobs.

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
| Architecture map | `POST /api/v1/architectures` | contract-specific architecture graph payload used by both reference and cloud-example views |
| Guide | `POST /api/v1/guide/ask` | deterministic local answer, citations, and next action |
| Usage analytics | `GET /api/v1/usage?page_path=/jobs` | last-30-day visits summary, even when zero |

### 3. Browser Journey Tests

Exercise these pages manually or with a browser automation harness once one is added.

1. Open `/` and confirm the independent-project notice, accurate concept copy, and Series, software-stack, and assessment entry cards are visible.
2. Open `/series`, then both article companions. Operate every platform-layer and hybrid-model control by keyboard and confirm examples remain tutorial/toy labeled.
3. Open `/learn/quantum-software-stack` and confirm Cirq is the supported execution path while other ecosystem names are educational examples.
4. Open `/assess`, complete Quick Assessment, and confirm it reports no verdict, score, or Build eligibility. Continue to Full Assessment and confirm only safe user data is prefilled.
5. Run a full logistics assessment with and without an OR-Tools/MILP baseline; verify the baseline gate and result hierarchy.
6. Open `/build?mode=tutorial&starter=bell_state`, run a circuit, and verify the Tutorial labels, Result Trust v2 fields, histogram, state preview, Cirq code, and lab controls.
7. Open Contract mode without a matching contract, then with valid and partial seeded contracts; confirm the backend gates remain authoritative.
8. Enable noise mode and verify ideal/noisy comparison appears with educational approximation copy and never becomes a hardware result.
9. Open `/map` for PQC, VQE, QAOA, and Grover contracts. Compare Reference architecture and Cloud implementation example tabs.
10. Export a decision brief and confirm the artifact carries contract, baseline, horizon, assumptions, and trust context.
11. Open `/jobs` and confirm usage statistics render a valid empty state or real last-30-day counts while typed product events stay excluded from page totals.

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
- Quick Assessment never displays or controls a QALS verdict, score, contract validity, or Build eligibility.
- Vendor-reported evidence is visually distinct from independently reproduced evidence.

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
- `/learn`, `/learn/quantum-software-stack`, `/series`, both companion routes, `/assess`, `/build`, and `/map` load.
- No page implies official Google affiliation.
- No page claims public Google quantum hardware access.
- No page claims quantum advantage.

## Public Route Check

The access script checks all direct-link release routes by default:

```bash
scripts/check-frontend-access.sh --url http://127.0.0.1:3000 --mode public
```

It fails on IAP interception, Google OAuth redirects, auth-related `401`/`403`, unexpected `404`, and `5xx` responses. Use repeatable `--route /path` flags only when a narrower diagnostic set is needed.

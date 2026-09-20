# Article 4 checkout audit

## Starting state

- Working repository: `/Users/nikhiljethava/Documents/Codex/quantum-computing`
- Branch: `codex/release-hardening`
- Starting commit: `dd70c637a63036303e844fc84040f5035a0d36dd`
- Origin: `https://github.com/nikhiljethava/quantum-computing.git`

Initial `git status --short`:

```text
 M docs/api.md
 M docs/architecture.md
```

These unrelated user changes are preserved and excluded from Article 4 commits.
Implementation proceeds on `codex/article-4-companion`, created at the starting
commit after fetching and confirming `origin/main` had the same SHA. Backend,
worker, and eligibility logic remain unchanged.

## Existing integration points

- Registry and canonical links: `apps/frontend/src/content/series.ts`
- Companion renderer and inline evidence cards:
  `apps/frontend/src/components/series/SeriesCompanionExperience.tsx`
- Static routes and metadata: `apps/frontend/src/app/series/[slug]/page.tsx`
- Registry-derived sitemap: `apps/frontend/src/app/sitemap.ts`
- Assessment parser: `apps/frontend/src/app/assess/page.tsx`
- Quick Assessment: `apps/frontend/src/components/assessment/QuickAssessment.tsx`
- Typed events: `apps/frontend/src/lib/analytics.ts`
- Frontend contract tests:
  `apps/backend/tests/test_article_companion_frontend_contract.py`
- Route smoke checks: `scripts/check-frontend-access.sh`
- Production frontend build: `apps/frontend/Dockerfile`, `cloudbuild.yaml`,
  `docker-compose.yml`, and `apps/frontend/next.config.ts`

No existing Article 4 companion was found. The frontend uses Next.js 16.2.1, and
its `AGENTS.md` requires reading the relevant installed framework guides before
editing. The original audit read the client directive and search-parameter guides.

## Integration issues identified

- Companion rendering currently dispatches only the two existing module types.
  New module types need an explicit branch.
- The existing canonical URL helper accepts HTTPS credentials; the Article 4
  requirement needs username/password rejection.
- Analytics obtains browser storage identity outside its failure handler.
  Storage failure must be covered when extending the helper.
- The assessment source allowlist accepts only Articles 1 and 2. A plain
  assessment link or already-supported context is safe; any source extension
  must be deliberate and tested.
- The existing conceptual companion trust helper assigns MEDIUM confidence and
  supports tutorial Build starters. It should not be copied onto Article 4's
  drawings and local educational tools.
- Public canonical URL configuration needs build arguments in the Docker and
  Cloud Build path; runtime-only settings do not update client bundles.

## Baseline checks actually run before intake

| Command | Actual result |
| --- | --- |
| `make test` | 30 core, 62 backend, and 7 worker tests passed. |
| `python3.11 -m pytest apps/backend/tests/test_article_companion_frontend_contract.py` | 8 passed. These are also included in the backend total. |
| `npm run lint` in `apps/frontend` | Passed. |
| `npm run build -- --webpack` in `apps/frontend` | Passed, including TypeScript and 62 generated static pages. |
| `git diff --check` | Passed. |

These establish the existing checkout's baseline; they do not validate an
Article 4 implementation. Subsequent results are recorded separately in
`docs/ARTICLE_04_IMPLEMENTATION.md`.

## Hosted app verification

The user supplied
`https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/`. The web reader could
not access that address, and an unprivileged `curl -I --max-time 20` failed DNS
resolution in this execution environment. A subsequent approved network read,
`curl -I --max-time 20 https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/`,
returned HTTP 200 on 2026-09-20. The Cloud Build site-origin default now uses this
verified owner-supplied origin. No deployment was attempted and no Article 4
public route is claimed to work.

The starting main commit has a successful Google Cloud Build check named
`quantum-computing-app (cloudhub-apptopology-golden)`. The checked-in pipeline
deploys backend, worker, and frontend services. Trigger configuration could not
be inspected with `gcloud` because no account is active. A main push must not be
assumed to be publication-free; release status records this constraint.

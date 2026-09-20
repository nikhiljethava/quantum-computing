# Article 4 implementation and verification

## Checkout audit

- Repository: `nikhiljethava/quantum-computing`.
- Original branch: `codex/release-hardening`.
- Starting commit: `dd70c637a63036303e844fc84040f5035a0d36dd`.
- Implementation branch: `codex/article-4-companion`.
- Unrelated tracked changes: `docs/api.md` and `docs/architecture.md`; preserve and exclude them from Article 4 commits.
- The prior source-intake folder was untracked at implementation start.

The initial tracked status was:

```text
 M docs/api.md
 M docs/architecture.md
```

The complete `incoming/article4-kit/CODEX_ARTICLE4_BRIEF.md` was read before implementation. No repository-root `AGENTS.md` was present. The applicable frontend `AGENTS.md` requires installed Next.js documentation; the environment-variable guide confirms that `NEXT_PUBLIC_` values are compiled at build time.

## Existing contracts and changes

| Existing component | Observed contract | Article 4 integration |
| --- | --- | --- |
| `apps/frontend/src/content/series.ts` | Typed `SeriesArticle`, companion registry, canonical URL helper | One additional Article 4 entry and the existing safe canonical-link pattern; reject embedded credentials |
| `apps/frontend/src/app/series/[slug]/page.tsx` | Registry-based metadata and static params | Reuse the route and shell; select the Article 4 renderer |
| `apps/frontend/src/app/series/page.tsx` | Registry-driven Series cards | Discover the companion without a second app |
| `apps/frontend/src/app/sitemap.ts` | Registry-derived Series routes and configured site origin | Include the same durable Article 4 route |
| `apps/frontend/src/components/series/SeriesCompanionExperience.tsx` | Existing evidence and result explanations for Articles 1 and 2 | Preserve those experiences; do not reuse hardware-confidence scoring for Article 4 drawings |
| `apps/frontend/src/app/assess/page.tsx` | Validated Article 1/2 source/context parser; full assessment controls Build | Reuse allowlisted Quick Assessment/unknown-problem/learning context; no fabricated evidence, IDs, automatic submission, or new eligibility path |
| `apps/frontend/src/lib/analytics.ts` | Typed events persisted under `/__events__/` | Allowlisted lesson/mode/export metadata only; catch browser-storage and request failures |
| `apps/backend/tests/test_article_companion_frontend_contract.py` | Python source contracts for public journeys | Preserve existing tests; add Article 4 build, route, and analytics contracts |
| `apps/frontend/Dockerfile`, `cloudbuild.yaml`, `docker-compose.yml` | Actual frontend build context is `apps/frontend` | Forward public article URLs and site origin before `next build`; assets must live in frontend public files |
| `scripts/check-frontend-access.sh` | Public/IAP-aware route smoke script | Add `/series/04-qubit-technologies` to the existing route set |

No database migration, backend assessment change, worker-eligibility change, IAM/IAP change, or new cloud service is required. Browser educational models and JSON/Markdown learning exports remain local. Analytics reuses the existing optional usage endpoint.

## Source authority and unresolved package gaps

The actual checkout defines integration contracts. The supplied `Article_4_V9_Scannable_Edition.docx` defines article content. The subsequently supplied `Quantum_Foundry_Article4_Codex_Instructions.md`, preserved as `CODEX_ARTICLE4_BRIEF.md`, defines product behavior. No older Article 4 edition is a substitute.

The source intake preserves the DOCX, extracted article, 11 tables, 41 numbered linked references, and 11 embedded PNG images. These are ten teaching stills and one editorial cover, mapped by document order and captions. See `incoming/article4-kit/SOURCE_NOTES.md` and the source inventory for provenance and hashes.

The brief describes a richer publication package than the files actually supplied. The following remain unavailable: ten reviewed MP4s, ten GIFs, forty numbered step PNGs, ten print PNGs, the separate technical/editorial source files, `ACCEPTANCE_CASES.json`, `golden-fixtures.json`, and `validate_handoff.py`. The extracted stills are not falsely renamed as the missing reviewed step or print variants. Independent fixture agreement and playback behavior cannot be certified without the supplied originals.

The request says “remaining six lessons” after assigning four tools to five lessons. The explicit mapping leaves five noninteractive lessons: transmon, ions, blockade, phase, and entanglement. Follow the ten named IDs and explicit tool mapping, rather than adding an eleventh lesson.

Input safeguards beyond the expressly specified phase/efficiency/SWAP bounds were chosen locally because `ACCEPTANCE_CASES.json` is absent. Samples accept integers 1–10,000,000; offset/reference accept −1,000–1,000; variance and illustrative operation times accept 0–1,000,000; launches accept integers 0–1,000,000,000. These are interface safeguards, not physical limits. They are disclosed next to the inputs and must be reconciled with the supplied acceptance file when available. No agreement with absent independent numerical fixtures is claimed.

No scientific review date was supplied. DOCX created/modified timestamps are not scientific review dates. Import date does not imply fresh verification, and conceptual drawings do not acquire hardware confidence scores.

## Three-stage status

1. **Companion, content, and media: partially complete.** One route, ten V9 lessons, all 41 references, original stills, optional technical explanations, manual text walkthroughs, and separate technology/algorithm comparisons are implemented. Ten fully watchable lessons and reviewed step images remain blocked by the missing media package. The registry labels Article 4 as a draft while this gap remains.
2. **Four tools and learning record: complete for the supplied specification.** Sampling, scheduling, routing, and optics use pure browser calculations. Photonics and loss are separate panels of one optics tool. The current-visit record snapshots valid observations, supports removal/clearing and JSON/Markdown export, and clears on refresh. These are local educational results; no persistence, import, quantum jobs, or eligibility changes were added. Exact independent-fixture acceptance remains unavailable because those package files were not supplied.
3. **Integration, tests, and documentation: implemented, with release limitations below.** Public URL build plumbing, typed analytics, route smoke integration, local model/export tests, browser checks, responsive screenshots, and measured media requests are present. Missing-media and deployed-endpoint acceptance remain blocked; those limitations are not treated as passing checks.

New modules are confined to Article 4 content, `components/article4/`, and `lib/article4/`, plus tests and intake/public assets. Existing Series lookup/metadata/static params/sitemap, app shell, navigation, safe canonical links, usage analytics, and the assessment entry point remain the integration boundaries. Playwright 1.62.1 is a pinned development dependency; production frameworks were not upgraded.

The first two reviewable local commits are `b02ee5a` (content, original stills, and reusable media foundation) and `dd11ecf` (browser tools and learning record). Final integration, tests, deployment configuration, screenshots, and this report form the third stage. These local commits have not been pushed to `main` or deployed.

## Actual checks

Prior intake baseline: `make test` passed 30 core, 62 backend, and 7 worker tests; frontend lint and the production webpack build passed; `git diff --check` passed. These are baseline checks, not Article 4 release acceptance.

Current integration checks:

| Command | Actual result |
| --- | --- |
| `make test` | 104 passed across core, backend, and worker suites (30 + 67 + 7) |
| `npm run test:models` from `apps/frontend` | 47 passed: 28 model/query/export tests, 6 analytics tests, and 13 content/registry/canonical-link tests. These are locally authored expectations, not the missing independent package fixtures |
| `node --test tests/article4-analytics.test.mjs` from `apps/frontend` | 6 passed. Includes all lesson/mode/level/format allowlists, rejection of arbitrary fields, denied storage reads/writes/access, unavailable analytics, and no server-render request |
| `python3.11 -m pytest apps/backend/tests/test_article4_frontend_contract.py apps/backend/tests/test_frontend_access_scripts.py` | 15 passed: 5 Article 4 source/build contracts and 10 existing access guardrails |
| `npm run build -- --webpack` from `apps/frontend` | Passed with 63 generated routes, including Article 4, and TypeScript validation |
| `NEXT_PUBLIC_SERIES_ARTICLE_04_URL= NEXT_PUBLIC_SITE_URL=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app npm run build` | Passed with the default Turbopack builder used by Docker: 63 routes and TypeScript validation. The generated-artifact checker also passed |
| `npm run lint` from `apps/frontend` | Passed, including the clipboard-state fix |
| `npm run test:browser` from `apps/frontend`, against the final default-build standalone server | 11 passed, 0 failed, 2 explicitly skipped missing-media acceptance groups; includes the denied-clipboard Back/Forward regression. The preceding webpack-server run also passed 11/13 with the same two blocked groups |
| `node --test tests/article4-media-browser.mjs` from `apps/frontend` (`npm run test:media` alias) | 10 passed, 0 failed, 0 skipped. Synthetic fixtures verify the actual reusable media component; they do not certify the missing reviewed originals |
| `node tests/article4-screenshots.mjs` from `apps/frontend` | Captured desktop/mobile hero, lesson, tool/results, and full-page screenshots using default sampling inputs and blocked APIs |
| `node tests/article4-standalone-check.mjs` from `apps/frontend` | All ten stills and the cover returned HTTP 200, `image/png`, and byte-identical source data from the final standalone server. Initial restricted loopback access returned EPERM; the approved escalation passed |
| `npx eslint src/lib/analytics.ts tests/article4-analytics.test.mjs` | Passed |
| `npx eslint tests/article4-browser.mjs tests/article4-screenshots.mjs` | Passed, including the denied-clipboard Back/Forward regression |
| `bash -n scripts/check-frontend-access.sh` | Passed syntax check |
| `git diff --check` | Passed at the integration checkpoint |
| `docker compose config --quiet` | Not run successfully: `docker` is unavailable in this environment |
| `python3 validate_handoff.py` from the supplied package directory | Blocked: validator not supplied |

The browser run used isolated headless Chrome 153.0.8010.50 and Playwright 1.62.1. Launching Chrome required an approved sandbox escalation; the initial restricted launch aborted. All `/api/` requests were deliberately blocked. The suite verified rendered results and both export formats, immutable snapshots, all 32 scheduling selections, numeric errors, sampling zero variance, routing zero/ties, optical phase endpoints and loss/launch zero cases, all ten stills and four manual text steps each, source disclosures, safe query handling, reload/Back/Forward, keyboard focus, removal/clearing, and the hidden unconfigured article CTA. Articles 1/2, assessment, Build, and Map loaded with backend unavailable. Reading and export actions submitted no assessment or job requests.

The suite confirmed no page-level horizontal overflow at 360px for each of the five live lesson panels. The reduced-motion preference was active and no video autoplay occurred. At 200% root CSS zoom with reflow, document scroll width and client width were both 1,280px. This is explicitly CSS zoom, not device-pixel-ratio emulation or a claim of cross-browser screen-reader certification. Manual screen-reader testing and additional browser engines were not performed.

### Production public-configuration checks

The following commands run from `apps/frontend`. The `.example` URL is a reserved test fixture, never a claimed Article 4 publication. `fixture-user` and `fixture-password` are synthetic labels, not credentials. All three webpack production builds passed with 63 generated routes, and all three generated-artifact checks passed. The additional default Turbopack build and its artifact check also passed. The final browser checks and screenshots use its standalone output, with the article URL empty and the verified app origin configured.

```bash
# Valid configured HTTPS fixture: exact CTA destination and actual site origin.
NEXT_PUBLIC_SERIES_ARTICLE_04_URL=https://article4-build-test.example/article-four NEXT_PUBLIC_SITE_URL=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app npm run build -- --webpack
ARTICLE4_EXPECTED_ARTICLE_URL=https://article4-build-test.example/article-four ARTICLE4_EXPECTED_SITE_ORIGIN=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app node tests/article4-build-config.mjs

# Embedded credentials: article CTA must be absent.
NEXT_PUBLIC_SERIES_ARTICLE_04_URL=https://fixture-user:fixture-password@article4-build-test.example/article-four NEXT_PUBLIC_SITE_URL=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app npm run build -- --webpack
ARTICLE4_EXPECTED_ARTICLE_URL="" ARTICLE4_EXPECTED_SITE_ORIGIN=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app node tests/article4-build-config.mjs

# Final local production build: no real article publication URL was supplied.
NEXT_PUBLIC_SERIES_ARTICLE_04_URL="" NEXT_PUBLIC_SITE_URL=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app npm run build -- --webpack
ARTICLE4_EXPECTED_ARTICLE_URL="" ARTICLE4_EXPECTED_SITE_ORIGIN=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app node tests/article4-build-config.mjs
```

The checker inspects actual generated Article 4 HTML and sitemap output, and confirms that ten stills are inside the frontend build context. The default `npm run build` used by the Dockerfile was also run successfully with the empty article value and verified app origin. `public/` and `.next/static/` were copied into `.next/standalone/` to reproduce the Docker runner's file layout, then served with `PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js`. This verifies the build command and runner asset layout; it does not replace an actual Docker image build or deployed Cloud Run smoke test. Docker remains unavailable in this environment.

The standalone preparation and checks were:

```bash
NEXT_PUBLIC_SERIES_ARTICLE_04_URL= NEXT_PUBLIC_SITE_URL=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app npm run build
ARTICLE4_EXPECTED_ARTICLE_URL="" ARTICLE4_EXPECTED_SITE_ORIGIN=https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app node tests/article4-build-config.mjs
python3 - <<'PY'
from shutil import copytree
copytree("public", ".next/standalone/public", dirs_exist_ok=True)
copytree(".next/static", ".next/standalone/.next/static", dirs_exist_ok=True)
PY
PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js
# In another terminal, while the server is running:
node tests/article4-standalone-check.mjs
npm run test:browser
node tests/article4-screenshots.mjs
```

[Standalone asset results](screenshots/article4-standalone-check.json) include response types, lengths, and SHA-256 hashes. This execution used macOS with Node 25.8.2; the configured production image is Node 22 Alpine and was not built locally.

### Media component checks with synthetic fixtures

The separate media suite uses the real `TeachingMedia` component, Next Image, React 19 Strict Mode, and the existing Next webpack/TypeScript compiler. Its temporary loopback server serves a generated MP4, a two-frame GIF, and PNG fixtures; the test removes these temporary assets afterward. No fixture is imported as V9 content or added to the app's public assets.

All ten component checks passed: no moving-media request before intent in normal/reduced-motion settings; selected playback with native controls; video pause/source removal on Stop, lesson change, Explore, and step mode; GIF Stop/removal; MP4/GIF failure fallback; keyboard step image/text synchronization; observer failure containment; and still-image fallback. The MP4 was 12,272 bytes and the GIF 85 bytes in this test run. These are component test fixtures, not source-package media or scientific evidence. The two application-level original-media acceptance groups remain blocked and explicitly skipped.

## Screenshots and measured media requests

User-facing viewport captures, all with default sampling inputs:

- [Desktop opening, 1440 × 1100](screenshots/article4-desktop-hero.png).
- [Desktop lesson and live tool, 1440 × 1100](screenshots/article4-desktop-lesson.png).
- [Mobile lesson, 360 × 900](screenshots/article4-mobile-lesson.png).
- [Mobile tool, 360 × 900](screenshots/article4-mobile-tool.png).
- [Mobile results, 360 × 900](screenshots/article4-mobile-results.png).

Full-page captures remain available as `article4-desktop-full.png` and `article4-mobile-full.png`. The browser suite also captures the exercised edge-state page and 200% zoom view for QA. The separate screenshot command positions content below the existing sticky app navigation before capturing viewport images.

[Measured browser resources](screenshots/article4-browser-measurements.json) show ten requested lesson PNGs while visiting all ten lessons: 317,340 encoded body bytes and 320,340 reported transfer bytes in this local run. The first sampling still was 16,672 body bytes. No MP4 or GIF request occurred. These observations establish still-only loading for the available assets; they do not prove real-video playback, GIF Stop, or media-switch cleanup for the missing originals. No complete article HTML or base64 media bundle was requested.

## Build and release procedure

Canonical article URLs for Articles 1, 2, and 4 are forwarded into the frontend Docker builder. Cloud Build accepts `_SERIES_ARTICLE_01_URL`, `_SERIES_ARTICLE_02_URL`, and `_SERIES_ARTICLE_04_URL`; they default to empty. `_SITE_URL` forwards the verified public app origin into sitemap/robots generation. The owner-supplied app root returned HTTP 200 during a read-only network check, so Cloud Build now defaults to `https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app`. Docker and Compose retain `http://localhost:3000` as their local fallback. Values pass through build-step environment variables so URL contents are not inserted as shell code. Root-origin availability does not establish that the new Article 4 route is deployed.

The real Article 4 publication URL is unknown, so its CTA remains hidden. Browser query parameters cannot override article URLs. Changing runtime Cloud Run environment variables alone does not update compiled public configuration.

The repository contains no GitHub Actions deployment workflow. `docs/CLOUD_BUILD.md` describes a GitHub Cloud Build trigger, and `cloudbuild.yaml` deploys services. The latest checked `main` commit has a `google-cloud-build` check named `quantum-computing-app` in project `cloudhub-apptopology-golden`. A gcloud trigger lookup was unavailable because there was no active account, but the GitHub check is evidence that this repository uses Cloud Build. Treat a `main` push as potentially production-deploying, not as an isolated source upload.

No production deployment has been performed. Complete the missing reviewed-media acceptance first, verify the configured trigger/release approval path, then use the normal authorized release process. After deployment, verify the returned public URL, deep links, still/video/GIF/step MIME types and intent-driven requests, canonical article CTA, and existing Articles 1/2, assessment, Build, and Map. Preserve the private worker and existing access configuration. See [proposed publication links](ARTICLE_04_LINKS.md).

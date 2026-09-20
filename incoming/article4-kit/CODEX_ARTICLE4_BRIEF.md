# Codex implementation brief: Article 4 companion in Quantum Foundry

## Outcome

Extend the existing Quantum Foundry application so a reader of Article 4, **There Is No Single Winning Qubit Technology**, can open the matching lesson, change a small assumption, see what changes, and leave with a clear explanation and a reusable learning record.

Use **Article 4 V9** as the editorial source. This is an interactive companion to the article, not a second copy of its entire text and not a hardware-recommendation engine. Preserve the existing public product name, independent-project disclaimer, Cirq-first execution, and full assessment/contract gates.

Implement the first release in the existing repository. Do not stop at writing another plan. Work in small commits; audit the working tree before editing, complete the required release scope below, and report actual checks and limitations.

## 0. Audit scope and source precedence

This brief was prepared from the public repository documentation, retrievable source files, public Series hub, and the supplied V9 publication package. A full local clone and a current commit SHA could not be obtained in the review environment. Some newer companion files named in the documentation were not retrievable through the browser; other source pages were cached at different ages. Consequently this is not a claim of a line-by-line audit of the latest commit.

**Your actual checked-out repository is authoritative for existing code.** V9 is authoritative for the article's wording, examples, assumptions, and technical qualifications. The implementation requirements in this brief are new product decisions. Keep these three sources distinct. Do not restore older V7 claims that V8/V9 corrected.

Start by:

1. Read repository instructions, including any root or nested `AGENTS.md` applicable to the files you change. Read README.md, docs/ARTICLE_COMPANIONS.md, docs/QALS_2_WORKBENCH.md, docs/TESTING.md, and the current deployment/environment documentation.
2. Run `git status --short` and `git rev-parse HEAD`. Record the branch, SHA, and unrelated local changes. Do not reset, overwrite, or commit unrelated work.
3. Locate the actual Series content registry, dynamic route, rendering component, evidence UI, canonical-link helper, assessment-prefill parser, analytics helper, lesson components, and tests. Use symbol/import searches rather than inventing paths.
4. Determine whether Article 4 or an equivalent companion has already been added since the public review. Extend it if so. Do not duplicate routes or implementations.
5. Write `docs/ARTICLE_04_IMPLEMENTATION.md`: current files/functions, observed behavior, new behavior, changes planned, source gaps, test commands, and migration implications. A short audit is sufficient; proceed to implementation unless there is a genuine blocker.

Useful local searches, adjusted for installed shell tools:

```bash
git status --short
git rev-parse HEAD
rg --files -g AGENTS.md -g package.json -g '*series*' -g '*companion*' -g '*trust*' -g '*assessment*'
rg -n 'SERIES_ARTICLES|ArticleCompanion|SeriesArticle|EvidenceRecord|generateStaticParams' apps/frontend
rg -n 'NEXT_PUBLIC_SERIES_ARTICLE|returnTo|prefill|source.*article' apps/frontend .env.example cloudbuild.yaml
rg -n 'trackEvent|/__events__/|PageUsage|LIMITED_TUTORIAL_ONLY' apps packages
rg -n 'getStarterStory|normalizeStarterKey|chemistry|bell_state' apps/frontend/src/lib packages/foundry-core
```

### Existing locations identified by source or repository documentation

| Location | Evidence from review | Intended change |
|---|---|---|
| `apps/frontend/src/content/series.ts` | Explicitly documented as the typed SeriesArticle / ArticleCompanion / EvidenceRecord source; source body not fetched | Add/import Article 4; extend discriminated rendering types if needed; preserve Articles 1 and 2 |
| Existing `/series` and `/series/[slug]` implementation | Routes and static-params convention documented; exact current render files must be resolved locally | Extend the existing handler, index, SEO, and static params, not an independent app |
| `apps/frontend/src/lib/analytics.ts` | Explicitly documented; source body not fetched | Add typed Article 4 events using the current interface |
| `apps/frontend/src/app/build/page.tsx` | Source retrieved, potentially older than companion docs | Inspect tutorial URL handoff; do not transplant old code or replace this large page |
| `apps/frontend/src/lib/studio-mocks.ts` | Source retrieved; chemistry is explicitly a toy/placeholder in this version | Do not use fallback histograms or scores as article experiment evidence |
| `apps/frontend/src/lib/api.ts` and `apps/frontend/src/types/api.ts` | Existing source locations/imports confirmed | Reuse existing API contracts; modify only if a narrowly justified handoff requires it |
| `packages/foundry-core/src/foundry_core/assessment/qals.py` | Rule-engine location documented | Preserve server-owned eligibility; no Article 4 bypass |
| `apps/frontend/package.json` | Retrieved version has dev/build/start/lint and React/Next/TS/Recharts/Framer Motion | Reuse dependencies; check current test tooling before adding a dev-only runner |
| `cloudbuild.yaml`, `apps/frontend/Dockerfile`, `.env.example` | Pipeline/build-context locations confirmed | Thread canonical Article 4 URL at frontend build time if needed; no access-policy changes |
| `scripts/check-frontend-access.sh` | Referenced by retrieved Cloud Build pipeline | Keep access checks; add Article 4 route/media smoke coverage using actual script interfaces |

Do not assume the exact schema or component filenames from this brief. The new filenames proposed later are suggestions, not assertions that those files exist.

## 1. Product scope: what must ship

### Release A: usable article companion

Ship all of the following before linking from the article:

- One public companion at **`/series/04-qubit-technologies`**, unless an already-published equivalent URL exists. In that case retain it and document any alias.
- A matching Series card, home-page/learning discovery link where appropriate, SEO metadata, sitemap entry, and static explanatory content visible without JavaScript.
- The two article scenarios: catalyst/energy-estimation learning and the five-job scheduling example. Readers must not supply their own workload to start.
- Ten existing V9 teaching animations with stills and individually inspectable steps.
- Optional purple **Level 400 — Technical explanation** panels; Level 100 works without opening them.
- Four live learning tools: sampling versus bias, five-job scheduling, illustrative routing, and optical phase/loss. The optical tool contains two separate calculations, not one combined success score.
- A concise, non-ranked technology comparison drawn from V9; a separate algorithm comparison distinguishing VQE, SQD, QAOA, analog MIS, and demanding QPE.
- A local JSON and Markdown learning-record export, clearly separate from an approved Algorithm Contract or benchmark result.
- Validated deep links, safe canonical article links, accessibility, and regression tests.

### Release B: optional follow-on, not a launch dependency

- Make the phase/Bloch, Bell-versus-mixture, transmon, ideal XX, and conditional-blockade scenes parameterized using the exact models in V9. Initially their reviewed animations and equations are sufficient.
- Attach educational context to an existing saved session only after checking the application's actual authorization and ownership controls. No new public persistence endpoint for this release.
- Add more substantive Cirq chemistry or optimization experiments only as separately scoped work with an explicit model and a tested classical reference.

### Out of scope

No public QPU adapters; no new ADK/LangGraph agent; no replacement architecture; no hardware marketplace; no best-modality score; no automatic vendor ranking; no ROI or quantum-advantage probability; no global physical-to-logical conversion calculator; no claim that a toy simulator is a calibrated device emulator. No production auth changes, new cloud services, billing changes, or database migrations are necessary for Release A.

## 2. Entry experience and navigation

Use the existing Series shell, header, disclaimer, and design system. Add an Article 4-specific renderer/component only if the current generic renderer cannot express the lessons cleanly.

Suggested visible introduction:

> **Which quantum machine is worth testing for your problem?**
> Follow the article's chemistry and scheduling examples. Change one assumption, inspect the result, and see why a faster gate or a larger qubit count is not the whole answer.

Offer three small entry cards:

1. **Understand a chemistry experiment** — begins at sampling.
2. **Try the five-job scheduling example** — begins at scheduling.
3. **See how the four machines work** — begins at the hardware lesson selector.

Each learning view should show:

- One plain question, e.g. “Will more measurements fix a biased estimate?”
- A compact explanation, typically one or two natural paragraphs.
- One large active scene, not ten animations running on a long page.
- **Watch / Step through / Explore** modes; Explore appears only when the lesson has a live model.
- A result sentence that changes with the controls and explains the consequence.
- **What this shows / What this does not show** in brief, visible copy.
- An optional Level 400 panel beside or below the same scene.
- A source/provenance disclosure and relevant next action.

Preserve the article's reasoning. Do not replace its nuanced recommendations with “ions = chemistry” or “atoms = logistics.” Keep “My take” editorial judgments visibly separate from modeled results and published measurements.

Suggested deep-link interface, scoped only to this companion:

```text
/series/04-qubit-technologies?lesson=sampling&level=100
/series/04-qubit-technologies?lesson=scheduling&level=100
/series/04-qubit-technologies?lesson=routing&level=100
/series/04-qubit-technologies?lesson=photonics&level=400
/series/04-qubit-technologies?lesson=loss&level=100
```

Use the existing query parser/navigation utilities where possible. Allowlist lesson ids and levels (100 or 400); validate any numeric parameters. A missing or invalid lesson opens a safe default with a small notice if needed. Support reload, copy-link, and browser Back/Forward without losing the selected lesson. Do not accept redirect destinations or remote asset URLs from query parameters.

Use `article4-v9` only as a content revision, not part of the durable route. Exports record the precise revision. Share links that include parameters must also include a supported model version or resolve to a stable default; never silently reinterpret an old model's inputs.

## 3. Source content and media import

The handoff folder `article4-v9/` contains the original V9 main article, technical companion, reference registry, editorial notes, media manifest, and media assets. Their original bytes are preserved. It also contains a generated integrity manifest and independent numerical fixtures for this proposed companion.

### Do not embed the self-contained HTML file

The original self-contained HTML is **30,522,209 bytes**, because it embeds media. The ten MP4s total **1,223,622 bytes**; the GIFs total **16,241,470 bytes**. Importing that entire HTML into React would duplicate the site shell, create avoidable load, and make lessons harder to share and maintain.

Use the repository's content components and import only the relevant editorial content. Do not use an iframe, base64 video strings, or a large `dangerouslySetInnerHTML` insertion. Do not parse DOCX at runtime. The source Python media script is a reference for the teaching models, not application code to execute on user input.

Suggested published asset path:

```text
apps/frontend/public/articles/04-qubit-technologies/v9/
```

The existing frontend build context is `apps/frontend`. Assets must be inside that context or explicitly included by its build process. Do not put required assets only in a root `docs/` directory that the frontend image cannot see.

### Exact lesson/media ids

| Lesson id | Main lesson | Media stem |
|---|---|---|
| `sampling` | Uncertainty versus a persistent offset | `sampling` |
| `scheduling` | Equipment conflicts and a valid selection | `scheduling` |
| `transmon` | A pulse changes circuit state, not chip position | `transmon` |
| `ions` | Shared motion and internal quantum states | `ions` |
| `routing` | State exchanges versus physical transport | `routing` |
| `blockade` | The same target pulse with/without a shifted transition | `blockade` |
| `photonics` | Relative phase and detector probabilities | `photonics` |
| `loss` | Path survival versus quality on detected events | `loss` |
| `phase` | Bloch-sphere phase and analysis measurements | `phase` |
| `entanglement` | Bell state versus a classical mixture | `entanglement` |

Each stem has:

```text
<stem>.mp4
<stem>.gif
<stem>.png
<stem>_step1.png ... <stem>_step4.png
<stem>_print.png
```

Use `<stem>.png` or a selected step as the poster. Use print layouts for exports only. Use `cover.png`/`cover_art.png` only as editorial art with the existing AI-generated-concept-art disclosure; do not present it as a hardware photograph.

### Media component behavior

- Default to a still/poster, with no moving content until the reader chooses Play or GIF.
- MP4 is the normal playback mode. Use native controls, `playsInline`, a poster, and `preload="none"`.
- Assign/load the selected video source only on intent; do not request all ten MP4s and GIFs when the page opens.
- Explicit GIF mode swaps in the GIF; returning to still/step mode removes it. A visible Stop action is required because animated GIFs do not have native pause controls.
- Pause and unload moving content when switching lessons. Respect reduced-motion preferences and avoid autoplay even when reduced motion is off.
- Each step has accessible text beneath the image. Do not require readers to decipher text baked into a wide image on a phone.
- Provide keyboard controls, visible focus, labeled buttons, responsive layouts, stable aspect ratios, and a static fallback when media fails.
- Captions identify whether the scene is conceptual, an ideal calculation, or a schematic probability model. They must never say “hardware measured.”
- Video/GIF presets and live parameterized scenes are different modes. Do not change a slider while continuing to show a prerecorded clip that disagrees with the live values. On input, switch to the live SVG/canvas scene and show its own result table.
- Keep SVG/canvas outputs numerically synchronized with accessible text. Native SVG, existing Recharts, and the current animation library are sufficient; do not add a large 3D framework for this release.

## 4. Live lesson specifications and numerical contracts

Keep the math in pure, tested TypeScript functions shared by visualization, labels, and local export. Do not hide calculations inside animation timing callbacks. These educational calculations run in the browser; they do not need API calls, job rows, Cloud Tasks, GPUs, or an LLM.

### 4A. Sampling versus bias

Question: **Will more measurements fix a biased estimate?**

Inputs: number of independent samples N, a chosen fixed offset b, and a stated finite single-sample variance. Use normalized teaching units, not fabricated molecular-energy measurements or actual vendor error rates.

Outputs:

```text
standard_error = sqrt(variance / N)
expected_estimate = reference + b
mean_squared_error = b*b + variance/N
```

Show reference-centered and shifted sample-mean distributions; label any equal-height density drawing as schematic/height-normalized. Changing N narrows the distribution but does not move its expected center. Changing b moves the center. An optional target band can show whether the toy model's offset alone exceeds an illustrative target, not whether a real chemistry calculation is validated.

Default options N=100, 1,000, 10,000. If variance=1, N=100 gives standard error 0.1 and N=10,000 gives 0.01. With b=0.2, the center remains reference+0.2. A tenfold reduction in standard error requires 100 times the samples under this independent-sample model.

Keep VQE, SQD, and QPE explanations separate. Sampling alone is not a VQE optimizer, an SQD eigensolver, a QPE implementation, or a catalyst calculation. A hardware gate infidelity cannot be used as b without a justified observable/noise model.

No synthetic observations are needed for this release; analytic predictions avoid unnecessary stochastic testing. If sampled dots are added, use a reproducible seed and label them synthetic.

### 4B. Five-job scheduling

Question: **Which jobs can share one time slot without using the same equipment?**

Use exactly the article's dataset:

| Job | Required equipment |
|---|---|
| A | Press, inspection |
| B | Press, drill |
| C | Drill, mill |
| D | Mill, oven |
| E | Oven, inspection |

Derive conflicts from shared equipment; do not maintain an independent hard-coded graph that can drift. Edges are AB, BC, CD, DE, EA.

Interaction: selecting a job highlights its equipment. An invalid pair highlights the actual shared item and graph edge. Show selection size and conflicting pairs. Provide a “Check all choices” action that enumerates the 32 subsets and explains that this small problem is solved classically.

Expected behavior: A+B invalid (press); A+C valid; maximum size 2; there are five maximum selections: AC, AD, BD, BE, CE. Three selected jobs are never feasible for this graph.

Optionally expose the classical unweighted penalty objective in Level 400:

```text
cost(x) = -sum(x_i) + M * sum(x_i*x_j over conflict edges)
M = 2 for the default example
```

At this penalty, every global minimizer is a size-2 independent set. Do not imply the neutral-atom experiment deterministically solves the graph or that arbitrary industrial schedules map directly to an atom layout. Present the blockade scene as a separate explanation of a relevant interaction, not a QPU execution of the selections.

Do not label the app's existing `routing` QAOA-style template as this exact MIS experiment without actually implementing, testing, and preserving the mapping. The standalone classical lesson does not require adding a new worker starter.

### 4C. Routing versus transport

Question: **Why can one requested interaction require extra work?**

First show fixed sites containing A, X, and B. Move the **state labels** A and X during a SWAP while sites remain fixed. The endpoint is X,A,B, so A and B are adjacent. A separate lane can show a conceptual QCCD transport sequence. Do not represent transport as the same physical operation as a SWAP.

Expose the article's deliberately simplified accounting:

```text
local_two_qubit_gate_count = 3*k + 1
local_gate_only_duration = (3*k + 1) * t_local
illustrative_direct_gate_only_duration = t_direct
```

Here k is the number of SWAPs in this particular CNOT-based strategy, with no restoration of the original placement. Use bounds such as k=0..5. Defaults t_local=0.2 and t_direct=1.0 are arbitrary time units, not provider measurements.

Golden results: k=1 gives 4 gates / 0.8 units; k=2 gives 7 gates / 1.4 units. State explicitly that native decompositions, initial placement, gate fusion, parallelism, transport, readout, and error are omitted. Do not call the count a compiler lower bound or the duration an application benchmark. No fidelity or energy-bias calculation follows automatically from this example.

### 4D. Photonic phase and loss

Treat these as two linked but separate panels.

**Phase panel**:

```text
P(D0) = cos(phi/2)^2
P(D1) = sin(phi/2)^2
```

Use the article's balanced lossless convention. Slider phi=0..pi, with buttons 0, pi/2, pi. Expected outputs 1/0, 0.5/0.5, 0/1. Show mode amplitudes, not two copied photons; each parameter setting refers to fresh preparations. This is a one-qubit lesson, not a universal photonic processor.

**Loss panel**:

```text
eta_path = eta_1 * eta_2 * eta_3 * eta_4
expected_detections = launches * eta_path
```

Each efficiency is conditional on reaching that stage and is bounded 0..1. Defaults 0.9,0.9,0.9,0.9 with 100 launches give 0.6561 and 65.61 expected detections. Show expected loss at each stage. Label fractional counts as expectations; observed counts would be integers.

Do not multiply a conditional gate fidelity into eta_path or label it the probability that an application is correct. Changing optical loss changes delivery in this toy model, not the ideal conditional state fidelity. Do not install a universal “fault tolerant / not fault tolerant” threshold light based on this four-stage example.

### 4E. Advanced scenes retained, not overclaimed

Release A retains the reviewed media and Level 400 text for these scenes. If parameterizing them, port the source models and test them:

- Phase: an equatorial pure qubit has Z probabilities 1/2 for all phi; after H, P(0)=(1+cos(phi))/2. The Bloch arrow is a state coordinate, not an electron orbit. Two Bloch arrows do not represent a complete entangled state.
- Bell comparison: plus Bell state and 00/11 mixture share Z/Z statistics. At X/X the former has only matching outcomes; the latter has all four equally likely. Intermediate common X–Z-plane measurement axes use the correlations given in V9. At intermediate angles label outcomes for the **selected axes**, not as final X eigenstates. This is not an automatic entanglement certificate from uploaded counts.
- Ideal ion XX endpoint: (|00>-i|11>)/sqrt(2) has ZZ=1, XX=0, XY=YX=-1. Do not copy the plus-Bell X/X interpretation to this differently phased state.
- Transmon: an ideal rotation is not a numerical simulation of pulse leakage or readout. Keep the transmon Hamiltonian/DRAG explanation in the deep section, with its assumptions.
- Blockade: use V9's conditional two-level target model. For dimensionless detuning ratio 8, maximum excitation is 1/65, not exactly zero. Distinguish this model from a full two-atom CZ gate and from analog MIS dynamics.

The file `golden-fixtures.json` contains exact small examples for regression. It is a set of test expectations derived from V9/elementary calculations, not a dataset of device measurements.

## 5. Shared content, sources, and result types

Extend the existing typed registry rather than creating a CMS. Suggested new module boundaries, **only if no equivalent exists**:

```text
apps/frontend/src/content/article4.ts
apps/frontend/src/components/article4/Article4Companion.tsx
apps/frontend/src/components/article4/TeachingMedia.tsx
apps/frontend/src/components/article4/SamplingExplorer.tsx
apps/frontend/src/components/article4/SchedulingExplorer.tsx
apps/frontend/src/components/article4/RoutingExplorer.tsx
apps/frontend/src/components/article4/OpticsExplorer.tsx
apps/frontend/src/components/article4/ComparisonNotebook.tsx
apps/frontend/src/lib/article4/models.ts
apps/frontend/src/lib/article4/state.ts
apps/frontend/src/lib/article4/export.ts
```

Split models further only when useful. These are proposed files, not files verified in the repository. Prefer extending an existing reusable component over introducing a nearly identical one.

Use stable module ids and article-revision metadata. Reuse `EvidenceRecord` where its semantics fit. A companion lesson should keep distinct:

- physical mechanism / modality being explained;
- algorithm or execution paradigm;
- source experiment and publication status;
- reviewed date from the editorial source;
- local implementation availability;
- toy model vs actual Cirq execution.

A provider name in the article is not an enabled backend. A modality selector must be labeled “Technology being explained,” never “Run on” unless there is a separately authorized, implemented execution path.

For lesson outputs, use a lightweight teaching disclosure with origin, assumptions, model version, sources, and limitations. Avoid a full hardware Result Trust panel full of irrelevant blank fields on a conceptual diagram. Do not assign “medium confidence” or “measured” to a schematic. If a real simulator run is launched, use the existing Result Trust and record its actual backend, parameters, software context, and run id.

Keep the 41 V9 references with stable ids. Cite only the sources supporting the current lesson; preserve the article's qualifiers. Do not change source review dates merely because content was imported. Separate “imported on” from “scientifically checked on.” Do not scrape vendor pages during the user session or synthesize capabilities with an LLM.

## 6. Comparison notebook and safe handoff

The learning record is an export of what the reader explored, not a hardware recommendation or an approved contract.

Suggested fields (adapt naming to current conventions):

```text
schemaVersion
articleId / articleRevision
companionVersion
lessonId / scenarioId
modelId / modelVersion
parameters and units
seed, if synthetic samples were generated
results and units
assumptions
omittedFactors
sourceIds and sourceReviewDates
selectedApproaches (optional; not ranked)
questionsToInvestigate
createdAt
```

Export JSON for reproducibility and Markdown for a readable note. Export model outputs even when they are zero; preserve units, and do not substitute data from a demo histogram. Avoid serializing secrets, chat history, or arbitrary form fields. Free-form notes can stay local but must not be included in shared URL query strings or analytics.

**Continue to Assess** transfers only validated context that the existing assessment schema understands. Reuse the local allowlist/parser and extend its source union for Article 4 where needed. The catalyst illustration is not a user-provided molecule, Hamiltonian, reference energy, baseline measurement, or business case. Do not prefill invented scientific evidence to make the form look complete. Label imported context as an educational example and require explicit user confirmation before any submission.

**Try a Cirq tutorial** may use an existing tested starter. The retrieved source confirms `bell_state`, `coin_flip`, `grover`, `routing`, and `chemistry`, but inspect the current implementations before choosing destinations. In the retrieved version, chemistry is an ansatz placeholder, not a molecular-energy solver. Use precise CTA copy such as “Open a separate Bell-state simulation” or “Inspect the chemistry circuit sketch.” Do not claim it runs the catalyst example. Do not silently send a scheduling lesson into unrelated routing optimization.

The article's VQE/SQD/QPE selector is explanatory until those methods have real, tested execution implementations. It must not set backend enums or claim to launch nonexistent experiments.

Keep Quick Assessment distinct from Full QALS. Only the existing server-side assessment/contract workflow can authorize serious Build, and the worker must continue revalidating it. Imported lesson records cannot unlock Build or override missing-baseline restrictions.

## 7. Canonical article links and discovery

Add **`NEXT_PUBLIC_SERIES_ARTICLE_04_URL`** following the existing Article 01/02 convention, unless the current repository has replaced this with an equivalent registry-based configuration. Accept only a trusted configured HTTPS URL. Its default is empty because the Article 4 Substack publication URL has not been supplied. Empty/invalid values hide “Read the article”; the lab still works. Do not substitute Article 1 or fabricate an Article 4 URL.

Check the full build path. In the retrieved Cloud Build configuration, frontend Docker build explicitly forwards `NEXT_PUBLIC_API_URL`; canonical Article URL variables were not present there. Verify the current file before changing it. Public Next.js build-time values must reach `next build`, not merely a later Cloud Run runtime setting. Thread the Article 04 value through the frontend build arguments/environment as required, update `.env.example`, and test both configured and empty cases.

Keep the existing canonical app-origin handling. Do not hard-code an old Cloud Run revision URL into source. After deployment, publish the exact returned frontend URL plus the stable companion route.

Add discoverability without creating another top-level navigation product. Extend `/series`, link from the existing software-stack/hardware-related learning surface if appropriate, and replace “Articles 1 and 2” with wording that reflects the available companions. Do not claim Article 3 exists merely to make numbering consecutive.

Generate `docs/ARTICLE_04_LINKS.md` with tested destination URLs and the article copy in Section 11 below. These links are **proposed until the deployed endpoints pass smoke tests**.

## 8. Analytics and basic security

Use the existing typed `apps/frontend/src/lib/analytics.ts` abstraction and usage/event convention. Check the actual types first. Suggested new event names:

```text
article4_open
article4_lesson_open
article4_media_play
article4_exploration_complete
article4_note_export
article4_assess_continue
article4_article_return
```

Payloads contain only allowlisted article/version/lesson ids, level, display mode, and coarse source channel (for example Substack/LinkedIn/direct). No personal workload text, free-form notes, full query strings, source document content, or chat prompts. Do not send an event on every animation frame or slider tick; throttle meaningful interaction completions. Failures must not block learning.

Validate numeric controls with finite-number checks and bounds. Never use eval or arbitrary code execution. Keep asset URLs within a reviewed same-origin path or an explicit configured allowlisted asset origin. Do not add public writes to projects or sessions unless existing ownership safeguards can be demonstrated.

## 9. Testing and release acceptance

Inspect the current test stack. The package.json retrieved in the review had no frontend `test` script, so do not assume one. Reuse a current runner; if absent, add a small dev-only unit-test runner and a browser test setup. Keep production dependencies unchanged unless justified.

### Numerical unit tests

- Scheduling: derived edges match the shared-equipment data; AB invalid; AC valid; exhaustive maximum 2 and five maximizers; all 32 masks agree with exported results.
- Sampling: 100x N produces 10x smaller standard error; chosen bias does not move with N; MSE respects b²+variance/N; reject nonfinite inputs.
- Routing: mapping A,X,B becomes X,A,B after one exchange; k=1 and k=2 produce the stated count/duration; no implication of layout restoration.
- Optics: phase outputs at 0,pi/2,pi; probabilities nonnegative and sum to 1; four 0.9 stages produce .6561; zero-efficiency and unit-efficiency edges behave correctly.
- Advanced parameterized scenes: phase/Bell/XX/blockade fixtures where implemented. Analytic model tests do not certify device physics.

### Content and interaction tests

- Series lists Article 4 once, and Articles 1 and 2 still work.
- Every registered lesson has a title, default still, four steps, source ids, limitation, model classification, and available media files.
- Production builds resolve every media path. Check integrity manifest and correct MIME types.
- Deep-link reload and Back/Forward preserve valid context. Invalid lesson/level/numeric values do not crash or produce unsafe navigation.
- Level 400 can be opened/closed with keyboard and read using assistive technology.
- Reduced motion starts with stills; no media autoplays; GIF Stop works; changing lesson stops the previous video.
- Only selected/intended moving media is fetched, not the complete bundle.
- Live sliders update the native scene and results, not a mismatched prerecorded clip.
- JSON/Markdown exports reproduce the chosen toy inputs/outputs and disclaimers.
- Article link hidden for empty/invalid canonical URL, correct for configured HTTPS URL.
- Assessment and worker eligibility tests remain unchanged and passing; no baseline or evidence is fabricated during handoff.
- At 390px width, no page-level horizontal overflow; controls and result text remain readable. Do not rely only on shrinking a desktop image.
- Simulate unavailable backend: educational page and local models still work; optional real simulation CTA reports its error normally.

### Existing documented commands

Resolve current environment and prerequisites before running:

```bash
make test
cd apps/frontend
npm run lint
npm run build -- --webpack
cd ../..
git diff --check
```

The repository also documents a direct Python path-based pytest command. `make test` is preferred if it covers the current core/backend/worker suites. Run the new frontend model tests and browser tests using the scripts you actually add or find. Report missing dependencies and skipped tests rather than claiming a pass.

### Deployment checks

Do not deploy to production without the normal user-approved release procedure. Do not change IAM, IAP, CORS, worker privacy, or access mode to make a screenshot succeed. Once deployed through the existing pipeline, verify in a signed-out browser: companion URL, deep-linked lesson, still, MP4, GIF, canonical return link, no-auto-play behavior, and a relevant tutorial/assessment handoff. Confirm the worker remains private.

## 10. Suggested commit sequence and implementation report

1. **Content and media foundation:** audit, typed article entry, reuse Series renderer, source registry, media player, stable URLs, canonical URL plumbing. All ten lessons readable and watchable.
2. **Live models and learning record:** four learning tools, golden tests, safe share state, JSON/Markdown export, honest comparison/algorithm views.
3. **Integration and quality:** assessment/tutorial handoff, analytics, route/media smoke tests, mobile/reduced-motion QA, documentation and publish links.

At each checkpoint, provide a runnable state. At completion report: starting SHA, files changed, existing features reused, newly introduced components, actual test outputs, screenshots, measured network/media load, links tested locally, and links still awaiting deployment. Explicitly list anything not implemented. Do not say all ten lessons are live simulations: only the implemented models are interactive, and all remain educational unless separately executed through the real simulator.

## 11. Article copy and links to add after release verification

Keep Substack as the article; use a few contextual links instead of replacing it with the app or embedding the whole app in an iframe.

**Near the reading guide:**

> Explore the examples in Quantum Foundry. You can replay each explanation, inspect the steps, and change a few assumptions. These are educational models, not measurements from quantum hardware.

Destination: `/series/04-qubit-technologies`

**After the sampling figure:**

> Try this yourself: increase the number of measurements and watch the uncertainty shrink. Then add an offset and see why a more precise answer can still be wrong.

Destination: `?lesson=sampling&level=100`

**After the scheduling figure:**

> Choose jobs A through E and see which equipment conflicts. The app checks this small example classically, so you can inspect the answer before considering a quantum mapping.

Destination: `?lesson=scheduling&level=100`

**After the routing discussion:**

> Compare the extra work. Change the number of state exchanges and inspect the operation count under the stated teaching model.

Destination: `?lesson=routing&level=100`

**After the photonics discussion:**

> Change the phase to see how the ideal detector probabilities change. Then open the separate loss lesson to count how much light reaches the detectors.

Destinations: `?lesson=photonics&level=100` and `?lesson=loss&level=100`

**At the conclusion:**

> Save a note of the assumptions you explored and the questions you would ask before choosing a machine. The companion helps frame an evaluation; it does not choose a winning technology for you.

Destination: companion comparison-note view after it is implemented.

## Review sources

### Repository/public application sources inspected

- Repository README and root: https://github.com/nikhiljethava/quantum-computing
- Companion documentation: https://github.com/nikhiljethava/quantum-computing/blob/main/docs/ARTICLE_COMPANIONS.md
- QALS gates and contracts: https://github.com/nikhiljethava/quantum-computing/blob/main/docs/QALS_2_WORKBENCH.md
- Testing instructions: https://github.com/nikhiljethava/quantum-computing/blob/main/docs/TESTING.md
- Architecture documentation: https://github.com/nikhiljethava/quantum-computing/blob/main/docs/ARCHITECTURE.md
- Build source: https://github.com/nikhiljethava/quantum-computing/blob/main/apps/frontend/src/app/build/page.tsx
- Starter source: https://github.com/nikhiljethava/quantum-computing/blob/main/apps/frontend/src/lib/studio-mocks.ts
- Package metadata: https://raw.githubusercontent.com/nikhiljethava/quantum-computing/main/apps/frontend/package.json
- Build pipeline: https://github.com/nikhiljethava/quantum-computing/blob/main/cloudbuild.yaml
- Public Series index: https://quantum-foundry-frontend-271301686744.us-central1.run.app/series

These browser results were not all tied to the same commit. Do not assume an old source page overrides a newer checked-out implementation or current tests. The briefing itself did not execute the application's tests, deploy a change, or run a QPU/simulator job.

### Article sources

Supplied Article 4 V9 package: `source/main.md`, `source/technical.md`, `source/references.json`, `media/manifest.json`, `source/make_media.py`, and `V9_Accuracy_and_Editorial_Notes.md`. The publication's references and numerical limitations are retained in the handoff. Media integrity and small numerical fixtures were checked during preparation of this kit; the application implementation and deployment still require the tests above.

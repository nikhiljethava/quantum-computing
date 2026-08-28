# Article Companions And Contract Journey

Quantum Foundry is an independent personal project, not an official Google product. Its public journey is:

```text
Read an idea -> understand it visually -> try a guided example -> assess a real problem -> create an Algorithm Contract -> receive an honest next decision
```

The article companions teach and demonstrate. They never replace the deterministic assessment or silently unlock a serious experiment.

## Public Surfaces

- `/series` lists the published companion experiences.
- `/series/01-platform-problem` explains the seven layers around a quantum processor.
- `/series/02-hybrid-computing` compares batch, iterative, tight-feedback, and future-integrated workflows.
- `/learn/quantum-software-stack` explains framework, domain library, compiler/IR, simulator, runtime/backend, and QPU roles.
- `/assess` starts with Quick Assessment and can continue to the full Readiness and Algorithm Contract.
- `/build` exposes Tutorial and Contract modes in the Algorithm Experiment Workspace.

## Content And Evidence Model

`apps/frontend/src/content/series.ts` is the small typed content source. It defines `SeriesArticle`, `ArticleCompanion`, `EvidenceRecord`, the interactive platform layers, and hybrid interaction models. This intentionally avoids a CMS and keeps the two first-release companions reviewable in source control.

Each evidence record names its source type, organization, supported claim, result type, verification date, and limitations. A personal analysis or tutorial record is not presented as a peer-reviewed or independently reproduced result.

## Quick Versus Full Assessment

Quick Assessment asks seven shape-finding questions and produces only a likely contract type, likely algorithm family, likely horizon, missing evidence, and next action. Its mapping is deterministic, but it is not QALS and it has no persistence or Build-unlock API.

The full Readiness and Algorithm Contract is the authoritative QALS 3.0 flow. Existing backend rules own verdict, confidence, readiness score, trust labels, contract validity, and Build eligibility. Safe handoff transfers only validated problem context and user-entered fields; it does not inject sample evidence or bypass a hard gate.

## Build Modes And Result Trust

Tutorial mode runs prepared examples without a contract. Results and exports remain labeled `TUTORIAL` or `TOY_SIMULATION` and cannot become business recommendations.

Contract mode requires an assessment and a valid or partially valid Algorithm Contract. Backend services and the worker revalidate the baseline and algorithm-specific requirements before serious compute proceeds.

Result Trust distinguishes Tutorial, Simulation, Estimated, Hardware Measured, Vendor Reported, Independently Reproduced, and Unknown results. It records execution metrics, simulator or hardware identity, evidence source, baseline status, dates, claim status, trust labels, provenance, assumptions, missing evidence, and caveats. Simulation output is never labeled as hardware measurement.

## Safe Canonical Article URLs

Configure optional canonical links at frontend build time:

```bash
NEXT_PUBLIC_SERIES_ARTICLE_01_URL=https://example.substack.com/p/article-one
NEXT_PUBLIC_SERIES_ARTICLE_02_URL=https://example.substack.com/p/article-two
```

Only absolute HTTPS values are accepted. Empty or invalid values hide the external article CTA. Do not add `returnTo` handling or accept a destination from a browser query string.

## Adding An Article Companion

1. Add a `SeriesArticle` and matching `ArticleCompanion` entry in `apps/frontend/src/content/series.ts`.
2. Use a stable slug and add it to `generateStaticParams` through the shared `SERIES_ARTICLES` array.
3. Add simple and technical explanations, one guided example, glossary entries, and evidence records.
4. Keep guided examples tutorial-only and use an existing tested starter id.
5. Add only allowlisted assessment defaults and extend the validation union before accepting a new source value.
6. Add the route to the sitemap, public access script, and companion contract tests.
7. Verify keyboard interaction, mobile layout, copy accuracy, and the hidden-CTA state with no canonical URL.

## Adding Evidence

Add an `EvidenceRecord` next to the claim it supports. Choose the narrowest accurate source type, link directly to the source when available, record the organization and verification date, and explain what the source does not establish. Vendor-reported evidence must remain visually and semantically distinct from independently reproduced evidence.

## Why Cirq-First And Simulator-First

Cirq is the existing tested circuit and export path. qsim and OpenFermion remain supported where the worker already exposes them. Other frameworks on the software-stack page are educational examples, not executable integrations.

Simulation is the default because prepared examples are for learning and benchmark design. Hardware is optional, separately approved, access-controlled, and never exposed as a public default. Broad fault-tolerant capability has no firm product date, so hardware-gated and future-only claims retain explicit horizons and caveats.

## Analytics

`apps/frontend/src/lib/analytics.ts` provides a typed event interface and persists events through the existing usage endpoint. Product events use the `/__events__/` namespace so they do not inflate ordinary page-view totals. Event failures never block a user journey.

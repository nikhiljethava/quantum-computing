# Beyond the Quantum Processor: App Gap Analysis And Merged Release Delta

Quantum Foundry is an independent personal educational and prototyping project. It is not an
official Google product and is not affiliated with, sponsored by, endorsed by, or maintained by
Google LLC. Google Cloud and Google Quantum AI product names are used descriptively.

## Audit Scope

This audit covers the current Next.js frontend routes and shared components, FastAPI schemas and
routes, SQLAlchemy models and Alembic migrations, the QALS 3.0 deterministic Algorithm Contract
engine, Build and Map services, artifact exports, worker jobs, PageUsage analytics, and the existing
pytest, ESLint, and Next.js build checks.

## Existing Foundation

- The public route set already includes Learn, Explore, Assess, Build, Map, Projects, Saved
  Sessions, Jobs, About, and public use-case detail pages.
- QALS 3.0 already produces deterministic verdicts, Algorithm Contract fields, classical-baseline
  gates, build eligibility, time horizons, assumptions, missing evidence, caveats, and trust labels.
- Serious Experiment Bundle creation is enforced in FastAPI service code. Blocked and
  tutorial-only contracts cannot create a serious bundle.
- Tutorial Cirq templates already run without an assessment and persist simulator metrics,
  educational-noise metadata, trust labels, and caveats.
- Architecture maps, artifacts, simulations, and memo exports already use the existing backend,
  worker, storage, and job abstractions.
- PostgreSQL already stores assessments, Algorithm Contracts, Experiment Bundles, circuit runs,
  architecture records, artifacts, jobs, sessions, projects, use cases, and PageUsage records.
- The About page and global independent-project notice already contain the required non-affiliation
  language.

## Phase 0 Gap Matrix

| Area | Existing capability | Gap | Proposed implementation | Affected files | API or schema impact | Migration impact | Test impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public homepage | Workbench-focused hero, Learn/Explore/Assess/Build/Map journey, concept cards, global disclaimer | First-time readers are asked to qualify a workload before learning; the hero copy is workbench-first; the primer copy overstates superposition and entanglement; no article-series companion section or returning-user continuation | Make Quantum Foundry and the independent-project badge the first signal; provide Primer, Explore, and Workbench entry paths in that order; add the article companion and trust statement; show a client-side continue action when saved learning or session context exists | `apps/frontend/src/app/page.tsx`, new returning-user helper component, learning/session storage helpers | No API change; reuse current browser-local learning/session state | None | SSR copy regression, homepage disclaimer/CTA checks, route smoke test, responsive browser QA |
| Quantum primer | Beginner lessons cover qubits, superposition, measurement, entanglement, interference, and amplitude amplification | Homepage calls four items universal pillars; approved technical caveats are absent; noise/error correction and present-versus-future maturity are not first-class primer concepts | Rename to Core quantum concepts; add seven responsible plain-English concepts and optional detail drawers; update beginner lesson copy and Grover wording | `apps/frontend/src/app/page.tsx`, `apps/frontend/src/content/lessons.ts` | No API change | None | Copy regression for required concepts and prohibited claims; lesson route smoke tests |
| Build modes | Empty state links to assessment or a tutorial; tutorial templates have educational labels; backend gates serious bundles | Modes are implicit; any starter query opens the same workspace; serious and tutorial language are mixed; legacy QALS-lite preview dominates a sidebar; export preview does not clearly distinguish educational artifacts | Add an explicit Tutorial Lab / Contract Experiment segmented control; allow tutorial mode without assessment; block Contract Experiment UI without assessment + contract + bundle context; keep backend gating authoritative; carry contract context and show educational export disclaimer | `apps/frontend/src/app/build/page.tsx`, `apps/frontend/src/app/build/layout.tsx`, shared trust component; selected backend copy/services for tutorial labels | Add optional `mode` query only; no breaking endpoint change | None for mode UI | Service tests for tutorial/no-contract and serious gate; source/route regression; browser flows for both modes |
| Result trust | Circuit runs and Experiment Bundles already expose backend, qubits, depth, gates, shots, ideal/noisy mode, noise model, hardware label, labels, and caveats; assessments expose verdict/evidence context | Trust presentation is duplicated and incomplete; no common evidence category, provenance, generated timestamp, baseline status, contract status, or software version; Map and Saved details do not use one shared panel | Add one reusable `ResultTrustPanel`; add an additive `ResultTrustRead` API shape; normalize assessment, circuit, bundle, architecture, and artifact trust context; explicitly label generic noise educational, never calibrated | New `apps/frontend/src/components/trust/ResultTrustPanel.tsx`, `apps/frontend/src/lib/result-trust.ts`, `apps/frontend/src/types/api.ts`, Assess/Build/Map/Saved pages, backend schemas and serializers | Add optional/additive `result_trust` fields to assessment, circuit-run, experiment-bundle, architecture, and artifact responses; preserve existing fields | Persist architecture and artifact trust context in JSON columns so Saved and exports retain provenance | Schema/serializer tests; component-source contract test because the repo has no frontend unit runner; browser render checks |
| Contract-specific Map | Rule-based mapper returns Google Cloud components and keeps hardware optional/access-controlled | Mapper is generic and score-driven; component order is unstable; PQC can inherit a circuit/quantum worker; nodes do not say classical, simulated quantum, optional hardware, or future-only | Branch deterministically by ProblemClass / ContractType; add the four required topology families; exclude all quantum/QPU nodes from PQC; add `execution_kind` to every node; carry assessment trust context into persisted maps and exports | `packages/foundry-core/src/foundry_core/mapping/gcp_mapper.py`, backend architecture route/service/model/schema, frontend Map and Saved views, artifact export | Add optional request `contract_id`; add additive component `execution_kind`, `contract_type`, `problem_class`, and `result_trust` response fields | One Alembic migration adds contract/problem classification and JSON trust columns to architecture records, plus additive contract/trust fields to artifacts | Mapper branch tests, PQC no-circuit test, architecture route/service tests, migration check, browser map checks |
| Language consistency | QALS 3.0 is implemented and used on the main Assess route | Legacy user-facing QALS-lite text remains in layouts, Build preview, modal, exports, API descriptions, and docs; Architecture and Product docs describe the retired flow | Standardize public copy on QALS 3.0 deterministic Algorithm Contract assessment; retain legacy Python heuristic only as an internal compatibility preview and document it as such | Frontend layouts/components/mocks, backend API descriptions/services/artifacts, `foundry-core` package docs, Architecture/API/Product/Backend/demo/testing docs | Descriptions only; no endpoint removal | None | Repository copy scan and updated artifact expectations |
| Compatibility and analytics | Existing API is versioned under `/api/v1`; PageUsage records page path, visitor id, city, and timestamps | No Phase 0 requirement needs a new analytics platform; route-level entry-path events are not represented separately | Keep PageUsage unchanged and avoid a new dependency or data store; existing page-path events remain sufficient for lightweight adoption analysis | No model change for PageUsage; documentation note only | No change | None | Existing usage tests remain authoritative |

## Compatibility Decisions

- Keep `POST /api/v1/circuits/run` as the tutorial simulation path. It remains educational and does
  not create an Algorithm Contract or serious Experiment Bundle.
- Keep all existing assessment, contract, bundle, artifact, job, session, and architecture fields.
  New result-trust and map-classification fields are additive and have defaults.
- Keep `run_qals_lite` only for legacy tutorial-preview compatibility. User-facing product language
  will identify those values as an educational preview, not as QALS 3.0 or an advantage predictor.
- Keep the existing PostgreSQL database, worker, storage, Cloud Tasks, Cloud Run, and deployment
  architecture. No new agent framework, quantum SDK, database, or analytics platform is required.

## Validation Plan

1. Run foundry-core, backend, and worker pytest suites.
2. Check Alembic has a single head and run upgrade checks against the local database where practical.
3. Run frontend ESLint and the production Next.js build.
4. Start the Docker Compose stack where practical and smoke-test every public and workspace route.
5. Exercise Tutorial mode, blocked Contract mode, eligible contract flow, PQC map, and trust
   panels in the in-app browser at desktop and mobile widths.

## Merged Article-Companion Release Delta

The follow-on brief aligns with the Phase 0 contract-first work and adds a reader-first entry layer without changing the QALS engine or backend authority.

| Added requirement | Existing foundation reused | Implemented delta |
| --- | --- | --- |
| Clear reader-to-contract journey | Learn, Explore, QALS 3.0, Build gates | Homepage entry cards, Series hub, two reusable companions, and focused software-stack overview |
| Quick Assessment | Existing full deterministic assessment | Seven-question shape finder that cannot emit a verdict, score, validity, or Build eligibility; validated handoff to Full Algorithm Contract |
| Richer evidence distinctions | Shared Result Trust v1 | Additive Result Trust v2 result type, evidence source, organization/link/dates, estimate level, hardware horizon, and claim status |
| Reference versus cloud map | Contract-specific mapper and Google Cloud nodes | Vendor-neutral labels by default plus an explicitly nonofficial cloud implementation-example tab |
| Article measurement | Existing PageUsage endpoint | Typed product events in a reserved namespace, excluded from ordinary page-view aggregates |
| Direct article traffic | Existing public/IAP checker | Nine default public routes with OAuth/IAP, auth status, 404, and 5xx failure rules |

The release intentionally does not add another scoring engine, a CMS, a broad SDK marketplace, framework execution beyond the tested Cirq path, or public QPU access.

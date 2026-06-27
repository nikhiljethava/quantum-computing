# QALS 3.0 End-to-End Test Cases

Quantum Foundry is an independent personal project and is not an official Google product.

This test plan verifies the enterprise "Quantum Opportunity Triage + Experiment Bundle" workbench. It focuses on the product guardrail that no serious quantum build artifact is generated unless it is attached to an assessment hypothesis, a declared classical baseline, a time horizon, evidence or assumptions, and visible trust labels.

## Local Prerequisites

- Backend, worker, and database are running.
- Frontend is available at `http://localhost:3000`.
- Backend API is available at `http://127.0.0.1:8000`.
- Database migrations have been applied.
- Seed use cases have been loaded.

Suggested checks before running the E2E matrix:

```bash
curl -i http://127.0.0.1:8000/health
curl -i http://127.0.0.1:8000/api/v1/use-cases?featured_only=true
curl -i http://localhost:3000/
```

## Regression Commands

Run these before and after any change to the QALS workbench:

```bash
PYTHONPATH=packages/foundry-core/src:apps/backend/src:apps/worker/src \
python3.11 -m pytest packages/foundry-core/tests apps/backend/tests apps/worker/tests

cd apps/frontend
npm run lint
npm run build -- --webpack

git diff --check
```

## Product Invariants

Every E2E case should preserve these invariants:

- The readiness assessment is the spine of Learn, Explore, Assess, Build, and Map.
- Verdict, confidence, time horizon, recommendation, evidence, missing evidence, assumptions, caveats, and trust labels are more important than score.
- Missing current classical baseline prevents high-confidence quantum-fit claims.
- Build creates an Experiment Bundle, not an isolated prompt-to-circuit artifact.
- Tutorial circuits can exist, but they are labeled `TUTORIAL` and cannot become business recommendations.
- Simulation output is simulator-first and includes a Result Trust panel.
- Architecture maps show the classical/quantum split and mark hardware as optional and hardware access-controlled.
- Exports produce a Quantum Algorithm Brief with the required decision sections.
- Copy must not claim guaranteed quantum advantage, guaranteed ROI, unrestricted hardware access, or production-ready quantum solutions.

## E2E-001 Home And Navigation Hierarchy

Purpose: verify Assess is visually central while Learn, Explore, Build, and Map remain in the journey.

Preconditions:

- Frontend is running.

Steps:

1. Open `/`.
2. Inspect the hero CTAs.
3. Inspect the global navigation.
4. Navigate to `/learn`, `/explore`, `/assess`, `/build`, and `/map`.

Expected results:

- Primary CTA says `Assess a quantum opportunity`.
- Secondary CTA says `Explore examples`.
- Tertiary CTA says `Learn the basics`.
- Navigation preserves Learn, Explore, Assess, Build, and Map.
- Assess is visually emphasized compared with the other journey links.
- Build does not present prompt-to-any-circuit as the primary product object.

## E2E-002 Explore Flagship Paths

Purpose: verify the V1 examples are centered on battery/materials, logistics, and crypto readiness.

Preconditions:

- Seed data has been loaded.

Steps:

1. Open `/explore`.
2. Confirm the featured examples.
3. Open each featured use-case detail page.

Expected results:

- Featured examples include battery/materials simulation, logistics or routing optimization, and PQC readiness.
- Battery/materials copy uses simulator-first and future-hardware upside language.
- Logistics copy includes classical baseline required, benchmark candidate, and production advantage unproven language.
- Crypto/security copy recommends PQC migration planning, not QKD or quantum hardware as the default action.

## E2E-003 Battery Materials Assessment With Baseline

Purpose: verify the flagship quantum simulation path creates a defensible research or simulator-first verdict.

Preconditions:

- Battery materials use case exists.

Input:

- `problemClass`: `QUANTUM_SIMULATION`
- `industry`: `Battery materials`
- `objective`: `Screen cathode material fragments before expensive lab synthesis`
- `problemDescription`: `Materials simulation for battery cathode fragments`
- `businessValue`: `Reduce expensive lab cycles and focus candidate materials`
- `currentClassicalBaseline`: `DFT / classical HPC workflow`
- `baselineMetrics`: `48 hour batch cycle for narrowed candidate set`
- `problemSize`: `Small molecular fragments now, larger active spaces later`
- `evidenceLinks`: at least one literature or internal workflow note

Steps:

1. Open `/assess`.
2. Fill the intake with the input above.
3. Submit the readiness assessment.
4. Review the result card.
5. Select `Create experiment bundle`.

Expected results:

- Verdict is `SIMULATOR_PROTOTYPE_NOW` or `RESEARCH_PARTNERSHIP`.
- Time horizon is `SIMULATOR_NOW` or `HARDWARE_GATED`.
- Trust labels include `RESEARCH_CANDIDATE` or `TOY_SIMULATION`.
- Recommendation says the path is simulator-first.
- Caveats include that toy simulation does not imply near-term production advantage.
- Caveats or hardware assumptions include future-hardware upside or hardware-gated wording.
- Classical baseline summary preserves the DFT / HPC baseline.
- Experiment Bundle includes hypothesis, classical baseline, quantum candidate, toy implementation, limitations, next evidence required, GCP map, and trust labels.

## E2E-004 Logistics Assessment Without Baseline

Purpose: verify the mandatory baseline guardrail caps the score and blocks high-confidence claims.

Preconditions:

- Logistics or routing use case exists.

Input:

- `problemClass`: `OPTIMIZATION`
- `industry`: `Logistics`
- `objective`: `Improve delivery routing`
- `problemDescription`: `Routing and scheduling for delivery vehicles`
- `businessValue`: `Lower miles and planner effort`
- `currentClassicalBaseline`: empty
- `baselineMetrics`: empty
- `problemSize`: `50 depots, 500 stops`

Steps:

1. Open `/assess`.
2. Fill the intake without a classical baseline.
3. Submit the readiness assessment.
4. Review the result card.
5. Confirm Build CTA behavior.

Expected results:

- Verdict is `BENCHMARK_FIRST`.
- Confidence is `LOW`.
- Readiness score is `40` or lower.
- Missing evidence includes `current classical baseline`.
- Build eligibility is `LIMITED` or blocked in the UI.
- The result card says classical baseline required.
- No copy implies quantum solved the optimization problem.

## E2E-005 Logistics Assessment With Baseline

Purpose: verify optimization can produce a benchmark candidate without claiming production advantage.

Preconditions:

- Logistics or routing use case exists.

Input:

- `problemClass`: `OPTIMIZATION`
- `industry`: `Logistics`
- `objective`: `Compare QAOA toy routing against current solver`
- `problemDescription`: `Vehicle routing and scheduling`
- `businessValue`: `Evaluate whether hybrid research is worth continuing`
- `currentClassicalBaseline`: `OR-Tools vehicle routing solver`
- `baselineMetrics`: `12 minute solve time, 4 percent route cost gap on weekly planning instances`
- `currentSolverOrWorkflow`: `OR-Tools plus planner overrides`
- `problemSize`: `Start with 6 to 10 stop toy route, compare against current solver`

Steps:

1. Submit the assessment.
2. Review the result card.
3. Create an Experiment Bundle if the assessment is eligible.
4. Open the bundle in Build.

Expected results:

- Verdict is `BENCHMARK_FIRST` or `SIMULATOR_PROTOTYPE_NOW`.
- Trust labels include `BENCHMARK_CANDIDATE` or `TOY_SIMULATION`.
- Caveats state production advantage is unproven and benchmark comparison is required.
- Experiment Bundle includes a small QAOA toy problem and a classical heuristic or OR-Tools comparison placeholder.
- Result trust metrics are labeled as toy simulation or benchmark candidate.

## E2E-006 Crypto Readiness Assessment

Purpose: verify cryptography is treated as a PQC migration-now workflow, not a quantum circuit workflow.

Preconditions:

- PQC readiness use case exists.

Input:

- `problemClass`: `CRYPTO_SECURITY`
- `industry`: `Financial services`
- `objective`: `Prepare post-quantum cryptography migration`
- `problemDescription`: `Certificate and protocol inventory includes RSA, ECC, ECDSA, and Diffie-Hellman`
- `securityCryptoInventory`: `RSA, ECC, ECDSA, DH usage known in certificates, APIs, and VPN`
- `businessValue`: `Reduce harvest-now-decrypt-later and regulated data exposure`
- `dataType`: `Long-lived regulated data`

Steps:

1. Submit the assessment.
2. Review the result card.
3. Try to create a serious quantum experiment bundle.
4. Export a Quantum Algorithm Brief.

Expected results:

- Verdict is `PQC_MIGRATION_NOW`.
- Time horizon is `NOW_CLASSICAL`.
- Trust labels include `ACTION_NOW`.
- Recommendation is a PQC inventory and migration planning workflow.
- The default action does not recommend quantum hardware or QKD.
- Build output is blocked, limited, or converted into a crypto readiness checklist/memo rather than a quantum circuit.
- Export memo contains the crypto inventory, assumptions, missing evidence, and next decision.

## E2E-007 Search And Grover Caveats

Purpose: verify search workflows do not become generic database or vector-search replacements.

Input:

- `problemClass`: `SEARCH`
- `objective`: `Try Grover-like search over a business dataset`
- `problemDescription`: `Unclear data loading path for a large internal database`
- `currentClassicalBaseline`: `Elasticsearch / vector search`
- `baselineMetrics`: `Sub-second lookup`

Steps:

1. Submit the assessment through the API or UI.
2. Review the result card.

Expected results:

- Verdict is `EDUCATION_ONLY` or `BENCHMARK_FIRST` when data loading is unclear.
- Caveats mention data-loading constraints.
- Recommendation does not imply generic database or vector-search replacement.
- Build eligibility is tutorial-only or limited unless a credible benchmark path is supplied.

## E2E-008 Unknown Or Under-Specified Problem

Purpose: verify the UI asks for missing fields instead of recommending Build.

Input:

- `problemClass`: `UNKNOWN`
- Sparse objective and no baseline.

Steps:

1. Submit the sparse assessment.
2. Review the result card and Build CTA.

Expected results:

- Result asks for missing fields in the UI.
- Build is not recommended except tutorial-only examples.
- Trust label is `TUTORIAL` or another non-serious label.
- Missing evidence lists the required intake fields.

## E2E-009 Build Empty State And Tutorial Guardrail

Purpose: verify Build starts from an assessment and tutorial circuits stay tutorial-only.

Steps:

1. Open `/build` directly with no assessment or bundle query parameter.
2. Confirm the empty state.
3. Open a tutorial starter such as `/build?starter=coin_flip`.
4. Run or inspect the tutorial circuit.

Expected results:

- Direct Build empty state says `Start with an assessment or open a tutorial`.
- Tutorial circuit is labeled `TUTORIAL`.
- Tutorial output cannot be exported as a business recommendation.
- Any simulation result shows trust labeling and does not claim production readiness.

## E2E-010 Experiment Bundle Structure

Purpose: verify the serious Build artifact is a bundle attached to an assessment.

Preconditions:

- Eligible battery/materials or logistics assessment exists.

Steps:

1. Create an Experiment Bundle from the assessment.
2. Open `/build?assessment_id=<id>&experiment_bundle_id=<bundle_id>`.
3. Inspect the bundle content.

Expected results:

- Bundle includes hypothesis, classical baseline, quantum candidate, toy implementation, result trust metrics, limitations, next evidence required, GCP map, and export artifacts.
- Bundle keeps assessment id and trust labels attached.
- Bundle does not appear as an isolated circuit artifact.
- If the assessment lacks a required baseline, Build is limited or blocked.

## E2E-011 Simulation Job And Result Trust Panel

Purpose: verify simulations are represented as async jobs and results are visibly qualified.

Preconditions:

- Experiment Bundle exists.

Steps:

1. Queue a simulation through `/api/v1/jobs/simulate` or through Build.
2. Poll `/api/v1/jobs/:id`.
3. Open `/jobs?job_id=<id>`.
4. Inspect the result trust panel.

Expected results:

- Job includes id, type, status, createdAt, updatedAt, inputs/payload, logs, resultArtifactId when available, and error when failed.
- Re-submitting the same assessment or bundle simulation is idempotent where possible.
- Trust panel shows backend, number of qubits, circuit depth, one-qubit gate count, two-qubit gate count, shots, histogram or distribution, ideal vs noisy flag when available, assumed noise model when available, hardware readiness label, and caveats.
- Copy clearly says this is simulation trust, not real QCVV.

## E2E-012 Hybrid Architecture Map

Purpose: verify Map exports the decision, experiment, and GCP architecture with the classical/quantum split.

Preconditions:

- Assessment or Experiment Bundle exists.

Steps:

1. Open `/map`.
2. Load or generate a map from an assessment.
3. Inspect the map and export controls.

Expected results:

- Map includes data layer, classical preprocessing, quantum kernel or simulation worker, classical post-processing, storage, export/memo, optional hardware path, time horizon, and assumptions.
- Suggested GCP components include Cloud Storage or BigQuery, Cloud Run, Cloud SQL or existing DB, Cloud Tasks or Pub/Sub, Python worker for Cirq/OpenFermion/qsim simulation where applicable, and Cloud Storage for artifacts.
- Hardware path is optional and hardware access-controlled.
- Trust labels and time horizon are visible.

## E2E-013 Quantum Algorithm Brief Export

Purpose: verify the primary export is a decision memo, not only an architecture diagram.

Preconditions:

- Assessment exists.

Steps:

1. Export the memo from Assess or Map.
2. Open `/jobs?job_id=<memo_job_id>`.
3. Download or inspect the artifact.

Expected results:

- Export job type is an Algorithm Brief export.
- Artifact is attached to the assessment and job.
- Memo contains these sections: Executive verdict, Problem shape, Classical baseline, Quantum candidate, Evidence and caveats, Experiment bundle, GCP architecture, Time horizon, Next decision, Assumptions, Missing evidence.
- Memo includes verdict, confidence, trust labels, evidence, caveats, and missing evidence.

## E2E-014 Jobs Page Enterprise Copy

Purpose: verify Jobs reflects the assessment-backed workbench instead of the older circuit-first flow.

Steps:

1. Open `/jobs`.
2. Inspect the hero cards.
3. Open a simulation job, memo export job, and failed job if available.

Expected results:

- Hero cards say `Experiment bundle jobs`, `Simulation trust jobs`, and `Opportunity memo jobs`.
- Empty state points users to a readiness assessment, Experiment Bundle, or Quantum Algorithm Brief export.
- Memo export jobs are labeled `Quantum Algorithm Brief export`.
- Job detail shows assessment and experiment bundle ids when present.
- Artifact link uses the job result artifact id when available.
- No duplicate-key warnings or layout warnings appear in the browser console.

## E2E-015 Forbidden Copy Scan

Purpose: verify product-safety claims do not regress.

Steps:

1. Search frontend, backend, seeds, docs, and generated memo copy for forbidden phrases.
2. Manually inspect the assessment, build, map, jobs, and memo pages.

Expected results:

- No unqualified instances of `quantum advantage achieved`, `ROI guaranteed`, `beats classical`, `deploy to quantum hardware`, `production-ready quantum solution`, `optimization solved by quantum`, or `QKD is the enterprise security answer`.
- If any phrase appears in documentation as a forbidden phrase, it is clearly part of a guardrail or negative test.

## E2E-016 Responsive And Accessibility Smoke

Purpose: verify the new information hierarchy is usable at common viewport sizes.

Steps:

1. Open `/`, `/assess`, `/build`, `/map`, and `/jobs` at desktop width.
2. Repeat at mobile width.
3. Inspect form labels, button names, result card ordering, and text wrapping.

Expected results:

- Text does not overlap on mobile or desktop.
- Result card order is verdict, confidence, time horizon, recommendation, score, evidence, missing evidence, assumptions, caveats, next best action.
- Buttons have clear labels and are reachable by keyboard.
- Readiness score is visually secondary to verdict and recommendation.

## Local Walkthrough Log

Record each hands-on walkthrough here with date, environment, cases covered, result, and follow-ups.

| Date | Environment | Cases covered | Result | Follow-ups |
| --- | --- | --- | --- | --- |
| 2026-05-31 | Localhost backend `:8000`, frontend `:3000`, local worker | E2E-001 through E2E-015 via live API and page smoke checks. Battery/materials, logistics with and without baseline, PQC readiness, Grover/search, Experiment Bundle, simulation job, Result Trust metrics, memo export, Jobs page copy, Map copy, and forbidden-copy scan were exercised. Automated suites passed: 46 Python tests, frontend lint, frontend production build, and `git diff --check`. | Passed after fixes for seeded baseline fallback, job status enum persistence, worker artifact id recording, worker dev volume freshness, and unclear data-loading detection. | E2E-016 still needs a true browser automation pass or manual viewport check. The in-app Browser control surface was unavailable in this session, so console warnings and responsive layout were checked only indirectly through page smoke, dev-server logs, lint, and build. |

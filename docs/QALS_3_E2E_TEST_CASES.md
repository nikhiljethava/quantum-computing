# QALS 3.0 End-to-End Test Cases

This matrix verifies the "Quantum Algorithm Contract Workbench" journey:
Learn -> Explore -> Assess -> Algorithm Contract -> Build -> Map -> Export ->
Jobs. It focuses on the product guardrail that no serious quantum build
artifact is generated unless it is attached to an assessment hypothesis,
declared classical baseline, time horizon, evidence or assumptions, and visible
trust labels.

## E2E-001 Home And Navigation

Steps:

1. Open `/`.
2. Confirm the hero says `Understand the quantum platform. Explore the software. Test an idea.`
3. Confirm entry cards link to `/series`, `/learn/quantum-software-stack`, and `/assess`.
4. Confirm navigation preserves Learn, Explore, Assess, Build, and Map.
5. Confirm superposition, entanglement, and Grover explanations use the technically accurate copy.
6. Confirm the independent-project, simulator-first, and no-public-hardware disclosure is SSR-visible.

Expected:

- The page is curiosity-first while preserving Assess as the spine for serious work.
- Homepage and About both state that Quantum Foundry is an independent personal project and not an official Google product.
- No copy claims guaranteed quantum advantage, guaranteed ROI, or unrestricted hardware access.

## E2E-001A Series And Software Stack Entry

Steps:

1. Open `/series` and confirm Articles 1 and 2 are listed in sequence.
2. Open `/series/01-platform-problem`; select each architecture layer with pointer and keyboard.
3. Toggle `One level deeper` and confirm the architecture remains understandable with the interaction disabled.
4. Open `/series/02-hybrid-computing`; compare batch, iterative, tight, and future interaction models.
5. Start each guided example and confirm its Tutorial or Toy Simulation label.
6. Open `/learn/quantum-software-stack` and review all six software roles.

Expected:

- Companion routes use one shared typed content model.
- Canonical article CTAs are hidden when no trusted HTTPS URL is configured.
- Assessment links contain only allowlisted source, problem class, and goal values.
- Cirq is the supported execution path; other SDKs are described only as educational examples.

## E2E-001B Quick And Full Assessment Boundary

Steps:

1. Open `/assess` with no query and complete all seven Quick Assessment questions.
2. Inspect the result and continue into Full Algorithm Contract.
3. Repeat with `/assess?source=series-02&problemClass=QUANTUM_SIMULATION&goal=research`.
4. Try unsupported values for `source`, `problemClass`, and `goal`.

Expected:

- Quick output includes likely contract type, algorithm family, horizon, missing evidence, and next action.
- Quick output contains no QALS verdict, readiness score, confidence, contract validity, or Build eligibility.
- Continuing transfers user-entered context but does not add a sample baseline, molecule, oracle, or other serious-contract evidence.
- Unsupported query values are ignored and cannot inject state or redirect the browser.

## E2E-002 Explore V1 Lanes

Steps:

1. Open `/explore`.
2. Confirm the four V1 lanes are visible: battery/materials, logistics, PQC readiness, and Grover/oracle scoping.
3. Confirm algorithm-pattern cards include Hamiltonian/VQE, QUBO/QAOA, PQC Risk, Grover Oracle, and Phase Estimation.
4. Click `Create contract` on a scenario.

Expected:

- The user lands on `/assess`.
- Explore frames Build as a later step after an Algorithm Contract.

## E2E-003 Battery Materials Contract

Steps:

1. Open `/assess`.
2. Choose Battery / materials simulation.
3. Fill objective, business value, DFT/HPC baseline, baseline metrics, molecule/material fragment, Hamiltonian path, observable, ansatz, and optimizer.
4. Run the assessment.

Expected:

- Verdict is `SIMULATOR_PROTOTYPE_NOW` or `RESEARCH_PARTNERSHIP`.
- Contract type is `HAMILTONIAN` or `VQE`.
- Trust labels include `HAMILTONIAN_DEPENDENT` and a research or toy simulation label.
- Caveats include future-hardware upside and do not imply near-term production advantage.
- Readiness score is visually secondary to verdict, confidence, and time horizon.

## E2E-004 Battery Materials Missing Hamiltonian

Steps:

1. Choose Battery / materials simulation.
2. Fill a DFT/HPC baseline but omit molecule/material fragment or Hamiltonian path.
3. Run the assessment.

Expected:

- Verdict is `RESEARCH_SCOPING_REQUIRED`.
- Confidence is `LOW`.
- Trust labels include `HAMILTONIAN_DEPENDENT` and `INSUFFICIENT_CONTRACT`.
- Build eligibility is `LIMITED_TUTORIAL_ONLY`.
- Missing inputs name the missing Hamiltonian contract fields.

## E2E-005 Logistics Missing Baseline

Steps:

1. Choose Logistics / optimization.
2. Fill routing objective, variables, QUBO objective, constraints, and penalties.
3. Leave current classical baseline blank.
4. Run the assessment.

Expected:

- Verdict is `BENCHMARK_FIRST`.
- Confidence is `LOW`.
- Readiness score is capped at 40.
- Missing evidence includes `current classical baseline`.
- Trust labels include `BASELINE_REQUIRED`.
- Build is blocked or limited to tutorial-only output.
- Copy includes `classical baseline required` and `production advantage unproven`.

## E2E-006 Logistics With Baseline

Steps:

1. Choose Logistics / optimization.
2. Fill routing details, variables, objective, constraints, penalty terms, `OR-Tools or MILP solver`, and baseline metrics.
3. Run the assessment.
4. Create the Algorithm Experiment Bundle.

Expected:

- Verdict is `BENCHMARK_FIRST` or `SIMULATOR_PROTOTYPE_NOW`.
- Contract type is `QUBO_ISING` or `QAOA`.
- Trust labels include `BENCHMARK_CANDIDATE` and `CONVERGENCE_UNCERTAIN`.
- Caveats include `production advantage unproven`.
- Build creates a bundle with hypothesis, classical baseline, algorithm candidate, toy implementation, result trust metrics, limitations, next evidence, GCP map, and export artifacts.

## E2E-007 PQC Readiness Complete Inventory

Steps:

1. Choose Crypto / PQC readiness.
2. Enter RSA/ECC/DH/ECDSA usage, certificate lifetimes, data shelf life, systems affected, migration owner/time, crypto agility, and complete inventory status.
3. Run the assessment.
4. Export the brief.

Expected:

- Verdict is `PQC_MIGRATION_NOW`.
- Time horizon is `NOW_CLASSICAL`.
- Trust labels include `ACTION_NOW`.
- Build eligibility is `NON_COMPUTE_ACTION_ONLY`.
- Export filename starts with `pqc_migration_memo`.
- Output recommends inventory and migration planning, not quantum hardware or QKD.

## E2E-008 PQC Readiness Incomplete Inventory

Steps:

1. Choose Crypto / PQC readiness.
2. Mention RSA/ECC/DH/ECDSA but mark inventory completeness unknown or partial.
3. Run the assessment.

Expected:

- Verdict is `INVENTORY_FIRST`.
- Confidence is `LOW`.
- Trust labels include `ACTION_NOW`.
- Missing inputs include inventory completeness and ownership fields.
- Build output is non-compute action only.

## E2E-009 Grover Without Oracle

Steps:

1. Choose Search.
2. Describe a generic enterprise search or vector search goal.
3. Leave predicate/oracle definition and data-loading assumption blank.
4. Run the assessment.

Expected:

- Verdict is `EDUCATION_ONLY` or `BENCHMARK_FIRST`.
- Trust labels include `ORACLE_DEPENDENT` and `INSUFFICIENT_CONTRACT`.
- Caveats mention data-loading overhead and no generic database/vector-search replacement.
- Build eligibility is `LIMITED_TUTORIAL_ONLY`.

## E2E-010 Grover With Oracle

Steps:

1. Choose Search.
2. Provide a reversible predicate, input size N, marked item estimate M, oracle cost note, and data-loading assumption.
3. Run the assessment.

Expected:

- Contract type is `ORACLE`.
- Algorithm family is `GROVER_SEARCH`.
- The output remains oracle-dependent and benchmark-scoped.
- Build can create only a toy or benchmark candidate, not a production recommendation.

## E2E-011 Build Empty State And Tutorial

Steps:

1. Open `/build` without query params.
2. Open `/build?mode=tutorial&starter=coin_flip`.
3. Confirm Tutorial mode is selected in the Algorithm Experiment Workspace and run the tutorial simulation.
4. Switch to `/build?mode=contract` without contract references.

Expected:

- Empty state says `Start with an assessment or open a tutorial`.
- Tutorial circuits are labeled `TUTORIAL` and `TOY_SIMULATION`.
- Tutorial output says it is not a business recommendation and not evidence of quantum advantage.
- Contract mode is blocked without matching assessment, Algorithm Contract, and Experiment Bundle records.
- Tutorial artifacts cannot be exported as business recommendations.

## E2E-012 Result Trust Panel

Steps:

1. Create an eligible Algorithm Experiment Bundle.
2. Open the bundle in Build.
3. Run or inspect the simulation result.

Expected:

- Result Trust panel shows result type, evidence category, backend/status, simulator or hardware name, qubits, depth, one/two-qubit gates, shots, distribution, ideal/noisy mode, noise model, estimate level, hardware horizon, baseline status, source type/organization/link/dates, claim status, contract status, verdict, confidence, horizon, labels, assumptions, missing evidence, caveats, provenance, timestamp, and software/version when available.
- Tutorial and educational-noise results are never labeled calibrated hardware or measured hardware results.
- Vendor Reported and Independently Reproduced results have distinct visible treatments that do not depend on color alone.
- The panel does not claim real QCVV or hardware characterization.

## E2E-013 Map And Architecture Export

Steps:

1. Open `/map` with an optimization assessment and contract id; verify classical solver, QUBO/Ising, simulator, optimizer loop, and comparison nodes.
2. Repeat with chemistry/materials; verify fragment, basis/active space, Hamiltonian, OpenFermion/Cirq, baseline, interpretation, and future resource-estimation nodes.
3. Repeat with search; verify search space, oracle, data loading, simulator, query complexity, and caveat nodes.
4. Repeat with PQC; verify inventory, risk clock, prioritization, standards, interoperability, staged migration, crypto agility, and migration memo nodes.
5. Export architecture JSON.
6. Switch between `Reference architecture` and `Cloud implementation example` for each map.

Expected:

- Every node is classified as classical, simulated quantum, optional approved hardware, or future-only.
- PQC contains no circuit, QPU, or quantum-hardware node.
- Hardware path is labeled hardware access-controlled.
- Export JSON retains assessment/contract ids, problem/contract classification, horizon, assumptions, and Result Trust.
- Reference architecture uses vendor-neutral workflow names; the cloud tab is labeled as one implementation example, not an official or universal architecture.

## E2E-014 Contract Gate Revalidation

Steps:

1. Create an optimization assessment without a baseline and obtain or edit an Algorithm Contract record.
2. Attempt to mark the contract eligible through contract patch fields and create/run Contract mode.
3. Create a baseline-backed but partial contract with required QUBO fields missing.
4. Create a complete valid contract and queue its experiment.

Expected:

- Assessment-owned QALS eligibility remains authoritative; an edited contract cannot bypass it.
- Missing baseline blocks bundle creation or compute execution.
- A partial contract may retain a scoped bundle but queues no simulation.
- Only the valid, complete, baseline-backed contract reaches the worker circuit path.
- The worker rejects mismatched assessment, contract, and bundle ids.

## E2E-015 Quantum Algorithm Brief Export

Steps:

1. Run a non-crypto assessment.
2. Export the Algorithm Brief.
3. Open the downloaded markdown artifact.

Expected:

- Export is represented as a job.
- Filename starts with `quantum_algorithm_brief`.
- Sections include Executive verdict, Problem statement, Algorithm Contract, Mathematical reduction, Classical baseline, Algorithm candidate, Resource/trust estimate, Simulator experiment, Benchmark result, Caveats/missing/evidence, GCP architecture, Time horizon, Next decision, and Assumptions.
- Contract-backed code, notebook, session summary, assessment JSON, and architecture JSON carry assessment id, contract id, baseline, horizon, assumptions, and trust labels.

## E2E-016 Jobs Activity

Steps:

1. Queue a simulator job from Build.
2. Export an Algorithm Brief or PQC Migration Memo.
3. Open `/jobs`.

Expected:

- Jobs show queued/running/completed/failed status.
- Export jobs are labeled Algorithm Brief.
- Simulator-first jobs link back to the relevant workspace.
- Empty states point to assessment, Algorithm Experiment Bundle, or Algorithm Brief export.

## E2E-017 API Compatibility And Routes

Steps:

1. Parse a legacy architecture response without Phase 0 fields.
2. Parse a legacy component without `execution_kind`.
3. Parse a legacy artifact without contract/trust fields.
4. Open every current route listed in `apps/frontend/src/app`.

Expected:

- New API fields remain nullable/additive and legacy payloads parse with compatibility defaults.
- Every current route returns rendered HTML with no browser console error or horizontal overflow.

## E2E-018 Deployment Access

Steps:

1. Deploy with `_FRONTEND_ACCESS_MODE=public`.
2. Run `scripts/check-frontend-access.sh --url FRONTEND_URL --mode public`.
3. Deploy with `_FRONTEND_ACCESS_MODE=iap-protected` and configured `IAP_ALLOWED_MEMBERS`.
4. Run `scripts/check-frontend-access.sh --url FRONTEND_URL --mode iap-protected`.

Expected:

- Public mode fails if IAP headers, Google OAuth redirects, or auth-related `401`/`403` responses are present.
- Public mode checks `/`, `/learn`, `/learn/quantum-software-stack`, `/series`, both article companions, `/assess`, `/build`, and `/map`, and also fails on unexpected `404` and `5xx` responses.
- IAP-protected mode fails if no IAP challenge or IAP header is detected.
- Cloud Build fails fast when `_FRONTEND_ACCESS_MODE` is invalid.

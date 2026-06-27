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
2. Confirm the primary CTA is `Assess a quantum opportunity`.
3. Confirm secondary paths include Explore and Learn.
4. Confirm navigation preserves Learn, Explore, Assess, Build, and Map.
5. Confirm Assess is visually central in the journey.

Expected:

- The page positions the product as an Algorithm Contract Workbench.
- No copy claims guaranteed quantum advantage, guaranteed ROI, or unrestricted hardware access.

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
2. Click tutorial circuit.
3. Run the tutorial simulation.

Expected:

- Empty state says `Start with an assessment or open a tutorial`.
- Tutorial circuits are labeled `TUTORIAL`.
- Tutorial artifacts cannot be exported as business recommendations.

## E2E-012 Result Trust Panel

Steps:

1. Create an eligible Algorithm Experiment Bundle.
2. Open the bundle in Build.
3. Run or inspect the simulation result.

Expected:

- Result Trust panel shows backend, qubits, circuit depth, one-qubit gate count, two-qubit gate count, shots, histogram or distribution, ideal/noisy flag when available, assumed noise model when available, hardware readiness label, and caveats.
- The panel does not claim real QCVV or hardware characterization.

## E2E-013 Map And Architecture Export

Steps:

1. Open `/map` with an assessment or bundle id.
2. Generate a live map.
3. Export architecture JSON.

Expected:

- The architecture separates data layer, classical preprocessing, quantum kernel or simulation worker, classical post-processing, storage, export, optional hardware path, time horizon, and assumptions.
- Hardware path is labeled hardware access-controlled.

## E2E-014 Quantum Algorithm Brief Export

Steps:

1. Run a non-crypto assessment.
2. Export the Algorithm Brief.
3. Open the downloaded markdown artifact.

Expected:

- Export is represented as a job.
- Filename starts with `quantum_algorithm_brief`.
- Sections include Executive verdict, Problem statement, Algorithm Contract, Mathematical reduction, Classical baseline, Algorithm candidate, Resource/trust estimate, Simulator experiment, Benchmark result, Caveats/missing/evidence, GCP architecture, Time horizon, Next decision, and Assumptions.

## E2E-015 Jobs Activity

Steps:

1. Queue a simulator job from Build.
2. Export an Algorithm Brief or PQC Migration Memo.
3. Open `/jobs`.

Expected:

- Jobs show queued/running/completed/failed status.
- Export jobs are labeled Algorithm Brief.
- Simulator-first jobs link back to the relevant workspace.
- Empty states point to assessment, Algorithm Experiment Bundle, or Algorithm Brief export.

## E2E-016 Deployment Access

Steps:

1. Deploy with `_FRONTEND_ACCESS_MODE=public`.
2. Run `scripts/check-frontend-access.sh --url FRONTEND_URL --mode public`.
3. Deploy with `_FRONTEND_ACCESS_MODE=iap-protected` and configured `IAP_ALLOWED_MEMBERS`.
4. Run `scripts/check-frontend-access.sh --url FRONTEND_URL --mode iap-protected`.

Expected:

- Public mode fails if IAP headers, Google OAuth redirects, or auth-related `401`/`403` responses are present.
- IAP-protected mode fails if no IAP challenge or IAP header is detected.
- Cloud Build fails fast when `_FRONTEND_ACCESS_MODE` is invalid.

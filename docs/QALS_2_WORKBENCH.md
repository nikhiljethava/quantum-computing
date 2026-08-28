# QALS 3.0 Algorithm Contract Workbench

Quantum Foundry centers the journey on a readiness assessment and Algorithm
Contract before Build. No serious quantum build artifact should be generated
unless it is attached to an assessment hypothesis, a declared classical
baseline, a time horizon, evidence or assumptions, and visible trust labels.

## Rule Engine

QALS 3.0 lives in `packages/foundry-core/src/foundry_core/assessment/qals.py`.
It is a deterministic Algorithm Contract rule/evidence engine, not ML scoring.
The readiness score is secondary to verdict, confidence, time horizon, contract
validity, mathematical reduction, evidence, missing evidence, assumptions,
caveats, next action, build eligibility, and trust labels.

Missing classical baseline guardrail:

- verdict becomes `BENCHMARK_FIRST` unless the workflow is tutorial-only or PQC migration-now
- confidence becomes `LOW`
- build eligibility becomes `LIMITED_TUTORIAL_ONLY`
- missing evidence includes `current classical baseline`
- readiness score is capped at 40

## Verdicts

- `CLASSICAL_FIRST`: keep the workflow classical until the problem changes.
- `EDUCATION_ONLY`: tutorial value only; not a business recommendation.
- `BENCHMARK_FIRST`: define or improve the classical baseline before Build claims.
- `SIMULATOR_PROTOTYPE_NOW`: simulator-first toy experiment is reasonable with caveats.
- `RESEARCH_PARTNERSHIP`: credible research track with scoped evidence needs.
- `FUTURE_FTQC`: fault-tolerant hardware is the meaningful horizon.
- `PQC_MIGRATION_NOW`: action-now crypto inventory and migration planning.
- `INVENTORY_FIRST`: crypto inventory is the action before migration planning can be complete.
- `RESEARCH_SCOPING_REQUIRED`: chemistry/materials contract inputs are not yet sufficient.

## Trust Labels

- `TUTORIAL`
- `TOY_SIMULATION`
- `OVERCOMPILED_DEMO`
- `MEANINGFUL_SMALL_INSTANCE`
- `BENCHMARK_CANDIDATE`
- `RESEARCH_CANDIDATE`
- `HARDWARE_GATED`
- `FTQC_LATER`
- `ACTION_NOW`
- `ORACLE_DEPENDENT`
- `HAMILTONIAN_DEPENDENT`
- `CONVERGENCE_UNCERTAIN`
- `BASELINE_REQUIRED`
- `INSUFFICIENT_CONTRACT`

Every assessment, Algorithm Contract, Experiment Bundle, simulation result, and
architecture map should surface one or more labels.

## Build Modes

- **Tutorial mode** runs without an assessment. Its circuit and export trust remains
  `TUTORIAL` / `TOY_SIMULATION`, and it is never a business recommendation.
- **Contract mode** requires matching persisted assessment, Algorithm Contract,
  and Experiment Bundle records. Worker execution rechecks the assessment-owned QALS
  eligibility, contract validity, required inputs, and declared classical baseline.
- A user-edited contract cannot override an assessment-level QALS gate. Incomplete
  contracts may retain a scoped bundle plan, but no simulation job is queued.
- PQC uses the Contract workspace as a non-compute migration flow and does not create
  a quantum circuit or QPU path.

## Algorithm Contract

QALS 3.0 emits:

- recommended contract type and algorithm family
- contract validity status
- mathematical object
- reduction summary
- required, provided, and missing inputs
- benchmark plan
- resource estimate

Optimization uses QUBO/QAOA contracts and requires a classical baseline.
Battery/materials simulation uses Hamiltonian/VQE/Trotter/phase-estimation
contracts and requires a molecule or material fragment plus Hamiltonian path.
Grover search requires an explicit oracle and data-loading assumption. Crypto
security produces a PQC risk contract and migration memo, not a quantum circuit.

## Async Job Model

Simulation and export work is represented by `jobs` rows with:

- `id`
- `job_type`
- `status`
- `created_at`
- `updated_at`
- `payload`
- `logs`
- `result_artifact_id`
- `error_message`

The existing worker continues to process circuit simulations and export jobs.
Algorithm Experiment Bundles can queue simulator-first jobs with persisted
assessment, contract, and bundle references. The worker resolves the declared
baseline, time horizon, assumptions, and trust labels from those authoritative
records before execution. Contract exports store the assessment id, contract id,
and Result Trust context; code, notebook, summary, assessment JSON, and architecture
JSON content also carry that context. Exports are represented as jobs and generate
a Quantum Algorithm Brief or PQC Migration Memo artifact.

## Simulator-First Guardrail

Default execution is simulator-first. Hardware remains optional and
hardware access-controlled. The Result Trust panel reports backend, qubits,
depth, one-qubit gate count, two-qubit gate count, shots, histogram,
ideal/noisy flag, assumed noise model, hardware readiness label, and caveats.
It is not QCVV or hardware characterization.

## Contract-Specific Map

The deterministic mapper branches on `ProblemClass` and `ContractType`:

- optimization: problem construction, classical solver, QUBO/Ising, simulator,
  optimizer loop, and comparison decision;
- chemistry/materials: fragment, basis/active-space assumptions, Hamiltonian,
  OpenFermion/Cirq, simulator, classical chemistry baseline, interpretation, and
  future resource estimation;
- Grover/search: search space, oracle, data loading, simulator, query complexity,
  and end-to-end caveats;
- PQC: inventory, risk clock, prioritization, standards selection, interoperability
  tests, staged migration, crypto agility, and memo, with no circuit or QPU node.

Every node declares `classical`, `simulated_quantum`,
`optional_approved_hardware`, or `future_only` execution kind.

## Adding A Problem Class

1. Add the enum value in `ProblemClass`.
2. Add keyword inference if useful.
3. Add a rule branch in `run_qals_2` or its compatibility wrapper.
4. Define verdict, confidence, time horizon, contract type, algorithm family, trust labels, missing evidence, caveats, and build eligibility.
5. Add an Algorithm Contract and Experiment Bundle mapping in `foundry_backend.services.opportunity`.
6. Add tests that cover hard gates, missing baseline behavior, required contract fields, and required output fields.

# QALS 2.0 Opportunity Workbench

Quantum Foundry now centers the journey on a readiness assessment before Build.
No serious quantum build artifact should be generated unless it is attached to an
assessment hypothesis, a declared classical baseline, a time horizon,
evidence or assumptions, and visible trust labels.

## Rule Engine

QALS 2.0 lives in `packages/foundry-core/src/foundry_core/assessment/qals.py`.
It is a deterministic rule/evidence engine, not ML scoring. The readiness score
is secondary to the verdict, confidence, time horizon, evidence, missing
evidence, assumptions, caveats, next action, build eligibility, and trust labels.

Missing classical baseline guardrail:

- verdict becomes `BENCHMARK_FIRST` unless the workflow is tutorial-only or PQC migration-now
- confidence becomes `LOW`
- build eligibility becomes `LIMITED`
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

## Trust Labels

- `TUTORIAL`
- `TOY_SIMULATION`
- `BENCHMARK_CANDIDATE`
- `RESEARCH_CANDIDATE`
- `HARDWARE_GATED`
- `FTQC_LATER`
- `ACTION_NOW`

Every assessment, Experiment Bundle, simulation result, and architecture map
should surface one or more labels.

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
Experiment Bundles can queue simulator-first jobs with the assessment id, trust
labels, and baseline context attached in the payload.

## Simulator-First Guardrail

Default execution is simulator-first. Hardware remains optional and
hardware access-controlled. The Result Trust panel reports backend, qubits,
depth, one-qubit gate count, two-qubit gate count, shots, histogram,
ideal/noisy flag, assumed noise model, hardware readiness label, and caveats.
It is not QCVV or hardware characterization.

## Adding A Problem Class

1. Add the enum value in `ProblemClass`.
2. Add keyword inference if useful.
3. Add a rule branch in `run_qals_2`.
4. Define verdict, confidence, time horizon, trust labels, missing evidence, caveats, and build eligibility.
5. Add an Experiment Bundle mapping in `foundry_backend.services.opportunity`.
6. Add tests that cover missing baseline behavior and required output fields.

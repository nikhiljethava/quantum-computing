/**
 * Article 4 V9 educational models. These functions have no API or storage access.
 * Bounds are product safeguards chosen locally because ACCEPTANCE_CASES.json was
 * not supplied. They are not physical limits or vendor capabilities.
 */
export const MODEL_VERSION = "1.0.0" as const;

export const INPUT_BOUNDS = {
  N: { min: 1, max: 10_000_000, integer: true },
  b: { min: -1_000, max: 1_000 },
  variance: { min: 0, max: 1_000_000 },
  reference: { min: -1_000, max: 1_000 },
  k: { min: 0, max: 5, integer: true },
  localTime: { min: 0, max: 1_000_000 },
  directTime: { min: 0, max: 1_000_000 },
  phi: { min: 0, max: Math.PI },
  efficiency: { min: 0, max: 1 },
  launches: { min: 0, max: 1_000_000_000, integer: true },
} as const;

export const DEFAULTS = {
  sampling: { N: 100, b: 0.2, variance: 1, reference: 0 },
  scheduling: ["A", "C"],
  routing: { k: 1, localTime: 0.2, directTime: 1 },
  phase: { phi: Math.PI / 2 },
  loss: { efficiencies: [0.9, 0.9, 0.9, 0.9], launches: 100 },
} as const;

export type InputValidation<T> =
  | { ok: true; value: T }
  | { ok: false; errors: Record<string, string> };

export type ModelId = "sampling" | "scheduling" | "routing" | "optics-phase" | "optics-loss";

export interface ModelValue<I, O, M extends ModelId = ModelId> {
  modelId: M;
  modelVersion: typeof MODEL_VERSION;
  inputs: I;
  outputs: O;
  inputUnits: Record<keyof I, string>;
  outputUnits: Record<keyof O, string>;
  assumptions: string[];
  omittedFactors: string[];
  sourceIds: string[];
}

type Bounds = { min: number; max: number; integer?: boolean };
// Restrict text to ordinary decimal/exponent syntax; Number("") and Number(null)
// must never silently turn a missing reader input into zero.
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

function numberInput(raw: unknown, key: string, bounds: Bounds, errors: Record<string, string>): number {
  if (typeof raw !== "number" && (typeof raw !== "string" || !raw.trim())) {
    errors[key] = "Enter a number.";
    return NaN;
  }
  if (typeof raw === "string" && !DECIMAL.test(raw.trim())) {
    errors[key] = "Enter a finite decimal number.";
    return NaN;
  }
  const value = typeof raw === "number" ? raw : Number(raw.trim());
  if (!Number.isFinite(value)) errors[key] = "Enter a finite number.";
  else if (bounds.integer && !Number.isSafeInteger(value)) errors[key] = "Enter a whole number.";
  else if (value < bounds.min || value > bounds.max) errors[key] = `Enter a value from ${bounds.min} to ${bounds.max}.`;
  return value;
}

export type SamplingInputs = { N: number; b: number; variance: number; reference: number };
export type SamplingOutputs = {
  expectedEstimate: number;
  standardError: number;
  meanSquaredError: number;
  lowerOneSE: number;
  upperOneSE: number;
  offsetDirection: "above" | "below" | "equal";
};
export type SamplingObservation = ModelValue<SamplingInputs, SamplingOutputs, "sampling">;

export function evaluateSampling(raw: Record<keyof SamplingInputs, unknown>): InputValidation<SamplingObservation> {
  const errors: Record<string, string> = {};
  const N = numberInput(raw.N, "N", INPUT_BOUNDS.N, errors);
  const b = numberInput(raw.b, "b", INPUT_BOUNDS.b, errors);
  const variance = numberInput(raw.variance, "variance", INPUT_BOUNDS.variance, errors);
  const reference = numberInput(raw.reference, "reference", INPUT_BOUNDS.reference, errors);
  if (Object.keys(errors).length) return { ok: false, errors };
  const expectedEstimate = reference + b;
  const standardError = Math.sqrt(variance / N);
  return {
    ok: true,
    value: {
      modelId: "sampling", modelVersion: MODEL_VERSION,
      inputs: { N, b, variance, reference },
      outputs: {
        expectedEstimate, standardError, meanSquaredError: b * b + variance / N,
        lowerOneSE: expectedEstimate - standardError,
        upperOneSE: expectedEstimate + standardError,
        offsetDirection: b > 0 ? "above" : b < 0 ? "below" : "equal",
      },
      inputUnits: { N: "independent samples", b: "normalized teaching units", variance: "squared normalized teaching units", reference: "normalized teaching units" },
      outputUnits: { expectedEstimate: "normalized teaching units", standardError: "normalized teaching units", meanSquaredError: "squared normalized teaching units", lowerOneSE: "normalized teaching units", upperOneSE: "normalized teaching units", offsetDirection: "relation to reference" },
      assumptions: ["Independent samples with a finite single-sample variance.", "The chosen fixed offset is independent of the sample count.", "The band is one standard error, not a guaranteed interval or a 95% confidence interval."],
      omittedFactors: ["Molecular energies, Hamiltonians, circuit noise and optimizer effects.", "VQE optimization, SQD diagonalization and QPE execution.", "Any conversion from vendor gate infidelity to energy bias."],
      sourceIds: ["[1]", "[2]", "[36]", "[37]"],
    },
  };
}

export const JOBS = [
  { id: "A", equipment: ["press", "inspection"] },
  { id: "B", equipment: ["press", "drill"] },
  { id: "C", equipment: ["drill", "mill"] },
  { id: "D", equipment: ["mill", "oven"] },
  { id: "E", equipment: ["oven", "inspection"] },
] as const;
export type JobId = typeof JOBS[number]["id"];
export interface ConflictEdge { jobs: [JobId, JobId]; equipment: string[] }

export const CONFLICT_EDGES: ConflictEdge[] = JOBS.flatMap((job, index) =>
  JOBS.slice(index + 1).flatMap((other) => {
    const equipment = job.equipment.filter((item) => (other.equipment as readonly string[]).includes(item));
    return equipment.length ? [{ jobs: [job.id, other.id] as [JobId, JobId], equipment }] : [];
  }),
);

export interface SchedulingChoice {
  selected: JobId[];
  selectedCount: number;
  equipment: string[];
  conflicts: ConflictEdge[];
  valid: boolean;
  maximum: boolean;
  maximumSize: number;
  cost: number;
}

function schedulingChoice(selected: JobId[]): SchedulingChoice {
  const conflicts = CONFLICT_EDGES.filter((edge) => edge.jobs.every((id) => selected.includes(id)))
    .map((edge) => ({ jobs: [...edge.jobs] as [JobId, JobId], equipment: [...edge.equipment] }));
  const equipment = [...new Set(JOBS.filter((job) => selected.includes(job.id)).flatMap((job) => [...job.equipment]))];
  return { selected: [...selected], selectedCount: selected.length, equipment, conflicts, valid: conflicts.length === 0, maximum: false, maximumSize: 0, cost: -selected.length + 2 * conflicts.length };
}

/** All 32 subsets of the fixed five-job dataset, evaluated classically. */
export function enumerateScheduling(): SchedulingChoice[] {
  const choices = Array.from({ length: 1 << JOBS.length }, (_, mask) =>
    schedulingChoice(JOBS.filter((_, i) => (mask & (1 << i)) !== 0).map((job) => job.id)),
  );
  const maximumSize = Math.max(...choices.filter((choice) => choice.valid).map((choice) => choice.selectedCount));
  return choices.map((choice) => ({ ...choice, maximumSize, maximum: choice.valid && choice.selectedCount === maximumSize }));
}

export type SchedulingOutputs = Omit<SchedulingChoice, "selected">;
export type SchedulingObservation = ModelValue<{ selected: JobId[] }, SchedulingOutputs, "scheduling">;

export function evaluateScheduling(selected: readonly unknown[]): InputValidation<SchedulingObservation> {
  if (!Array.isArray(selected) || selected.some((id) => !JOBS.some((job) => job.id === id))) {
    return { ok: false, errors: { selected: "Select only jobs A, B, C, D or E." } };
  }
  if (new Set(selected).size !== selected.length) return { ok: false, errors: { selected: "Each job can be selected only once." } };
  const ordered = JOBS.filter((job) => selected.includes(job.id)).map((job) => job.id);
  const choice = enumerateScheduling().find((item) => item.selected.join("") === ordered.join(""))!;
  const { selected: selectedJobs, ...outputs } = choice;
  return {
    ok: true,
    value: {
      modelId: "scheduling", modelVersion: MODEL_VERSION,
      inputs: { selected: selectedJobs }, outputs,
      inputUnits: { selected: "job identifiers" },
      outputUnits: { selectedCount: "jobs", equipment: "equipment names", conflicts: "job pairs and shared equipment", valid: "boolean", maximum: "boolean", maximumSize: "jobs", cost: "dimensionless objective with penalty 2" },
      assumptions: ["The five fixed jobs compete for shared equipment in one time slot.", "Conflicts are derived from the equipment list.", "All 32 subsets are checked classically; the penalty per selected conflict edge is 2."],
      omittedFactors: ["Job durations, priorities, setup times and industrial scheduling constraints.", "Neutral-atom or other quantum hardware execution."],
      sourceIds: ["[3]", "[34]"],
    },
  };
}

export type RoutingInputs = { k: number; localTime: number; directTime: number };
export type RoutingOutputs = {
  gateCount: number;
  localDuration: number;
  directDuration: number;
  comparison: "local-faster" | "direct-faster" | "tie";
  sites: number[];
  arrangements: string[][];
};
export type RoutingObservation = ModelValue<RoutingInputs, RoutingOutputs, "routing">;

export function evaluateRouting(raw: Record<keyof RoutingInputs, unknown>): InputValidation<RoutingObservation> {
  const errors: Record<string, string> = {};
  const k = numberInput(raw.k, "k", INPUT_BOUNDS.k, errors);
  const localTime = numberInput(raw.localTime, "localTime", INPUT_BOUNDS.localTime, errors);
  const directTime = numberInput(raw.directTime, "directTime", INPUT_BOUNDS.directTime, errors);
  if (Object.keys(errors).length) return { ok: false, errors };
  const gateCount = 3 * k + 1;
  const localDuration = gateCount * localTime;
  // Relative tolerance recognizes floating-point identities (7 * 0.2 vs 1.4)
  // without making all valid sub-unit durations appear equal.
  const tolerance = Number.EPSILON * Math.max(Math.abs(localDuration), Math.abs(directTime)) * 8;
  const comparison = Math.abs(localDuration - directTime) <= tolerance ? "tie" : localDuration < directTime ? "local-faster" : "direct-faster";
  const initial = ["A", ...Array.from({ length: k }, (_, i) => k === 1 ? "X" : `X${i + 1}`), "B"];
  const arrangements = [initial];
  for (let swap = 0; swap < k; swap++) {
    const next = [...arrangements[swap]];
    [next[swap], next[swap + 1]] = [next[swap + 1], next[swap]];
    arrangements.push(next);
  }
  return {
    ok: true,
    value: {
      modelId: "routing", modelVersion: MODEL_VERSION,
      inputs: { k, localTime, directTime },
      outputs: { gateCount, localDuration, directDuration: directTime, comparison, sites: initial.map((_, i) => i + 1), arrangements },
      inputUnits: { k: "SWAPs", localTime: "illustrative time units per local gate", directTime: "illustrative time units" },
      outputUnits: { gateCount: "two-qubit gates", localDuration: "illustrative time units", directDuration: "illustrative time units", comparison: "gate-only duration comparison", sites: "fixed site indices", arrangements: "state labels at each fixed site, before and after each SWAP" },
      assumptions: ["Each SWAP uses three CNOTs, followed by one requested two-qubit gate.", "The original placement is not restored.", "State labels move between fixed chip sites.", "The times are arbitrary teaching values, not provider measurements."],
      omittedFactors: ["Native decompositions, initial placement optimization and gate fusion.", "Transport, cooling, parallelism, readout, reset and errors.", "Energy error, application success and end-to-end runtime."],
      sourceIds: ["[7]", "[11]", "[12]"],
    },
  };
}

export type PhaseObservation = ModelValue<{ phi: number }, { pD0: number; pD1: number }, "optics-phase">;

export function evaluatePhase(raw: { phi: unknown }): InputValidation<PhaseObservation> {
  const errors: Record<string, string> = {};
  const phi = numberInput(raw.phi, "phi", INPUT_BOUNDS.phi, errors);
  if (Object.keys(errors).length) return { ok: false, errors };
  // Exact identities at the three documented presets avoid residual sin(pi)
  // artifacts. Other inputs use the formula without rounding or clamping.
  const pD0 = phi === 0 ? 1 : phi === Math.PI ? 0 : phi === Math.PI / 2 ? 0.5 : Math.cos(phi / 2) ** 2;
  const pD1 = phi === 0 ? 0 : phi === Math.PI ? 1 : phi === Math.PI / 2 ? 0.5 : Math.sin(phi / 2) ** 2;
  return {
    ok: true,
    value: {
      modelId: "optics-phase", modelVersion: MODEL_VERSION,
      inputs: { phi }, outputs: { pD0, pD1 },
      inputUnits: { phi: "radians" }, outputUnits: { pD0: "ideal probability", pD1: "ideal probability" },
      assumptions: ["One photon has amplitudes in two paths; it is not copied into two photons.", "A balanced, lossless interferometer uses the article's phase convention.", "Probabilities refer to fresh preparations, not observed counts."],
      omittedFactors: ["Optical loss, detector imperfections and imperfect interference.", "Multi-qubit resource generation and full photonic algorithms."],
      sourceIds: ["[16]", "[18]"],
    },
  };
}

export type LossObservation = ModelValue<{ efficiencies: number[]; launches: number }, { pathEfficiency: number; expectedDetections: number; stageCounts: number[]; stageLosses: number[] }, "optics-loss">;

export function evaluateLoss(raw: { efficiencies: readonly unknown[]; launches: unknown }): InputValidation<LossObservation> {
  const errors: Record<string, string> = {};
  const launches = numberInput(raw.launches, "launches", INPUT_BOUNDS.launches, errors);
  if (!Array.isArray(raw.efficiencies) || raw.efficiencies.length !== 4) {
    errors.efficiencies = "Enter exactly four conditional stage efficiencies.";
    return { ok: false, errors };
  }
  const efficiencies = Array.from(raw.efficiencies, (value, i) => numberInput(value, `efficiency${i}`, INPUT_BOUNDS.efficiency, errors));
  if (Object.keys(errors).length) return { ok: false, errors };
  let pathEfficiency = 1;
  const stageCounts = [launches];
  const stageLosses: number[] = [];
  for (const efficiency of efficiencies) {
    pathEfficiency *= efficiency;
    const count = launches * pathEfficiency;
    stageLosses.push(stageCounts[stageCounts.length - 1] - count);
    stageCounts.push(count);
  }
  return {
    ok: true,
    value: {
      modelId: "optics-loss", modelVersion: MODEL_VERSION,
      inputs: { efficiencies, launches },
      outputs: { pathEfficiency, expectedDetections: stageCounts[4], stageCounts, stageLosses },
      inputUnits: { efficiencies: "conditional probabilities of reaching the next stage", launches: "photon launches" },
      outputUnits: { pathEfficiency: "delivery probability", expectedDetections: "expected detections", stageCounts: "expected photon counts, beginning with launches", stageLosses: "expected losses at each stage" },
      assumptions: ["Each efficiency is conditional on reaching that stage.", "Four conditional efficiencies multiply to give the path delivery probability.", "Fractional counts are expectations; observed photon counts are integers."],
      omittedFactors: ["Conditional state fidelity and algorithm correctness.", "Resource-state preparation, buffering, feed-forward and code-specific error budgets.", "A universal photonic fault-tolerance threshold."],
      sourceIds: ["[17]", "[18]", "[19]", "[20]"],
    },
  };
}

export type ModelObservation = SamplingObservation | SchedulingObservation | RoutingObservation | PhaseObservation | LossObservation;

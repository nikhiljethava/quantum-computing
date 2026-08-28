import type {
  ArchitectureMap,
  Assessment,
  CircuitRun,
  ExperimentBundle,
  ResultTrust,
  TrustLabel,
} from "@/types/api";

const DEFAULT_CAVEAT = "This trust summary is not QCVV or hardware characterization.";

function cleanLabels(labels: string[] | undefined, fallback: TrustLabel[]): TrustLabel[] {
  return (labels?.length ? labels : fallback) as TrustLabel[];
}

export function assessmentResultTrust(assessment: Assessment | null | undefined): ResultTrust | null {
  if (!assessment) return null;
  if (assessment.result_trust) return assessment.result_trust;
  const isPqc = assessment.problem_class === "CRYPTO_SECURITY";
  return {
    result_type: "Estimated",
    evidence_category: assessment.contract_validity_status === "TUTORIAL_ONLY" ? "tutorial" : "estimate",
    backend: "QALS 3.0 deterministic rules",
    hardware_or_simulator_name: null,
    execution_status: "assessment only",
    estimate_level: "deterministic contract assessment",
    hardware_horizon: assessment.time_horizon,
    qubit_count: null,
    circuit_depth: null,
    one_qubit_gate_count: null,
    two_qubit_gate_count: null,
    shots: null,
    result_distribution: [],
    ideal_or_noisy: null,
    noise_model_description: null,
    classical_baseline_status: isPqc
      ? "not applicable - migration action"
      : assessment.user_inputs.currentClassicalBaseline || assessment.classical_baseline_summary
        ? "declared"
        : "missing",
    contract_validity_status: assessment.contract_validity_status,
    readiness_verdict: assessment.verdict,
    confidence: assessment.confidence,
    time_horizon: assessment.time_horizon,
    trust_labels: cleanLabels(assessment.trust_labels, ["TUTORIAL"]),
    assumptions: assessment.assumptions,
    missing_evidence: assessment.missing_evidence,
    caveats: assessment.caveats,
    provenance: [`Assessment ${assessment.id}`, "QALS 3.0 deterministic Algorithm Contract assessment"],
    generated_at: assessment.updated_at ?? assessment.created_at,
    software_or_model_version: "QALS 3.0 deterministic Algorithm Contract engine",
    source_type: "USER_DECLARED",
    source_organization: "Assessment author and Quantum Foundry deterministic rules",
    source_link: assessment.user_inputs.evidenceLinks?.[0] ?? null,
    publication_date: null,
    last_verified_date: assessment.updated_at ?? assessment.created_at,
    claim_status: "User-declared evidence and deterministic personal-project analysis",
  };
}

export function circuitResultTrust(run: CircuitRun | null | undefined): ResultTrust {
  if (run?.result_trust) return run.result_trust;
  return {
    result_type: "Tutorial",
    evidence_category: "tutorial",
    backend: run?.simulator_backend ?? "simulator",
    hardware_or_simulator_name: run?.simulator_backend ?? "Cirq simulator",
    execution_status: "simulator",
    estimate_level: "educational simulation",
    hardware_horizon: "simulator now; hardware access-controlled",
    qubit_count: run?.num_qubits ?? null,
    circuit_depth: run?.circuit_depth ?? null,
    one_qubit_gate_count: run?.one_qubit_gate_count ?? null,
    two_qubit_gate_count: run?.two_qubit_gate_count ?? null,
    shots: run?.shots ?? null,
    result_distribution: (run?.ideal_histogram ?? run?.histogram ?? []) as unknown as Array<Record<string, unknown>>,
    ideal_or_noisy: run?.ideal_vs_noisy ?? "ideal",
    noise_model_description: run?.assumed_noise_model
      ? `Educational approximation: ${run.assumed_noise_model}`
      : null,
    classical_baseline_status: "not declared - tutorial mode",
    contract_validity_status: "TUTORIAL_ONLY",
    readiness_verdict: "EDUCATION_ONLY",
    confidence: "LOW",
    time_horizon: "SIMULATOR_NOW",
    trust_labels: cleanLabels(run?.trust_labels, ["TUTORIAL", "TOY_SIMULATION"]),
    assumptions: run?.assessment_preview.assumptions ?? [],
    missing_evidence: ["assessment-backed Algorithm Contract", "declared classical baseline"],
    caveats: [...(run?.result_caveats ?? []), "Educational noise is not calibrated hardware noise.", DEFAULT_CAVEAT],
    provenance: run ? [`Circuit run ${run.id}`, `Template ${run.template_key}`] : ["Tutorial preview"],
    generated_at: run?.created_at ?? null,
    software_or_model_version: `${run?.simulator_backend ?? "Cirq"} simulator`,
    source_type: "TUTORIAL",
    source_organization: "Quantum Foundry personal project",
    source_link: null,
    publication_date: null,
    last_verified_date: run?.created_at ?? null,
    claim_status: "Tutorial result; not a business recommendation or hardware measurement",
  };
}

export function bundleResultTrust(bundle: ExperimentBundle | null | undefined): ResultTrust | null {
  if (!bundle) return null;
  if (bundle.result_trust) return bundle.result_trust;
  const metrics = bundle.result_trust_metrics;
  return {
    result_type: metrics.result_type ?? (metrics.backend === "simulator" ? "Simulation" : "Estimated"),
    evidence_category: metrics.evidence_category ?? "estimate",
    backend: metrics.backend,
    hardware_or_simulator_name: metrics.hardware_or_simulator_name ?? metrics.backend,
    execution_status: metrics.execution_status ?? metrics.backend,
    estimate_level: metrics.estimate_level ?? "contract-mode experiment estimate",
    hardware_horizon: metrics.hardware_horizon ?? metrics.time_horizon ?? null,
    qubit_count: metrics.qubit_count ?? metrics.number_of_qubits,
    circuit_depth: metrics.circuit_depth,
    one_qubit_gate_count: metrics.one_qubit_gate_count,
    two_qubit_gate_count: metrics.two_qubit_gate_count,
    shots: metrics.shots,
    result_distribution: metrics.result_distribution ?? (metrics.histogram as unknown as Array<Record<string, unknown>>),
    ideal_or_noisy: metrics.ideal_or_noisy ?? metrics.ideal_vs_noisy,
    noise_model_description: metrics.noise_model_description ?? metrics.assumed_noise_model,
    classical_baseline_status: metrics.classical_baseline_status ?? (bundle.classical_baseline ? "declared" : "missing"),
    contract_validity_status: metrics.contract_validity_status ?? null,
    readiness_verdict: metrics.readiness_verdict ?? null,
    confidence: metrics.confidence ?? null,
    time_horizon: metrics.time_horizon ?? null,
    trust_labels: cleanLabels(metrics.trust_labels ?? bundle.trust_labels, ["BENCHMARK_CANDIDATE"]),
    assumptions: metrics.assumptions ?? [],
    missing_evidence: metrics.missing_evidence ?? bundle.next_evidence_required,
    caveats: metrics.caveats ?? bundle.limitations,
    provenance: metrics.provenance ?? [`Experiment Bundle ${bundle.id}`, `Algorithm Contract ${bundle.contract_id}`],
    generated_at: metrics.generated_at ?? bundle.created_at,
    software_or_model_version: metrics.software_or_model_version ?? "Quantum Foundry Result Trust v1",
    source_type: metrics.source_type ?? "USER_DECLARED",
    source_organization: metrics.source_organization ?? "Assessment author and Quantum Foundry experiment service",
    source_link: metrics.source_link ?? null,
    publication_date: metrics.publication_date ?? null,
    last_verified_date: metrics.last_verified_date ?? metrics.generated_at ?? bundle.created_at,
    claim_status: metrics.claim_status ?? "Contract-mode output pending independent reproduction",
  };
}

export function architectureResultTrust(map: ArchitectureMap | null | undefined): ResultTrust | null {
  if (!map) return null;
  if (map.result_trust) return map.result_trust;
  return {
    result_type: "Estimated",
    evidence_category: "estimate",
    backend: "deterministic architecture mapper",
    hardware_or_simulator_name: null,
    execution_status: "architecture estimate",
    estimate_level: "reference architecture",
    hardware_horizon: map.time_horizon,
    qubit_count: null,
    circuit_depth: null,
    one_qubit_gate_count: null,
    two_qubit_gate_count: null,
    shots: null,
    result_distribution: [],
    ideal_or_noisy: null,
    noise_model_description: null,
    classical_baseline_status: map.problem_class === "CRYPTO_SECURITY" ? "not applicable - migration action" : "not recorded",
    contract_validity_status: null,
    readiness_verdict: null,
    confidence: null,
    time_horizon: map.time_horizon,
    trust_labels: cleanLabels(map.trust_labels, ["TUTORIAL"]),
    assumptions: map.assumptions,
    missing_evidence: [],
    caveats: [DEFAULT_CAVEAT],
    provenance: [map.id ? `Architecture map ${map.id}` : "Transient architecture map"],
    generated_at: map.created_at,
    software_or_model_version: "Quantum Foundry Result Trust v1",
    source_type: "PERSONAL_ANALYSIS",
    source_organization: "Quantum Foundry personal project",
    source_link: null,
    publication_date: null,
    last_verified_date: map.created_at,
    claim_status: "Deterministic architecture estimate, not an official reference architecture",
  };
}

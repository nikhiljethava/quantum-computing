/**
 * Typed API types mirrored from the backend Pydantic schemas.
 */

export type IndustryTag =
  | "pharma"
  | "finance"
  | "logistics"
  | "energy"
  | "materials"
  | "aerospace"
  | "other";

export type Horizon = "near-term" | "mid-term" | "long-term";
export type JobType =
  | "coin_flip"
  | "bell_state"
  | "grover"
  | "routing"
  | "chemistry"
  | "session_summary_export"
  | "opportunity_memo_export";
export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type ArtifactType =
  | "job_output"
  | "cirq_code"
  | "colab_notebook"
  | "assessment_json"
  | "architecture_json"
  | "session_summary"
  | "opportunity_memo";
export type ProjectStatus = "draft" | "active" | "archived";
export type AssessmentRecommendation =
  | "classical_now"
  | "hybrid_pilot_now"
  | "watchlist"
  | "research_only";
export type ProblemClass =
  | "QUANTUM_SIMULATION"
  | "OPTIMIZATION"
  | "SEARCH"
  | "LINEAR_SYSTEMS"
  | "CRYPTO_SECURITY"
  | "QUANTUM_ML"
  | "COMMUNICATION"
  | "UNKNOWN";
export type Verdict =
  | "CLASSICAL_FIRST"
  | "EDUCATION_ONLY"
  | "BENCHMARK_FIRST"
  | "SIMULATOR_PROTOTYPE_NOW"
  | "RESEARCH_PARTNERSHIP"
  | "FUTURE_FTQC"
  | "PQC_MIGRATION_NOW";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type TimeHorizon =
  | "NOW_CLASSICAL"
  | "SIMULATOR_NOW"
  | "NISQ_EXPLORATION"
  | "HARDWARE_GATED"
  | "FTQC_LATER";
export type TrustLabel =
  | "TUTORIAL"
  | "TOY_SIMULATION"
  | "BENCHMARK_CANDIDATE"
  | "RESEARCH_CANDIDATE"
  | "HARDWARE_GATED"
  | "FTQC_LATER"
  | "ACTION_NOW";
export type BuildEligibility = "ELIGIBLE" | "LIMITED" | "BLOCKED" | "TUTORIAL_ONLY";

export interface UseCaseBlueprint {
  persona: string;
  business_kpi: string;
  classical_baseline: string;
  hybrid_pattern: string;
  pilot_scope_weeks: number;
  sample_input: string;
  success_thresholds: string[];
  next_90_days: string[];
  google_stack: string[];
  maturity_label:
    | "learn_now"
    | "simulate_now"
    | "pilot_carefully"
    | "research_only"
    | "future_fault_tolerant_required"
    | "approved_hardware_access_only";
  recommended_lessons: string[];
  recommended_labs: string[];
  google_cloud_architecture_notes: string[];
  hardware_access_note: string;
}

export interface UseCaseEvidenceItem {
  title: string;
  publisher: string;
  published_at: string;
  claim: string;
  source_url: string;
}

export interface UseCase {
  id: string;
  slug: string | null;
  title: string;
  industry: IndustryTag;
  description: string;
  quantum_approach: string;
  complexity_score: number;
  horizon: Horizon;
  featured: boolean;
  featured_rank: number | null;
  blueprint: Partial<UseCaseBlueprint>;
  evidence_items: UseCaseEvidenceItem[];
  created_at: string;
}

export interface UseCaseList {
  items: UseCase[];
  total: number;
}

export interface AssessmentInputs {
  industry?: string;
  objective?: string;
  problemClass?: ProblemClass;
  problemDescription?: string;
  businessValue?: string;
  dataType?: string;
  problemSize?: string;
  constraints?: string;
  accuracyNeeds?: string;
  latencyTolerance?: string;
  currentClassicalBaseline?: string;
  baselineMetrics?: string;
  currentSolverOrWorkflow?: string;
  knownAlgorithmsConsidered?: string;
  evidenceLinks?: string[];
  userFilesOrNotes?: string;
  securityCryptoInventory?: Record<string, unknown>;
  problem_size?: "small" | "medium" | "large" | "very_large";
  data_structure?: "unstructured" | "structured" | "quantum_native";
  classical_hardness?: "easy" | "medium" | "hard" | "intractable";
  timeline?: "now" | "1-2 years" | "2-3 years" | "5+ years";
}

export interface Assessment {
  id: string;
  use_case_id: string;
  user_inputs: AssessmentInputs;
  qals_score: number;
  verdict: string;
  score_breakdown: Record<string, number>;
  recommendation: AssessmentRecommendation;
  readiness_score: number;
  confidence: Confidence;
  time_horizon: TimeHorizon;
  trust_labels: TrustLabel[];
  problem_class: ProblemClass;
  plain_english_recommendation: string;
  classical_baseline_summary: string;
  quantum_candidate_summary: string;
  evidence_used: string[];
  missing_evidence: string[];
  assumptions: string[];
  caveats: string[];
  next_best_action: string;
  build_eligibility: BuildEligibility;
  recommended_experiment_type: string;
  hardware_assumptions: string[];
  exportable_memo: string;
  why_promising: string[];
  why_not_now: string[];
  top_blockers: string[];
  next_90_days: string[];
  created_at: string;
}

export interface ExperimentBundleCreate {
  queue_simulation?: boolean;
}

export interface ResultTrustMetrics {
  backend: "simulator" | "stub" | "hardware" | string;
  number_of_qubits: number | null;
  circuit_depth: number | null;
  one_qubit_gate_count: number | null;
  two_qubit_gate_count: number | null;
  shots: number | null;
  histogram: HistogramEntry[];
  ideal_vs_noisy: string | null;
  assumed_noise_model: string | null;
  hardware_readiness_label: string;
  caveats: string[];
}

export interface ExperimentBundle {
  id: string;
  assessment_id: string;
  simulation_job_id: string | null;
  title: string;
  hypothesis: string;
  classical_baseline: string;
  quantum_candidate: string;
  toy_implementation: Record<string, unknown>;
  result_trust_metrics: ResultTrustMetrics;
  limitations: string[];
  next_evidence_required: string[];
  gcp_map: {
    title: string;
    summary: string;
    components: GcpComponent[];
    connections: string[][];
    notes: string[];
    time_horizon?: string;
    assumptions?: string[];
  };
  export_artifacts: Array<Record<string, unknown>>;
  trust_labels: TrustLabel[];
  created_at: string;
}

export interface MemoExport {
  job: Job;
  artifact: Artifact;
}

export interface SimulationJobCreate {
  assessment_id?: string;
  experiment_bundle_id?: string;
  job_type: JobType;
  payload?: Record<string, unknown>;
}

export interface JobCreate {
  job_type: JobType;
  payload?: Record<string, unknown>;
}

export interface Job {
  id: string;
  job_type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  logs: string[];
  result_artifact_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface CircuitTemplate {
  key: JobType;
  label: string;
  badge: string;
  concept: string;
  prompt: string;
}

export interface HistogramEntry {
  state: string;
  count: number;
  probability: number;
}

export interface AssessmentPreview {
  score: number;
  verdict: string;
  horizon: string;
  confidence: string;
  trust_labels: TrustLabel[];
  explanation: string[];
  assumptions: string[];
  public_signals: string[];
  next_action: string;
  score_breakdown: Record<string, number>;
}

export interface CircuitRunCreate {
  template_key: JobType;
  prompt?: string;
  use_case_id?: string;
  session_id?: string;
  repetitions?: number;
  simulator_backend?: "cirq" | "qsim";
  noise_enabled?: boolean;
  noise_level?: number;
  include_state_preview?: boolean;
}

export interface StateAmplitude {
  basis_state: string;
  real: number;
  imag: number;
  magnitude: number;
  phase: number;
  probability: number;
}

export interface BasisProbability {
  basis_state: string;
  probability: number;
}

export interface StatePreview {
  available: boolean;
  reason: string | null;
  top_amplitudes: StateAmplitude[];
  basis_probabilities: BasisProbability[];
}

export interface CircuitVisualDraftNode {
  type: "gate" | "control" | "target" | "measure" | "label";
  lane: number;
  column: number;
  label?: string;
  target_lane?: number;
  tone?: "primary" | "secondary" | "accent" | "warn" | "neutral";
}

export interface GeminiCircuitUpdateRequest {
  api_key: string;
  instruction: string;
  model_name?: string;
  starter_key?: JobType;
  wires: string[];
  nodes: CircuitVisualDraftNode[];
  prompt?: string;
  guide_response?: string;
  explanation?: string;
  use_case_title?: string;
}

export interface GeminiCircuitUpdateResponse {
  model_name: string;
  guide_response: string;
  explanation: string;
  nodes: CircuitVisualDraftNode[];
}

export interface CircuitRun {
  id: string;
  session_id: string | null;
  use_case_id: string | null;
  template_key: JobType;
  label: string;
  badge: string;
  concept: string;
  prompt: string;
  guide_response: string;
  explanation: string;
  circuit_text: string;
  cirq_code: string;
  histogram: HistogramEntry[];
  measurements: Record<string, unknown>;
  metadata: Record<string, unknown>;
  assessment_preview: AssessmentPreview;
  simulator_backend: string;
  simulator_warning: string | null;
  num_qubits: number | null;
  gate_count: number | null;
  one_qubit_gate_count: number | null;
  two_qubit_gate_count: number | null;
  circuit_depth: number | null;
  shots: number | null;
  ideal_vs_noisy: string | null;
  assumed_noise_model: string | null;
  hardware_readiness_label: string | null;
  trust_labels: TrustLabel[];
  result_caveats: string[];
  measurement_keys: string[];
  ideal_histogram: HistogramEntry[] | null;
  noisy_histogram: HistogramEntry[] | null;
  state_preview: StatePreview | null;
  created_at: string;
}

export interface GcpComponent {
  id: string;
  name: string;
  service: string;
  description: string;
}

export interface ArchitectureRequest {
  circuit_run_id?: string;
  job_id?: string;
  assessment_id?: string;
  use_case_id?: string;
}

export interface ArchitectureMap {
  id: string | null;
  circuit_run_id: string | null;
  assessment_id: string | null;
  use_case_id: string | null;
  title: string;
  summary: string;
  components: GcpComponent[];
  connections: string[][];
  notes: string[];
  created_at: string | null;
}

export interface ArtifactCreate {
  artifact_type: ArtifactType;
  circuit_run_id?: string;
  architecture_record_id?: string;
}

export interface Artifact {
  id: string;
  artifact_type: ArtifactType;
  job_id: string | null;
  circuit_run_id: string | null;
  architecture_record_id: string | null;
  assessment_id: string | null;
  filename: string;
  content_type: string;
  storage_uri: string;
  size_bytes: number;
  download_path: string;
  created_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectList {
  items: Project[];
  total: number;
}

export interface SessionCreate {
  project_id?: string;
  selected_use_case_id?: string;
  title: string;
  current_mode?: string;
  starter_key: string;
  notes?: Record<string, unknown>;
  latest_circuit_run_id?: string;
}

export interface SessionUpdate {
  project_id?: string;
  selected_use_case_id?: string;
  title?: string;
  current_mode?: string;
  starter_key?: string;
  notes?: Record<string, unknown>;
  latest_circuit_run_id?: string;
}

export interface SavedSession {
  id: string;
  project_id: string | null;
  project_name: string | null;
  selected_use_case_id: string | null;
  title: string;
  current_mode: string;
  starter_key: string;
  notes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SessionList {
  items: SavedSession[];
  total: number;
}

export interface SessionDetail extends SavedSession {
  latest_circuit_run: CircuitRun | null;
  latest_architecture: ArchitectureMap | null;
  artifacts: Artifact[];
}

export interface CityUsageSummary {
  city: string;
  count: number;
}

export interface PageUsageRecord {
  id: string;
  page_path: string;
  visitor_id: string | null;
  city: string;
  created_at: string;
}

export interface PageUsageSummary {
  total_visits: number;
  unique_visitors: number;
  window_days: number;
  by_city: CityUsageSummary[];
}

export type GuidePageContext = "learn" | "build" | "explore" | "assess" | "map" | "general";
export type GuideSourceType =
  | "app_lesson"
  | "app_use_case"
  | "google_doc"
  | "google_cloud_doc"
  | "google_search";
export type GuideActionType = "lesson" | "build" | "assess" | "map" | "use_case";

export interface GuideAskRequest {
  question: string;
  page_context: GuidePageContext;
  lesson_slug?: string | null;
  use_case_id?: string | null;
  circuit_run_id?: string | null;
  architecture_id?: string | null;
  allow_google_search_grounding?: boolean;
}

export interface GuideSource {
  title: string;
  url: string | null;
  source_type: GuideSourceType;
}

export interface GuideNextAction {
  label: string;
  href: string;
  action_type: GuideActionType;
}

export interface GuideAskResponse {
  answer: string;
  cited_sources: GuideSource[];
  recommended_next_actions: GuideNextAction[];
  safety_notes: string[];
}

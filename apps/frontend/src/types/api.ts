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
export type JobType = "coin_flip" | "bell_state" | "grover" | "routing" | "chemistry";
export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface UseCase {
  id: string;
  title: string;
  industry: IndustryTag;
  description: string;
  quantum_approach: string;
  complexity_score: number;
  horizon: Horizon;
  created_at: string;
}

export interface UseCaseList {
  items: UseCase[];
  total: number;
}

export interface AssessmentInputs {
  problem_size: "small" | "medium" | "large" | "very_large";
  data_structure: "unstructured" | "structured" | "quantum_native";
  classical_hardness: "easy" | "medium" | "hard" | "intractable";
  timeline: "now" | "1-2 years" | "2-3 years" | "5+ years";
}

export interface Assessment {
  id: string;
  use_case_id: string;
  user_inputs: AssessmentInputs;
  qals_score: number;
  verdict: string;
  score_breakdown: Record<string, number>;
  created_at: string;
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
  error_message: string | null;
  created_at: string;
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

/**
 * Typed API types — mirrors backend Pydantic schemas.
 * Update these when the API contract changes.
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

// Assessment

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

// Jobs

export type JobType = "coin_flip" | "bell_state" | "grover" | "routing" | "chemistry";
export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface JobCreate {
  job_type: JobType;
  payload?: Record<string, unknown>;
}

export interface Job {
  id: string;
  job_type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: CircuitResult | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CircuitResult {
  circuit_text: string;
  histogram: Record<string, number>;
  metadata: CircuitMetadata;
  artifact_uri: string;
}

export interface CircuitMetadata {
  name: string;
  num_qubits: number;
  description: string;
  concept: string;
  repetitions: number;
  [key: string]: unknown;
}

// Architecture

export interface GcpComponent {
  id: string;
  name: string;
  service: string;
  description: string;
}

export interface ArchitectureMap {
  title: string;
  summary: string;
  components: GcpComponent[];
  connections: [string, string][];
  notes: string[];
}

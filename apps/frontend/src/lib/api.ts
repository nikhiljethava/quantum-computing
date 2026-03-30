/**
 * Typed fetch wrappers for backend endpoints.
 */

import {
  Artifact,
  ArtifactCreate,
  ArchitectureMap,
  ArchitectureRequest,
  Assessment,
  AssessmentInputs,
  CircuitRun,
  CircuitRunCreate,
  CircuitTemplate,
  IndustryTag,
  Job,
  JobCreate,
  UseCase,
  UseCaseList,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  return res.json() as Promise<T>;
}

export async function fetchUseCases(params?: {
  industry?: IndustryTag;
  limit?: number;
}): Promise<UseCaseList> {
  const query = new URLSearchParams();
  if (params?.industry) query.set("industry", params.industry);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString() ? `?${query}` : "";
  return apiFetch<UseCaseList>(`/api/v1/use-cases${qs}`);
}

export async function fetchUseCase(id: string): Promise<UseCase> {
  return apiFetch<UseCase>(`/api/v1/use-cases/${id}`);
}

export async function createAssessment(
  use_case_id: string,
  user_inputs: AssessmentInputs,
): Promise<Assessment> {
  return apiFetch<Assessment>("/api/v1/assessments", {
    method: "POST",
    body: JSON.stringify({ use_case_id, user_inputs }),
  });
}

export async function fetchCircuitTemplates(): Promise<CircuitTemplate[]> {
  return apiFetch<CircuitTemplate[]>("/api/v1/circuits/templates");
}

export async function runCircuit(body: CircuitRunCreate): Promise<CircuitRun> {
  return apiFetch<CircuitRun>("/api/v1/circuits/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchCircuitRun(id: string): Promise<CircuitRun> {
  return apiFetch<CircuitRun>(`/api/v1/circuits/runs/${id}`);
}

export async function submitJob(body: JobCreate): Promise<Job> {
  return apiFetch<Job>("/api/v1/jobs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchJob(id: string): Promise<Job> {
  return apiFetch<Job>(`/api/v1/jobs/${id}`);
}

export async function fetchJobs(status?: string): Promise<Job[]> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Job[]>(`/api/v1/jobs${qs}`);
}

export async function fetchArchitecture(params: ArchitectureRequest): Promise<ArchitectureMap> {
  return apiFetch<ArchitectureMap>("/api/v1/architectures", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createArtifact(body: ArtifactCreate): Promise<Artifact> {
  return apiFetch<Artifact>("/api/v1/artifacts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getArtifactDownloadUrl(artifactId: string): string {
  return `${BASE_URL}/api/v1/artifacts/${artifactId}/download`;
}

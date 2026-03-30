/**
 * API client — typed fetch wrappers for all backend endpoints.
 * All functions throw on non-2xx responses with a structured error.
 */

import {
  ArchitectureMap,
  Assessment,
  AssessmentInputs,
  Job,
  JobCreate,
  UseCase,
  UseCaseList,
  IndustryTag,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
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

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------

export async function createAssessment(
  use_case_id: string,
  user_inputs: AssessmentInputs
): Promise<Assessment> {
  return apiFetch<Assessment>("/api/v1/assessments", {
    method: "POST",
    body: JSON.stringify({ use_case_id, user_inputs }),
  });
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------

export async function fetchArchitecture(params: {
  job_id?: string;
  assessment_id?: string;
  use_case_id?: string;
}): Promise<ArchitectureMap> {
  return apiFetch<ArchitectureMap>("/api/v1/architectures", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

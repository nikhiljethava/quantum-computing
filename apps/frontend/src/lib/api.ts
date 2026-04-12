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
  GeminiCircuitUpdateRequest,
  GeminiCircuitUpdateResponse,
  CircuitRun,
  CircuitRunCreate,
  CircuitTemplate,
  IndustryTag,
  Job,
  JobCreate,
  Project,
  ProjectCreate,
  ProjectList,
  PageUsageSummary,
  PageUsageRecord,
  SavedSession,
  SessionCreate,
  SessionDetail,
  SessionList,
  SessionUpdate,
  UseCase,
  UseCaseList,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 12000;

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
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: controller.signal,
      ...init,
    });
  } catch (error) {
    globalThis.clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        504,
        `The backend did not respond within ${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds.`,
      );
    }

    throw new ApiError(
      503,
      `Unable to reach the backend at ${BASE_URL}.`,
    );
  }

  globalThis.clearTimeout(timeoutId);

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

export async function fetchProjects(limit = 20): Promise<ProjectList> {
  return apiFetch<ProjectList>(`/api/v1/projects?limit=${limit}`);
}

export async function createProject(body: ProjectCreate): Promise<Project> {
  return apiFetch<Project>("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchSessions(params?: {
  project_id?: string;
  limit?: number;
}): Promise<SessionList> {
  const query = new URLSearchParams();
  if (params?.project_id) query.set("project_id", params.project_id);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString() ? `?${query}` : "";
  return apiFetch<SessionList>(`/api/v1/sessions${qs}`);
}

export async function fetchSession(id: string): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/api/v1/sessions/${id}`);
}

export async function createSession(body: SessionCreate): Promise<SavedSession> {
  return apiFetch<SavedSession>("/api/v1/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSession(id: string, body: SessionUpdate): Promise<SavedSession> {
  return apiFetch<SavedSession>(`/api/v1/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
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

export async function geminiUpdateCircuit(
  body: GeminiCircuitUpdateRequest,
): Promise<GeminiCircuitUpdateResponse> {
  return apiFetch<GeminiCircuitUpdateResponse>("/api/v1/circuits/gemini-update", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

export async function fetchJobs(status?: string, limit = 40): Promise<Job[]> {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  query.set("limit", String(limit));
  const qs = `?${query.toString()}`;
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

export async function recordUsage(body: { page_path: string; visitor_id: string }): Promise<PageUsageRecord> {
  return apiFetch<PageUsageRecord>("/api/v1/usage", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchUsageSummary(page_path?: string): Promise<PageUsageSummary> {
  const query = new URLSearchParams();
  if (page_path) query.set("page_path", page_path);
  const qs = query.toString() ? `?${query}` : "";
  return apiFetch<PageUsageSummary>(`/api/v1/usage${qs}`);
}

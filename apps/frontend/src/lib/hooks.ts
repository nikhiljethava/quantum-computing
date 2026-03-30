/**
 * React Query hooks for all API endpoints.
 * Provides polling, caching, and loading/error state management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUseCases,
  fetchUseCase,
  createAssessment,
  submitJob,
  fetchJob,
  fetchJobs,
  fetchArchitecture,
} from "@/lib/api";
import { AssessmentInputs, IndustryTag, JobCreate, JobStatus } from "@/types/api";

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

export function useUseCases(industry?: IndustryTag) {
  return useQuery({
    queryKey: ["use-cases", industry],
    queryFn: () => fetchUseCases({ industry }),
  });
}

export function useUseCase(id: string | null) {
  return useQuery({
    queryKey: ["use-case", id],
    queryFn: () => fetchUseCase(id!),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      use_case_id,
      user_inputs,
    }: {
      use_case_id: string;
      user_inputs: AssessmentInputs;
    }) => createAssessment(use_case_id, user_inputs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export function useSubmitJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JobCreate) => submitJob(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useJob(id: string | null) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => fetchJob(id!),
    enabled: !!id,
    // Poll every 1.5s when job is pending or running
    refetchInterval: (query) => {
      const status = query.state.data?.status as JobStatus | undefined;
      if (status === "PENDING" || status === "RUNNING") return 1500;
      return false;
    },
  });
}

export function useJobs(status?: string) {
  return useQuery({
    queryKey: ["jobs", status],
    queryFn: () => fetchJobs(status),
  });
}

// ---------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------

export function useArchitecture(params: {
  job_id?: string;
  assessment_id?: string;
  use_case_id?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = params;
  return useQuery({
    queryKey: ["architecture", params],
    queryFn: () => fetchArchitecture(rest),
    enabled: enabled && !!(rest.job_id || rest.assessment_id || rest.use_case_id),
  });
}

/**
 * React Query hooks for backend endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createArtifact,
  createAssessment,
  fetchArchitecture,
  fetchCircuitRun,
  fetchCircuitTemplates,
  fetchJob,
  fetchJobs,
  fetchUseCase,
  fetchUseCases,
  runCircuit,
  submitJob,
} from "@/lib/api";
import {
  ArtifactCreate,
  ArchitectureRequest,
  AssessmentInputs,
  CircuitRunCreate,
  IndustryTag,
  JobCreate,
  JobStatus,
} from "@/types/api";

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

export function useCircuitTemplates() {
  return useQuery({
    queryKey: ["circuit-templates"],
    queryFn: fetchCircuitTemplates,
    staleTime: 1000 * 60 * 10,
  });
}

export function useRunCircuit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CircuitRunCreate) => runCircuit(body),
    onSuccess: (run) => {
      qc.setQueryData(["circuit-run", run.id], run);
    },
  });
}

export function useCircuitRun(id: string | null) {
  return useQuery({
    queryKey: ["circuit-run", id],
    queryFn: () => fetchCircuitRun(id!),
    enabled: !!id,
  });
}

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

export function useArchitecture(params: {
  circuit_run_id?: string;
  job_id?: string;
  assessment_id?: string;
  use_case_id?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = params;
  return useQuery({
    queryKey: ["architecture", params],
    queryFn: () => fetchArchitecture(rest),
    enabled:
      enabled &&
      !!(rest.circuit_run_id || rest.job_id || rest.assessment_id || rest.use_case_id),
  });
}

export function useGenerateArchitecture() {
  return useMutation({
    mutationFn: (body: ArchitectureRequest) => fetchArchitecture(body),
  });
}

export function useCreateArtifact() {
  return useMutation({
    mutationFn: (body: ArtifactCreate) => createArtifact(body),
  });
}

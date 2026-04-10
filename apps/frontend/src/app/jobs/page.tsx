"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileClock,
  FolderOpen,
  ListTodo,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { fetchUsageSummary, getArtifactDownloadUrl, recordUsage } from "@/lib/api";
import { useJob, useJobs } from "@/lib/hooks";
import { PageUsageSummary } from "@/types/api";
import { getStarterStory, normalizeStarterKey } from "@/lib/studio-mocks";
import { Job, JobStatus, JobType } from "@/types/api";

const FILTERS: Array<{ label: string; value: JobStatus | "ALL" }> = [
  { label: "All jobs", value: "ALL" },
  { label: "Queued", value: "PENDING" },
  { label: "Running", value: "RUNNING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

function formatTime(value: string | null) {
  if (!value) return "Not started";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatter.format(new Date(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

function readNumber(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : null;
}

function formatJobType(jobType: JobType) {
  if (jobType === "session_summary_export") {
    return {
      label: "Session summary export",
      badge: "Background export",
      description:
        "Packages the latest run, architecture narrative, and readiness framing into a reusable markdown brief.",
    };
  }

  const starter = getStarterStory(jobType);
  return {
    label: starter.label,
    badge: starter.badge,
    description:
      "Persists a simulator-backed circuit run, then attaches a hybrid GCP architecture snapshot for the workspace.",
  };
}

function formatStatusLabel(status: JobStatus) {
  switch (status) {
    case "PENDING":
      return "Queued";
    case "RUNNING":
      return "Running";
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
  }
}

function statusClasses(status: JobStatus) {
  switch (status) {
    case "PENDING":
      return "bg-[#fff7ed] text-[#c2410c]";
    case "RUNNING":
      return "bg-[#eef2ff] text-[#2f5be3]";
    case "COMPLETED":
      return "bg-[#dcfce7] text-[#157052]";
    case "FAILED":
      return "bg-[#fff1f2] text-[#b91c1c]";
  }
}

function buildQuery(params: {
  status?: JobStatus | "ALL";
  jobId?: string | null;
}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.jobId) {
    query.set("job_id", params.jobId);
  }
  return query.toString() ? `/jobs?${query.toString()}` : "/jobs";
}

function buildJobWorkspaceHref(job: Job) {
  const payload = isRecord(job.payload) ? job.payload : null;
  const result = isRecord(job.result) ? job.result : null;

  const sessionId = readString(result, "session_id") ?? readString(payload, "session_id");
  const useCaseId = readString(result, "use_case_id") ?? readString(payload, "use_case_id");

  if (job.job_type === "session_summary_export") {
    return sessionId ? `/build?session_id=${sessionId}` : null;
  }

  const params = new URLSearchParams();
  params.set("starter", normalizeStarterKey(job.job_type));
  if (sessionId) params.set("session_id", sessionId);
  if (useCaseId) params.set("use_case_id", useCaseId);
  return `/build?${params.toString()}`;
}

function buildSessionLibraryHref(job: Job) {
  const payload = isRecord(job.payload) ? job.payload : null;
  const result = isRecord(job.result) ? job.result : null;
  const sessionId = readString(result, "session_id") ?? readString(payload, "session_id");
  if (!sessionId) return null;
  return `/sessions?session_id=${sessionId}`;
}

function buildArtifactHref(job: Job) {
  const result = isRecord(job.result) ? job.result : null;
  const artifactId = readString(result, "artifact_id");
  return artifactId ? getArtifactDownloadUrl(artifactId) : null;
}

function buildSummary(job: Job) {
  const meta = formatJobType(job.job_type);
  if (job.job_type === "session_summary_export") {
    if (job.status === "PENDING") return "Queued to package a markdown session brief for the current workspace.";
    if (job.status === "RUNNING") return "The worker is assembling a summary bundle and attaching it to session history.";
    if (job.status === "COMPLETED") return "The summary export completed and is available as a downloadable artifact.";
    return "The export failed before the markdown brief could be attached to the workspace.";
  }

  if (job.status === "PENDING") return `${meta.label} is queued for background simulation and persistence.`;
  if (job.status === "RUNNING") return `${meta.label} is running on the worker and will rehydrate the Build workspace when complete.`;
  if (job.status === "COMPLETED") return `${meta.label} finished successfully with a persisted circuit run and architecture snapshot.`;
  return `${meta.label} failed before the worker could save the prototype outputs.`;
}

function buildPayloadRows(job: Job) {
  const payload = isRecord(job.payload) ? job.payload : null;
  if (!payload) return [] as Array<[string, string]>;

  const rows: Array<[string, string]> = [];
  const prompt = readString(payload, "prompt");
  const sessionId = readString(payload, "session_id");
  const useCaseId = readString(payload, "use_case_id");
  const circuitRunId = readString(payload, "circuit_run_id");
  const architectureRecordId = readString(payload, "architecture_record_id");
  const repetitions = readNumber(payload, "repetitions");
  const numQubits = readNumber(payload, "num_qubits");
  const numCities = readNumber(payload, "num_cities");
  const markedState = readString(payload, "marked_state");

  if (prompt) rows.push(["Prompt", prompt]);
  if (sessionId) rows.push(["Session", sessionId]);
  if (useCaseId) rows.push(["Use case", useCaseId]);
  if (circuitRunId) rows.push(["Circuit run", circuitRunId]);
  if (architectureRecordId) rows.push(["Architecture", architectureRecordId]);
  if (repetitions !== null) rows.push(["Repetitions", String(repetitions)]);
  if (numQubits !== null) rows.push(["Num qubits", String(numQubits)]);
  if (numCities !== null) rows.push(["Num cities", String(numCities)]);
  if (markedState) rows.push(["Marked state", markedState]);

  return rows;
}

function buildResultRows(job: Job) {
  const result = isRecord(job.result) ? job.result : null;
  if (!result) return [] as Array<[string, string]>;

  const rows: Array<[string, string]> = [];
  const circuitRunId = readString(result, "circuit_run_id");
  const sessionId = readString(result, "session_id");
  const useCaseId = readString(result, "use_case_id");
  const artifactId = readString(result, "artifact_id");
  const filename = readString(result, "filename");
  const contentType = readString(result, "content_type");
  const sizeBytes = readNumber(result, "size_bytes");
  const outputBytes = readNumber(result, "job_output_size");
  const architecture = isRecord(result.architecture) ? result.architecture : null;
  const architectureId = readString(architecture, "id");

  if (circuitRunId) rows.push(["Circuit run", circuitRunId]);
  if (architectureId) rows.push(["Architecture", architectureId]);
  if (sessionId) rows.push(["Session", sessionId]);
  if (useCaseId) rows.push(["Use case", useCaseId]);
  if (artifactId) rows.push(["Artifact", artifactId]);
  if (filename) rows.push(["Filename", filename]);
  if (contentType) rows.push(["Content type", contentType]);
  if (sizeBytes !== null) rows.push(["Artifact size", `${sizeBytes.toLocaleString()} bytes`]);
  if (outputBytes !== null) rows.push(["Output snapshot", `${outputBytes.toLocaleString()} bytes`]);

  return rows;
}

function JobListCard({
  jobs,
  selectedJobId,
  filter,
}: {
  jobs: Job[];
  selectedJobId: string | null;
  filter: JobStatus | "ALL";
}) {
  return (
    <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Job activity
          </div>
          <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
            Worker queue and recent outcomes
          </h2>
        </div>
        <div className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]">
          {jobs.length} visible
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const isActive = item.value === filter;
          return (
            <Link
              key={item.value}
              href={buildQuery({ status: item.value, jobId: selectedJobId })}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#2f5be3] text-white shadow-[0_12px_24px_rgba(47,91,227,0.22)]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {jobs.length ? (
          jobs.map((job) => {
            const meta = formatJobType(job.job_type);
            const isSelected = job.id === selectedJobId;
            return (
              <Link
                key={job.id}
                href={buildQuery({ status: filter, jobId: job.id })}
                className={`block rounded-[22px] border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-[#2f5be3] bg-[#eef2ff] shadow-[0_14px_30px_rgba(47,91,227,0.12)]"
                    : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#c7d7f4] hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{meta.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{meta.badge}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses(job.status)}`}
                  >
                    {formatStatusLabel(job.status)}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">{buildSummary(job)}</p>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Created {formatTime(job.created_at)}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-6 text-sm leading-7 text-slate-500">
            No jobs match this filter yet. Queue a background run or a session summary export from the Hybrid Lab.
          </div>
        )}
      </div>
    </div>
  );
}

function JobDetailPanel({ job }: { job: Job }) {
  const meta = formatJobType(job.job_type);
  const workspaceHref = buildJobWorkspaceHref(job);
  const sessionHref = buildSessionLibraryHref(job);
  const artifactHref = buildArtifactHref(job);
  const payloadRows = buildPayloadRows(job);
  const resultRows = buildResultRows(job);
  const activeIcon =
    job.status === "COMPLETED" ? (
      <CheckCircle2 className="h-5 w-5 text-[#157052]" />
    ) : job.status === "FAILED" ? (
      <AlertTriangle className="h-5 w-5 text-[#b91c1c]" />
    ) : job.status === "RUNNING" ? (
      <LoaderCircle className="h-5 w-5 animate-spin text-[#2f5be3]" />
    ) : (
      <FileClock className="h-5 w-5 text-[#c2410c]" />
    );

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
                Worker activity
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusClasses(job.status)}`}>
                {formatStatusLabel(job.status)}
              </span>
            </div>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-black tracking-[-0.04em] text-slate-900">
              {meta.label}
            </h2>
            <p className="mt-3 max-w-[760px] text-[1rem] leading-8 text-slate-600">
              {meta.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {workspaceHref ? (
              <Link
                href={workspaceHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.28)] transition hover:-translate-y-[1px]"
              >
                Open in Hybrid Lab
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            {sessionHref ? (
              <Link
                href={sessionHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
              >
                Open saved session
                <FolderOpen className="h-4 w-4" />
              </Link>
            ) : null}
            {artifactHref ? (
              <a
                href={artifactHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
              >
                Download artifact
                <Download className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Created", formatTime(job.created_at)],
            ["Started", formatTime(job.started_at)],
            ["Completed", formatTime(job.completed_at)],
            ["Job id", job.id],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              {activeIcon}
              Job summary
            </div>
            <p className="text-sm leading-7 text-slate-600">{buildSummary(job)}</p>
            {job.error_message ? (
              <div className="mt-4 rounded-[20px] border border-[#fecaca] bg-[#fff1f2] p-4 text-sm leading-7 text-[#b91c1c]">
                {job.error_message}
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-[#2f5be3]" />
                Payload context
              </div>
              <div className="space-y-3">
                {payloadRows.length ? (
                  payloadRows.map(([label, value]) => (
                    <div key={label} className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-700">{value}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-500">
                    This job did not need extra payload context beyond its type.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ListTodo className="h-4 w-4 text-[#2f5be3]" />
                Result attachments
              </div>
              <div className="space-y-3">
                {resultRows.length ? (
                  resultRows.map(([label, value]) => (
                    <div key={label} className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-700">{value}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-500">
                    No result metadata is attached yet. Active jobs will populate this panel as the worker progresses.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock3 className="h-4 w-4 text-[#2f5be3]" />
              Timing
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>Queued at {formatTime(job.created_at)}.</p>
              <p>{job.started_at ? `Started at ${formatTime(job.started_at)}.` : "Waiting for the worker to claim the job."}</p>
              <p>{job.completed_at ? `Finished at ${formatTime(job.completed_at)}.` : "Completion will appear here when the worker finishes."}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4 text-[#2f5be3]" />
              Why this matters
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>Jobs make the product feel persistent instead of request-and-forget.</p>
              <p>Background runs keep the Hybrid Lab responsive while the worker saves real artifacts and architecture state.</p>
              <p>Exports stay attached to the same product record, which makes follow-up demos and reviews easier.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyJobState() {
  return (
    <div className="rounded-[28px] border border-dashed border-[#d8e2f3] bg-white p-10 text-center shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ff]">
        <ListTodo className="h-6 w-6 text-[#2f5be3]" />
      </div>
      <h2 className="mt-5 text-[1.5rem] font-bold tracking-[-0.03em] text-slate-900">
        No background work yet
      </h2>
      <p className="mx-auto mt-3 max-w-[560px] text-sm leading-7 text-slate-600">
        Queue a worker-backed circuit run or a session summary export from the Hybrid Lab to start building an activity trail here.
      </p>
      <div className="mt-6">
        <Link
          href="/build"
          className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.28)] transition hover:-translate-y-[1px]"
        >
          Open Hybrid Lab
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usageSummary, setUsageSummary] = useState<PageUsageSummary | null>(null);

  useEffect(() => {
    // Record usage (Mock city for demo)
    const cities = ["Seattle", "San Francisco", "New York", "London", "Tokyo"];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    recordUsage({ page_path: "/jobs", city: randomCity }).catch(console.error);

    // Fetch summary
    fetchUsageSummary("/jobs")
      .then(setUsageSummary)
      .catch(console.error);
  }, []);
  const rawStatus = searchParams.get("status");
  const filter =
    rawStatus === "PENDING" ||
    rawStatus === "RUNNING" ||
    rawStatus === "COMPLETED" ||
    rawStatus === "FAILED"
      ? rawStatus
      : "ALL";
  const selectedJobIdFromQuery = searchParams.get("job_id");
  const { data: jobs = [] } = useJobs(filter === "ALL" ? undefined : filter, 40);
  const derivedSelectedJobId = selectedJobIdFromQuery ?? jobs[0]?.id ?? null;
  const selectedJobFromList = useMemo(
    () => jobs.find((job) => job.id === derivedSelectedJobId) ?? null,
    [derivedSelectedJobId, jobs],
  );
  const { data: selectedJobFromApi } = useJob(
    selectedJobFromList ? null : derivedSelectedJobId,
  );
  const selectedJob = selectedJobFromList ?? selectedJobFromApi ?? null;

  const summary = useMemo(() => {
    const counts = {
      total: jobs.length,
      running: 0,
      completed: 0,
      failed: 0,
    };
    for (const job of jobs) {
      if (job.status === "PENDING" || job.status === "RUNNING") counts.running += 1;
      if (job.status === "COMPLETED") counts.completed += 1;
      if (job.status === "FAILED") counts.failed += 1;
    }
    return counts;
  }, [jobs]);

  const activeJobLink =
    selectedJob?.status === "PENDING" || selectedJob?.status === "RUNNING"
      ? buildQuery({ status: filter, jobId: selectedJob.id })
      : null;

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-[#dbe5f1] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
                Worker activity
              </span>
              <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#157052]">
                Persisted job history
              </span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Recent 40 jobs
              </span>
            </div>
            <h1 className="text-[clamp(2.15rem,4vw,3.35rem)] font-black tracking-[-0.05em] text-slate-900">
              Track background runs and export jobs
            </h1>
            <p className="mt-3 text-[1.05rem] leading-8 text-slate-600">
              One place to see what the worker is doing, what has already completed, and which jobs produced persisted runs or downloadable artifacts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/build"
              className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.28)] transition hover:-translate-y-[1px]"
            >
              Queue new work
              <ArrowRight className="h-4 w-4" />
            </Link>
            {activeJobLink ? (
              <button
                type="button"
                onClick={() => router.replace(activeJobLink, { scroll: false })}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
              >
                Refresh active job
                <LoaderCircle className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            ["Visible jobs", String(summary.total)],
            ["Running or queued", String(summary.running)],
            ["Completed", String(summary.completed)],
            ["Failed", String(summary.failed)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-[#d8e2f3] bg-white p-4 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
              </div>
              <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_360px_minmax(0,1fr)]">
          <WorkspaceRail
            active="jobs"
            tip="Use this page to watch worker-backed runs, export packaging, and persisted background outcomes without leaving the product."
          />

          <JobListCard
            jobs={jobs}
            selectedJobId={selectedJob?.id ?? derivedSelectedJobId}
            filter={filter}
          />

          {selectedJob ? <JobDetailPanel job={selectedJob} /> : <EmptyJobState />}
        </div>

        {usageSummary && (
          <div className="mt-6 rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
            <div className="mb-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Usage Statistics (Last 30 Days)
              </div>
              <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
                Page loads and user locations
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Total Page Loads
                </div>
                <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
                  {usageSummary.total_loads}
                </div>
              </div>
              <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Top Cities
                </div>
                <div className="mt-2 space-y-2">
                  {usageSummary.by_city.map((item) => (
                    <div key={item.city} className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">{item.city}</span>
                      <span className="text-slate-500">{item.count} loads</span>
                    </div>
                  ))}
                  {usageSummary.by_city.length === 0 && (
                    <div className="text-sm text-slate-500">No data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function JobsPageFallback() {
  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 h-8 w-56 rounded-full bg-slate-200" />
        <div className="mb-4 h-14 max-w-[520px] rounded-[24px] bg-slate-200" />
        <div className="grid gap-5 xl:grid-cols-[220px_360px_minmax(0,1fr)]">
          <div className="skeleton h-[620px]" />
          <div className="skeleton h-[620px]" />
          <div className="skeleton h-[620px]" />
        </div>
      </section>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsPageFallback />}>
      <JobsPageContent />
    </Suspense>
  );
}

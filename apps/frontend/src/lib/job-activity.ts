import { getStarterStory } from "@/lib/studio-mocks";
import { Job, JobStatus, JobType, SavedSession, SessionDetail } from "@/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

export function formatJobTime(value: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatter.format(new Date(value));
}

export function formatJobTypeLabel(jobType: JobType) {
  if (jobType === "session_summary_export") {
    return "Session summary export";
  }
  return getStarterStory(jobType).label;
}

export function formatJobStatusLabel(status: JobStatus) {
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

export function getJobStatusClasses(status: JobStatus) {
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

export function getJobSessionId(job: Job) {
  const payload = isRecord(job.payload) ? job.payload : null;
  const result = isRecord(job.result) ? job.result : null;
  return readString(result, "session_id") ?? readString(payload, "session_id");
}

export function getJobCircuitRunId(job: Job) {
  const payload = isRecord(job.payload) ? job.payload : null;
  const result = isRecord(job.result) ? job.result : null;
  return readString(result, "circuit_run_id") ?? readString(payload, "circuit_run_id");
}

export function buildJobHref(jobId: string) {
  return `/jobs?job_id=${jobId}`;
}

export function getJobsForSession(jobs: Job[], session: SessionDetail) {
  const latestCircuitRunId = session.latest_circuit_run?.id ?? null;

  return jobs.filter((job) => {
    const sessionId = getJobSessionId(job);
    const circuitRunId = getJobCircuitRunId(job);
    return sessionId === session.id || (latestCircuitRunId ? circuitRunId === latestCircuitRunId : false);
  });
}

export function getJobsForProject(jobs: Job[], sessions: SavedSession[]) {
  const sessionIds = new Set(sessions.map((session) => session.id));
  return jobs.filter((job) => {
    const sessionId = getJobSessionId(job);
    return sessionId ? sessionIds.has(sessionId) : false;
  });
}

export function summarizeJobs(jobs: Job[]) {
  return jobs.reduce(
    (summary, job) => {
      summary.total += 1;
      if (job.status === "PENDING") summary.pending += 1;
      if (job.status === "RUNNING") summary.running += 1;
      if (job.status === "COMPLETED") summary.completed += 1;
      if (job.status === "FAILED") summary.failed += 1;
      return summary;
    },
    { total: 0, pending: 0, running: 0, completed: 0, failed: 0 },
  );
}

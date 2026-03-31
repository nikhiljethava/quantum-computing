"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowRight,
  Clock3,
  Download,
  FileStack,
  FolderOpen,
  GitBranch,
  Sparkles,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { getArtifactDownloadUrl } from "@/lib/api";
import { useSession, useSessions, useUseCase } from "@/lib/hooks";
import { getStarterStory, normalizeStarterKey } from "@/lib/studio-mocks";
import { Artifact, SavedSession, SessionDetail } from "@/types/api";

function formatSessionTime(value: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatter.format(new Date(value));
}

function formatArtifactLabel(artifact: Artifact) {
  switch (artifact.artifact_type) {
    case "cirq_code":
      return "Cirq code export";
    case "assessment_json":
      return "Assessment JSON";
    case "architecture_json":
      return "Architecture map JSON";
    case "session_summary":
      return "Session summary";
    default:
      return artifact.filename;
  }
}

function buildSessionHref(session: SavedSession | SessionDetail) {
  const params = new URLSearchParams();
  params.set("starter", normalizeStarterKey(session.starter_key));
  params.set("session_id", session.id);
  if (session.selected_use_case_id) {
    params.set("use_case_id", session.selected_use_case_id);
  }
  return `/build?${params.toString()}`;
}

function SessionListCard({
  sessions,
  selectedSessionId,
  onSelect,
}: {
  sessions: SavedSession[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Session library
          </div>
          <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
            Saved workspace history
          </h2>
        </div>
        <div className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]">
          {sessions.length} saved
        </div>
      </div>

      <div className="space-y-3">
        {sessions.length ? (
          sessions.map((session, index) => {
            const starter = getStarterStory(session.starter_key);
            const isSelected = session.id === selectedSessionId;

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelect(session.id)}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-[#2f5be3] bg-[#eef2ff] shadow-[0_14px_30px_rgba(47,91,227,0.12)]"
                    : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#c7d7f4] hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{session.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {session.project_name ?? "Quantum Foundry demos"}
                    </div>
                  </div>
                  <div className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {index === 0 ? "Latest" : starter.badge}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {starter.label}
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {session.current_mode}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Updated {formatSessionTime(session.updated_at)}
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-6 text-sm leading-7 text-slate-500">
            Save a workspace from the Hybrid Lab to build up a reusable session history.
          </div>
        )}
      </div>
    </div>
  );
}

function SessionDetailPanel({
  session,
}: {
  session: SessionDetail;
}) {
  const starter = getStarterStory(session.starter_key);
  const useCaseId = session.selected_use_case_id ?? session.latest_circuit_run?.use_case_id ?? null;
  const { data: useCase } = useUseCase(useCaseId);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
                Saved session
              </span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Persistent workspace
              </span>
            </div>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-black tracking-[-0.04em] text-slate-900">
              {session.title}
            </h2>
            <p className="mt-3 max-w-[760px] text-[1rem] leading-8 text-slate-600">
              Reopen the latest circuit run, architecture narrative, and export bundle from one saved workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={buildSessionHref(session)}
              className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.28)] transition hover:-translate-y-[1px]"
            >
              Open in Hybrid Lab
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/map?starter=${normalizeStarterKey(session.starter_key)}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
            >
              Open map view
              <GitBranch className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Project", session.project_name ?? "Quantum Foundry demos"],
            ["Prototype lane", starter.label],
            ["Use case", useCase?.title ?? "Not attached yet"],
            ["Last updated", formatSessionTime(session.updated_at)],
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
              <Sparkles className="h-4 w-4 text-[#2f5be3]" />
              Latest circuit output
            </div>

            {session.latest_circuit_run ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]">
                    {session.latest_circuit_run.label}
                  </span>
                  <span className="rounded-full bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-500">
                    {session.latest_circuit_run.concept}
                  </span>
                  <span className="rounded-full bg-[#dcfce7] px-3 py-2 text-xs font-semibold text-[#157052]">
                    {session.latest_circuit_run.assessment_preview.score} / 100
                  </span>
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  {session.latest_circuit_run.guide_response}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {session.latest_circuit_run.histogram.map((entry) => (
                    <div
                      key={entry.state}
                      className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fbff] p-4"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        State
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{entry.state}</div>
                      <div className="mt-3 text-sm text-slate-500">
                        {Math.round(entry.probability)}% probability
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4 text-sm leading-7 text-slate-600">
                  {session.latest_circuit_run.explanation}
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-6 text-sm leading-7 text-slate-500">
                This session has been saved, but it does not have a live circuit run attached yet.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <GitBranch className="h-4 w-4 text-[#2f5be3]" />
              Latest architecture snapshot
            </div>

            {session.latest_architecture ? (
              <div className="space-y-4">
                <p className="text-sm leading-7 text-slate-600">
                  {session.latest_architecture.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {session.latest_architecture.components.map((component) => (
                    <span
                      key={component.id}
                      className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]"
                    >
                      {component.name}
                    </span>
                  ))}
                </div>
                <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Architecture notes
                  </div>
                  <div className="space-y-3">
                    {session.latest_architecture.notes.map((note) => (
                      <div key={note} className="flex gap-3 text-sm leading-6 text-slate-600">
                        <span className="mt-[7px] h-2 w-2 rounded-full bg-[#2f5be3]" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-6 text-sm leading-7 text-slate-500">
                No saved architecture map yet. Open the session in Build and generate the GCP view to attach it here.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FolderOpen className="h-4 w-4 text-[#2f5be3]" />
              Export bundle
            </div>

            <div className="space-y-3">
              {session.artifacts.length ? (
                session.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4"
                  >
                    <div className="text-sm font-semibold text-slate-800">
                      {formatArtifactLabel(artifact)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {artifact.filename} · {Math.max(1, Math.round(artifact.size_bytes / 1024))} KB
                    </div>
                    <a
                      href={getArtifactDownloadUrl(artifact.id)}
                      download={artifact.filename}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3] transition hover:bg-[#dbe5ff]"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-6 text-sm leading-7 text-slate-500">
                  Exports will appear here after you generate them from the Hybrid Lab.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileStack className="h-4 w-4 text-[#2f5be3]" />
              Workspace notes
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>
                Starter lane: <span className="font-semibold text-slate-800">{starter.label}</span>
              </p>
              <p>
                Honest readiness framing stays attached to the saved session so exports preserve the original context.
              </p>
              {typeof session.notes.last_saved_at === "string" ? (
                <p>
                  Last explicit save:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatSessionTime(session.notes.last_saved_at)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSessionId = searchParams.get("session_id");
  const { data: sessionList, isLoading, error } = useSessions({ limit: 12 });
  const fallbackSessionId = sessionList?.items[0]?.id ?? null;
  const activeSessionId = selectedSessionId ?? fallbackSessionId;
  const {
    data: activeSession,
    isLoading: isLoadingSession,
    error: activeSessionError,
  } = useSession(activeSessionId);

  function selectSession(sessionId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("session_id", sessionId);
    router.replace(`/sessions?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Saved sessions
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Product memory
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-slate-900">
            Browse reusable workspace history
          </h1>
          <p className="mt-3 max-w-[760px] text-[1.02rem] leading-8 text-slate-600">
            Keep saved circuit runs, architecture snapshots, and export bundles attached to project state so the launchpad feels like a real product workspace.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_340px_minmax(0,1fr)]">
          <WorkspaceRail
            active="saved-sessions"
            tip="Use saved sessions as the bridge from demo-only exploration into a product that can be reopened, reviewed, and shared."
          />

          <div className="space-y-5">
            <SessionListCard
              sessions={sessionList?.items ?? []}
              selectedSessionId={activeSessionId}
              onSelect={selectSession}
            />

            <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                What this unlocks
              </div>
              <div className="space-y-3 text-sm leading-7 text-slate-600">
                <p>Saved sessions make the Hybrid Lab feel stateful, not disposable.</p>
                <p>Artifacts stay attached to a concrete workspace instead of floating as one-off downloads.</p>
                <p>PMs and architects can reopen the same narrative later without reconstructing the prototype.</p>
              </div>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="space-y-5">
                <div className="skeleton h-[220px]" />
                <div className="skeleton h-[260px]" />
                <div className="skeleton h-[220px]" />
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-[#fecaca] bg-[#fff1f2] p-6 text-sm leading-7 text-[#b91c1c]">
                The saved-session library could not be loaded right now.
                <span className="block pt-2 text-xs text-[#991b1b]">
                  {error instanceof Error ? error.message : "Unknown error"}
                </span>
              </div>
            ) : !sessionList?.items.length ? (
              <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FolderOpen className="h-4 w-4 text-[#2f5be3]" />
                  No saved sessions yet
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  Start in the Hybrid Lab, generate a live circuit, and save the workspace to populate this library.
                </p>
                <Link
                  href="/build"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.28)] transition hover:-translate-y-[1px]"
                >
                  Open Hybrid Lab
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : isLoadingSession ? (
              <div className="space-y-5">
                <div className="skeleton h-[220px]" />
                <div className="skeleton h-[260px]" />
                <div className="skeleton h-[220px]" />
              </div>
            ) : activeSessionError || !activeSession ? (
              <div className="rounded-[28px] border border-[#fecaca] bg-[#fff1f2] p-6 text-sm leading-7 text-[#b91c1c]">
                The selected session could not be opened.
                <span className="block pt-2 text-xs text-[#991b1b]">
                  {activeSessionError instanceof Error
                    ? activeSessionError.message
                    : "Try selecting another saved session from the list."}
                </span>
              </div>
            ) : (
              <SessionDetailPanel session={activeSession} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SessionsPageFallback() {
  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 h-8 w-56 rounded-full bg-slate-200" />
        <div className="mb-4 h-14 max-w-[520px] rounded-[24px] bg-slate-200" />
        <div className="grid gap-5 xl:grid-cols-[220px_340px_minmax(0,1fr)]">
          <div className="skeleton h-[560px]" />
          <div className="space-y-5">
            <div className="skeleton h-[420px]" />
            <div className="skeleton h-[160px]" />
          </div>
          <div className="space-y-5">
            <div className="skeleton h-[220px]" />
            <div className="skeleton h-[260px]" />
            <div className="skeleton h-[220px]" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<SessionsPageFallback />}>
      <SessionsPageContent />
    </Suspense>
  );
}

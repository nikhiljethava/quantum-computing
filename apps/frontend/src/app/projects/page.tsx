"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import {
  ArrowRight,
  Clock3,
  FolderOpen,
  Folders,
  Layers3,
  Sparkles,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { useProjects, useSessions, useUseCase } from "@/lib/hooks";
import { getStarterStory, normalizeStarterKey } from "@/lib/studio-mocks";
import { Project, SavedSession } from "@/types/api";

function formatTime(value: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatter.format(new Date(value));
}

function buildSessionHref(session: SavedSession) {
  const params = new URLSearchParams();
  params.set("starter", normalizeStarterKey(session.starter_key));
  params.set("session_id", session.id);
  if (session.selected_use_case_id) {
    params.set("use_case_id", session.selected_use_case_id);
  }
  return `/build?${params.toString()}`;
}

function formatStatus(status: Project["status"]) {
  if (status === "active") return "Active";
  if (status === "draft") return "Draft";
  return "Archived";
}

function ProjectListCard({
  projects,
  selectedProjectId,
  onSelect,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Project library
          </div>
          <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
            Saved workstreams
          </h2>
        </div>
        <div className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]">
          {projects.length} projects
        </div>
      </div>

      <div className="space-y-3">
        {projects.length ? (
          projects.map((project) => {
            const isSelected = project.id === selectedProjectId;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelect(project.id)}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-[#2f5be3] bg-[#eef2ff] shadow-[0_14px_30px_rgba(47,91,227,0.12)]"
                    : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#c7d7f4] hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{project.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {project.description || "Saved Hybrid Lab sessions and exports."}
                    </div>
                  </div>
                  <div className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {formatStatus(project.status)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {project.session_count} sessions
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Updated {formatTime(project.updated_at)}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-6 text-sm leading-7 text-slate-500">
            Save a workspace from the Hybrid Lab to create the first reusable project.
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectSessionRow({ session }: { session: SavedSession }) {
  const starter = getStarterStory(session.starter_key);
  const { data: useCase } = useUseCase(session.selected_use_case_id);

  return (
    <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{session.title}</div>
          <div className="mt-1 text-xs text-slate-500">
            {useCase?.title ?? "Use case not attached"} · Updated {formatTime(session.updated_at)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {starter.label}
          </span>
          <span className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {session.current_mode}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildSessionHref(session)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(47,91,227,0.22)] transition hover:-translate-y-[1px]"
        >
          Open in Hybrid Lab
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/sessions?project_id=${session.project_id}&session_id=${session.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
        >
          Open saved detail
          <FolderOpen className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ProjectDetailPanel({
  project,
  sessions,
}: {
  project: Project;
  sessions: SavedSession[];
}) {
  const latestSession = sessions[0] ?? null;
  const laneCount = useMemo(
    () => new Set(sessions.map((session) => session.starter_key)).size,
    [sessions],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
                Project workspace
              </span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Persistent product state
              </span>
            </div>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-black tracking-[-0.04em] text-slate-900">
              {project.name}
            </h2>
            <p className="mt-3 max-w-[760px] text-[1rem] leading-8 text-slate-600">
              {project.description || "A reusable container for saved Hybrid Lab sessions, architecture maps, and export bundles."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/sessions?project_id=${project.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.28)] transition hover:-translate-y-[1px]"
            >
              Open saved sessions
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/build"
              className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
            >
              Open Hybrid Lab
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Status", formatStatus(project.status)],
            ["Saved sessions", String(project.session_count)],
            ["Prototype lanes", String(laneCount || 0)],
            ["Latest activity", latestSession ? formatTime(latestSession.updated_at) : formatTime(project.updated_at)],
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
        <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Folders className="h-4 w-4 text-[#2f5be3]" />
            Sessions inside this project
          </div>

          <div className="space-y-4">
            {sessions.length ? (
              sessions.map((session) => <ProjectSessionRow key={session.id} session={session} />)
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-6 text-sm leading-7 text-slate-500">
                This project exists, but it does not have saved sessions yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Layers3 className="h-4 w-4 text-[#2f5be3]" />
              Why projects matter
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>Projects group multiple saved sessions into one customer or workstream narrative.</p>
              <p>They help PMs and architects compare prototype lanes without losing earlier runs.</p>
              <p>They keep exports and saved sessions anchored to a reusable product container.</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock3 className="h-4 w-4 text-[#2f5be3]" />
              Suggested next move
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              {latestSession ? (
                <>
                  <p>Reopen the latest session to extend the same narrative with a new circuit run or refreshed architecture map.</p>
                  <Link
                    href={buildSessionHref(latestSession)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#2f5be3] shadow-[0_12px_24px_rgba(47,91,227,0.12)] transition hover:-translate-y-[1px]"
                  >
                    Continue latest workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  <p>Open the Hybrid Lab and save the next run into this project to start building a reusable history.</p>
                  <Link
                    href="/build"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#2f5be3] shadow-[0_12px_24px_rgba(47,91,227,0.12)] transition hover:-translate-y-[1px]"
                  >
                    Start a new workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("project_id");
  const { data: projectList, isLoading, error } = useProjects(50);
  const activeProjectId =
    selectedProjectId && projectList?.items.some((project) => project.id === selectedProjectId)
      ? selectedProjectId
      : projectList?.items[0]?.id ?? null;
  const activeProject =
    projectList?.items.find((project) => project.id === activeProjectId) ?? null;
  const { data: sessionList, isLoading: isLoadingSessions } = useSessions({
    project_id: activeProjectId ?? undefined,
    limit: 20,
  });

  function selectProject(projectId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("project_id", projectId);
    router.replace(`/projects?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Projects
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Reusable workstreams
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-slate-900">
            Organize saved work into project narratives
          </h1>
          <p className="mt-3 max-w-[760px] text-[1.02rem] leading-8 text-slate-600">
            Projects sit one level above sessions, making it easier to keep multiple prototypes, exports, and architectural narratives attached to the same account or opportunity.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_340px_minmax(0,1fr)]">
          <WorkspaceRail
            active="projects"
            tip="Use projects to group related saved sessions before the workspace history grows too wide to reason about at a glance."
          />

          <div className="space-y-5">
            <ProjectListCard
              projects={projectList?.items ?? []}
              selectedProjectId={activeProjectId}
              onSelect={selectProject}
            />

            <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Connection to sessions
              </div>
              <div className="space-y-3 text-sm leading-7 text-slate-600">
                <p>Projects answer “which customer or initiative is this for?”</p>
                <p>Sessions answer “which prototype run or saved moment should I reopen?”</p>
                <p>Together they make the launchpad feel persistent instead of one-off.</p>
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
                The project library could not be loaded right now.
                <span className="block pt-2 text-xs text-[#991b1b]">
                  {error instanceof Error ? error.message : "Unknown error"}
                </span>
              </div>
            ) : !projectList?.items.length ? (
              <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Folders className="h-4 w-4 text-[#2f5be3]" />
                  No projects yet
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  Save a workspace from the Hybrid Lab to create the first reusable project container.
                </p>
                <Link
                  href="/build"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.28)] transition hover:-translate-y-[1px]"
                >
                  Open Hybrid Lab
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : !activeProject ? (
              <div className="rounded-[28px] border border-[#fecaca] bg-[#fff1f2] p-6 text-sm leading-7 text-[#b91c1c]">
                The selected project could not be found.
              </div>
            ) : isLoadingSessions ? (
              <div className="space-y-5">
                <div className="skeleton h-[220px]" />
                <div className="skeleton h-[260px]" />
                <div className="skeleton h-[220px]" />
              </div>
            ) : (
              <ProjectDetailPanel project={activeProject} sessions={sessionList?.items ?? []} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProjectsPageFallback() {
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageFallback />}>
      <ProjectsPageContent />
    </Suspense>
  );
}

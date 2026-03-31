"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Clock3,
  Code2,
  FileDown,
  FolderOpen,
  GitBranch,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import {
  createArtifact,
  fetchArchitecture,
  fetchCircuitRun,
  getArtifactDownloadUrl,
  runCircuit,
} from "@/lib/api";
import {
  useCreateProject,
  useCreateSession,
  useJob,
  useProjects,
  useSession,
  useSessions,
  useSubmitJob,
  useUpdateSession,
  useUseCase,
} from "@/lib/hooks";
import {
  STARTER_ORDER,
  StarterKey,
  StarterStory,
  getStarterStory,
  normalizeStarterKey,
} from "@/lib/studio-mocks";
import {
  ArchitectureMap,
  ArtifactType,
  CircuitRun,
  GcpComponent,
  Project,
  SavedSession,
  UseCase,
} from "@/types/api";

type OutputTab = "results" | "notes" | "code";
type FocusCard = "assessment" | "architecture" | null;
type HistogramTone = StarterStory["histogram"][number]["tone"];

const HISTOGRAM_TONES: HistogramTone[] = ["primary", "accent", "secondary", "warn"];
const DEFAULT_PROJECT_NAME = "Quantum Foundry demos";
const NEW_PROJECT_VALUE = "__new_project__";
const EXPORT_ITEMS: Array<{
  type: Exclude<ArtifactType, "job_output">;
  label: string;
  requiresArchitecture?: boolean;
}> = [
  { type: "cirq_code", label: "Cirq code (.py)" },
  { type: "assessment_json", label: "Assessment JSON" },
  { type: "architecture_json", label: "Architecture map JSON", requiresArchitecture: true },
  { type: "session_summary", label: "Session summary (.md)", requiresArchitecture: true },
];

const TONE_STYLES = {
  primary: {
    fill: "#e0e7ff",
    stroke: "#2f5be3",
    text: "#1d4ed8",
    bar: "from-[#2f5be3] to-[#4f7cff]",
    pill: "bg-[#e0e7ff] text-[#1d4ed8]",
  },
  secondary: {
    fill: "#dcfce7",
    stroke: "#1c9d68",
    text: "#157052",
    bar: "from-[#1c9d68] to-[#39c790]",
    pill: "bg-[#dcfce7] text-[#157052]",
  },
  accent: {
    fill: "#efe2ff",
    stroke: "#7c3aed",
    text: "#6d28d9",
    bar: "from-[#7c3aed] to-[#9f67ff]",
    pill: "bg-[#efe2ff] text-[#6d28d9]",
  },
  warn: {
    fill: "#ffedd5",
    stroke: "#ea580c",
    text: "#c2410c",
    bar: "from-[#f59e0b] to-[#ea580c]",
    pill: "bg-[#ffedd5] text-[#c2410c]",
  },
  neutral: {
    fill: "#e2e8f0",
    stroke: "#64748b",
    text: "#475569",
    bar: "from-slate-400 to-slate-500",
    pill: "bg-slate-200 text-slate-700",
  },
} as const;

function formatScoreLabel(score: number) {
  if (score >= 75) return "Hybrid now";
  if (score >= 60) return "Prototype now";
  return "Hardware later";
}

function buildDefaultSessionTitle(starterKey: StarterKey, useCase?: UseCase | null) {
  const starter = getStarterStory(starterKey);
  if (useCase) {
    return `${useCase.title} - ${starter.label}`;
  }
  return `${starter.label} workspace`;
}

function formatSessionTime(value: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatter.format(new Date(value));
}

function summarizeUseCase(useCase: UseCase | null | undefined) {
  if (!useCase) return null;
  return `Anchored to ${useCase.title}: ${useCase.description}`;
}

function mapHistogramToStory(run: CircuitRun, fallback: StarterStory): StarterStory["histogram"] {
  if (!run.histogram.length) return fallback.histogram;

  return run.histogram.slice(0, 4).map((item, index) => ({
    state: item.state,
    probability: Math.round(item.probability),
    tone: HISTOGRAM_TONES[index % HISTOGRAM_TONES.length],
  }));
}

function deriveArchitectureNodes(components: GcpComponent[]) {
  const ids = new Set(components.map((component) => component.id));

  const nodes: StarterStory["architectureNodes"] = [];

  if (ids.has("cloud_storage") || ids.has("cloud_sql")) {
    nodes.push({
      id: "data",
      label: "Cloud Storage / Cloud SQL",
      caption: "Session state and artifacts",
      tone: "primary",
    });
  }

  if (ids.has("api_gateway") || ids.has("cloud_run")) {
    nodes.push({
      id: "prep",
      label: "Cloud Run API",
      caption: "Guide and classical prep",
      tone: "secondary",
    });
  }

  if (ids.has("circuit_runner")) {
    nodes.push({
      id: "worker",
      label: "Cirq worker",
      caption: "Simulation layer",
      tone: "accent",
    });
  }

  nodes.push({
    id: "post",
    label: ids.has("vertex_ai") ? "Vertex AI + export" : "Post-process + export",
    caption: ids.has("vertex_ai") ? "Classical co-processing" : "Results and exports",
    tone: "secondary",
  });

  const optionalNode = ids.has("quantum_computing_service")
    ? {
        id: "hardware",
        label: "Google QCS (optional)",
        caption: "Feature-gated later path",
        tone: "warn" as const,
      }
    : undefined;

  return {
    nodes: nodes.slice(0, 4),
    optionalNode,
  };
}

function mergeLiveStory(
  fallback: StarterStory,
  run: CircuitRun | null,
  architecture: ArchitectureMap | null,
  useCase: UseCase | null | undefined,
): StarterStory {
  if (!run) {
    return useCase
      ? {
          ...fallback,
          useCaseHint: summarizeUseCase(useCase) ?? fallback.useCaseHint,
        }
      : fallback;
  }

  const liveArchitecture = architecture ? deriveArchitectureNodes(architecture.components) : null;

  return {
    ...fallback,
    label: run.label,
    badge: run.badge,
    concept: run.concept,
    prompt: run.prompt,
    guideReply: run.guide_response,
    guideFollowUp:
      summarizeUseCase(useCase) ??
      "Next step: compare the simulator result against a classical baseline and export the architecture brief.",
    explanation: run.explanation,
    useCaseHint: summarizeUseCase(useCase) ?? fallback.useCaseHint,
    histogram: mapHistogramToStory(run, fallback),
    code: run.cirq_code,
    assessment: {
      score: run.assessment_preview.score,
      verdict: run.assessment_preview.verdict,
      horizon: run.assessment_preview.horizon,
      confidence: run.assessment_preview.confidence,
      explanation: run.assessment_preview.explanation,
      assumptions: run.assessment_preview.assumptions,
      publicSignals: run.assessment_preview.public_signals,
      nextAction: run.assessment_preview.next_action,
    },
    architectureSummary: architecture?.summary ?? fallback.architectureSummary,
    architectureNodes: liveArchitecture?.nodes.length ? liveArchitecture.nodes : fallback.architectureNodes,
    optionalNode: liveArchitecture?.optionalNode ?? fallback.optionalNode,
    exportItems: ["Cirq code export", "Assessment JSON", "Architecture JSON", "Session summary"],
  };
}

function architectureFromJobResult(result: Record<string, unknown> | null): ArchitectureMap | null {
  if (!result) return null;
  const architecture = result.architecture;
  if (!architecture || typeof architecture !== "object") return null;

  const candidate = architecture as Partial<ArchitectureMap>;
  if (!candidate.title || !candidate.summary || !Array.isArray(candidate.components)) {
    return null;
  }

  return {
    id: typeof candidate.id === "string" ? candidate.id : null,
    circuit_run_id:
      typeof candidate.circuit_run_id === "string" ? candidate.circuit_run_id : null,
    assessment_id:
      typeof candidate.assessment_id === "string" ? candidate.assessment_id : null,
    use_case_id: typeof candidate.use_case_id === "string" ? candidate.use_case_id : null,
    title: candidate.title,
    summary: candidate.summary,
    components: candidate.components,
    connections: Array.isArray(candidate.connections) ? candidate.connections : [],
    notes: Array.isArray(candidate.notes) ? candidate.notes : [],
    created_at: typeof candidate.created_at === "string" ? candidate.created_at : null,
  };
}

function WorkspaceMemoryCard({
  currentProjectId,
  projectName,
  sessionTitle,
  currentSessionId,
  saveState,
  saveError,
  availableProjects,
  recentSessions,
  isBusy,
  onProjectSelectionChange,
  onProjectNameChange,
  onSessionTitleChange,
  onSave,
  onOpenSession,
  onReset,
}: {
  currentProjectId: string | null;
  projectName: string;
  sessionTitle: string;
  currentSessionId: string | null;
  saveState: "idle" | "saving" | "saved";
  saveError: string | null;
  availableProjects: Project[];
  recentSessions: SavedSession[];
  isBusy: boolean;
  onProjectSelectionChange: (projectId: string | null) => void;
  onProjectNameChange: (value: string) => void;
  onSessionTitleChange: (value: string) => void;
  onSave: () => void;
  onOpenSession: (session: SavedSession) => void;
  onReset: () => void;
}) {
  const projectOptions =
    currentProjectId && !availableProjects.some((project) => project.id === currentProjectId)
      ? [
          {
            id: currentProjectId,
            name: projectName || DEFAULT_PROJECT_NAME,
            description: "",
            status: "active" as const,
            session_count: 0,
            created_at: "",
            updated_at: "",
          },
          ...availableProjects,
        ]
      : availableProjects;

  return (
    <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace memory
          </div>
          <h3 className="mt-1 text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-900">
            Save and reopen this flow
          </h3>
        </div>
        <FolderOpen className="h-5 w-5 text-[#2f5be3]" />
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Project container
          </span>
          <select
            value={currentProjectId ?? NEW_PROJECT_VALUE}
            onChange={(event) =>
              onProjectSelectionChange(
                event.target.value === NEW_PROJECT_VALUE ? null : event.target.value,
              )
            }
            className="w-full rounded-[18px] border border-[#d8e2f3] bg-[#f8fbff] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f5be3]"
          >
            <option value={NEW_PROJECT_VALUE}>Create a new project</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {currentProjectId ? "Selected project" : "New project name"}
          </span>
          <input
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            disabled={Boolean(currentProjectId)}
            className="w-full rounded-[18px] border border-[#d8e2f3] bg-[#f8fbff] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f5be3] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            placeholder={DEFAULT_PROJECT_NAME}
          />
          <span className="mt-2 block text-xs leading-5 text-slate-500">
            {currentProjectId
              ? "This workspace will save into the selected project. Switch the picker above to create a new one."
              : "Use a stable project name to group related saved sessions together."}
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Session
          </span>
          <input
            value={sessionTitle}
            onChange={(event) => onSessionTitleChange(event.target.value)}
            className="w-full rounded-[18px] border border-[#d8e2f3] bg-[#f8fbff] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f5be3]"
            placeholder="Bell state workspace"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isBusy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.24)] transition hover:-translate-y-[1px]"
        >
          <Save className="h-4 w-4" />
          {saveState === "saving" ? "Saving..." : currentSessionId ? "Update workspace" : "Save workspace"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
        >
          <RotateCcw className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="mt-4 rounded-[18px] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">
        {saveState === "saved"
          ? "Workspace saved. Future circuit runs will stay attached to this session."
          : "Save the current Build workspace so you can reopen the latest run, architecture, and export history."}
      </div>

      {saveError ? (
        <div className="mt-4 rounded-[18px] border border-[#fecaca] bg-[#fff1f2] p-4 text-sm leading-6 text-[#b91c1c]">
          {saveError}
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Clock3 className="h-4 w-4" />
            Recent sessions
          </div>
          <Link
            href={
              currentSessionId || currentProjectId
                ? `/sessions?${new URLSearchParams({
                    ...(currentSessionId ? { session_id: currentSessionId } : {}),
                    ...(currentProjectId ? { project_id: currentProjectId } : {}),
                  }).toString()}`
                : "/sessions"
            }
            className="rounded-full border border-[#d8e2f3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
          >
            Browse library
          </Link>
        </div>
        <div className="space-y-3">
          {recentSessions.length ? (
            recentSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onOpenSession(session)}
                className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                  session.id === currentSessionId
                    ? "border-[#2f5be3] bg-[#eef2ff]"
                    : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#c7d7f4]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">{session.title}</span>
                  <span className="text-xs font-medium text-slate-500">
                    {formatSessionTime(session.updated_at)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {(session.project_name ?? DEFAULT_PROJECT_NAME)} · {session.starter_key.replaceAll("_", " ")}
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] px-4 py-4 text-sm text-slate-500">
              Saved sessions will appear here after your first workspace save.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CircuitCanvas({ story }: { story: StarterStory }) {
  const laneGap = 62;
  const columnGap = 86;
  const startX = 78;
  const startY = 52;
  const maxColumn = Math.max(...story.circuit.map((node) => node.column), 0);
  const width = startX * 2 + columnGap * (maxColumn + 1);
  const height = startY * 2 + laneGap * Math.max(story.wires.length - 1, 1);

  return (
    <div className="overflow-x-auto rounded-[24px] border border-[#d8e2f3] bg-[#f8fbff] px-3 py-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[280px] min-w-[620px] w-full"
        role="img"
        aria-label={`${story.label} circuit`}
      >
        {story.wires.map((wire, index) => {
          const y = startY + laneGap * index;
          return (
            <g key={wire}>
              <text
                x={20}
                y={y + 5}
                fontSize="18"
                fontWeight="600"
                fill="#64748b"
              >
                {wire}
              </text>
              <line
                x1={startX}
                y1={y}
                x2={width - startX / 2}
                y2={y}
                stroke="#94a3b8"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {story.circuit.map((node, index) => {
          const x = startX + columnGap * node.column;
          const y = startY + laneGap * node.lane;
          const tone = TONE_STYLES[node.tone ?? "primary"];

          if (node.type === "control") {
            const targetY = startY + laneGap * (node.targetLane ?? node.lane);
            return (
              <g key={`${node.type}-${index}`}>
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={targetY}
                  stroke={tone.stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx={x} cy={y} r="10" fill={tone.stroke} />
              </g>
            );
          }

          if (node.type === "target") {
            return (
              <g key={`${node.type}-${index}`}>
                <circle cx={x} cy={y} r="18" fill="#ffffff" stroke={tone.stroke} strokeWidth="4" />
                <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke={tone.stroke} strokeWidth="4" />
                <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke={tone.stroke} strokeWidth="4" />
              </g>
            );
          }

          if (node.type === "label") {
            return (
              <g key={`${node.type}-${index}`}>
                <rect
                  x={x - 34}
                  y={y - 20}
                  width="84"
                  height="34"
                  rx="16"
                  fill="#e2e8f0"
                />
                <text
                  x={x + 8}
                  y={y + 2}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="#475569"
                >
                  {node.label}
                </text>
              </g>
            );
          }

          return (
            <g key={`${node.type}-${index}`}>
              <rect
                x={x - 24}
                y={y - 24}
                width="52"
                height="52"
                rx="14"
                fill={tone.fill}
                stroke={tone.stroke}
                strokeWidth="3"
              />
              <text
                x={x + 2}
                y={y + 6}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill={tone.text}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ResultsPanel({
  story,
  activeTab,
  simulationState,
  setActiveTab,
}: {
  story: StarterStory;
  activeTab: OutputTab;
  simulationState: "ready" | "running";
  setActiveTab: (tab: OutputTab) => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace outputs
          </div>
          <h3 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
            Keep simulation, explanation, and code in one workspace
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["results", "Simulation result"],
            ["notes", "Guide notes"],
            ["code", "Cirq code"],
          ].map(([key, label]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as OutputTab)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#e0e7ff] text-[#1d4ed8]"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "results" ? (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">Simulation result</div>
              <div className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#2f5be3]">
                {simulationState === "running" ? "Running on simulator" : "Last run ready"}
              </div>
            </div>
            <div className="grid min-h-[250px] grid-cols-2 gap-4 md:grid-cols-4">
              {story.histogram.map((item) => {
                const tone = TONE_STYLES[item.tone];
                return (
                  <div
                    key={item.state}
                    className="flex flex-col items-center justify-end rounded-[20px] border border-[#e2e8f0] bg-white px-4 py-3"
                  >
                    <div className="flex h-[170px] w-full items-end justify-center">
                      <div
                        className={`w-full max-w-[64px] rounded-t-[20px] bg-gradient-to-b ${tone.bar} transition-all duration-700`}
                        style={{
                          height: simulationState === "running" ? "14%" : `${item.probability}%`,
                          opacity: simulationState === "running" ? 0.35 : 1,
                        }}
                      />
                    </div>
                    <div className="mt-3 text-lg font-semibold text-slate-900">{item.probability}%</div>
                    <div className="mt-1 text-sm font-medium text-slate-500">{item.state}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-4">
            <div className="mb-4 text-sm font-semibold text-slate-700">Why this output matters</div>
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>{story.explanation}</p>
              <p>{story.useCaseHint}</p>
              <div className="rounded-[18px] bg-[#f8fafc] p-4 text-slate-600">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Honest framing
                </div>
                QALS-lite is a readiness heuristic and the simulation path is a teaching and prototype aid. It does not imply benchmark superiority or guaranteed quantum advantage.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "notes" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fbff] p-5">
            <div className="text-sm font-semibold text-slate-700">Guide explanation</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{story.explanation}</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{story.useCaseHint}</p>
          </div>
          <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-5">
            <div className="text-sm font-semibold text-slate-700">Recommended next action</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{story.assessment.nextAction}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[story.concept, story.assessment.horizon, story.assessment.confidence].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "code" ? (
        <pre className="circuit-pre">{story.code}</pre>
      ) : null}
    </div>
  );
}

function AssessmentCard({
  story,
  focused,
}: {
  story: StarterStory;
  focused: boolean;
}) {
  const score = story.assessment.score;
  const progress = `${score}%`;
  const marker =
    score >= 75 ? "66%" : score >= 60 ? "42%" : "12%";

  return (
    <div
      id="qals-lite"
      className={`rounded-[28px] border bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)] transition ${
        focused ? "border-[#2f5be3] ring-4 ring-[#dbe5ff]" : "border-[#d8e2f3]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            QALS-lite score
          </div>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-[3rem] font-black tracking-[-0.05em] text-[#2f5be3]">
              {score}
            </div>
            <div className="pb-2 text-lg font-semibold text-slate-500">/ 100</div>
          </div>
        </div>
        <div className="rounded-[18px] bg-[#eaf7f2] px-3 py-2 text-sm font-semibold text-[#158c61]">
          {story.assessment.verdict}
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-3 rounded-full bg-slate-200">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-[#2f5be3] via-[#5f3ef0] to-[#1cc98b]"
            style={{ width: progress }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-4 border-white bg-[#2f5be3] shadow"
            style={{ left: `calc(${marker} - 10px)` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
          <span>Classical now</span>
          <span>Hybrid now</span>
          <span>Hardware later</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[story.assessment.horizon, story.assessment.confidence, formatScoreLabel(score)].map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {story.assessment.explanation.map((item) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
            <span className="mt-[7px] h-2 w-2 rounded-full bg-[#2f5be3]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureCard({
  story,
  focused,
}: {
  story: StarterStory;
  focused: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] border bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)] transition ${
        focused ? "border-[#2f5be3] ring-4 ring-[#dbe5ff]" : "border-[#d8e2f3]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            GCP architecture mapper
          </div>
          <h3 className="mt-1 text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-900">
            Hybrid workflow in one view
          </h3>
        </div>
        <GitBranch className="h-5 w-5 text-[#2f5be3]" />
      </div>

      <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {story.architectureNodes.map((node, index) => {
            const tone = TONE_STYLES[node.tone];
            return (
              <div key={node.id} className="flex items-center gap-2">
                <div
                  className="min-w-[118px] rounded-[20px] border px-3 py-3 text-center shadow-sm"
                  style={{ backgroundColor: tone.fill, borderColor: tone.stroke }}
                >
                  <div className="text-sm font-semibold" style={{ color: tone.text }}>
                    {node.label}
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-500">{node.caption}</div>
                </div>
                {index < story.architectureNodes.length - 1 ? (
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                ) : null}
              </div>
            );
          })}
        </div>

        {story.optionalNode ? (
          <div className="mt-4 flex justify-center">
            <div
              className="rounded-[18px] border px-4 py-3 text-center shadow-sm"
              style={{
                backgroundColor: TONE_STYLES[story.optionalNode.tone].fill,
                borderColor: TONE_STYLES[story.optionalNode.tone].stroke,
              }}
            >
              <div
                className="text-sm font-semibold"
                style={{ color: TONE_STYLES[story.optionalNode.tone].text }}
              >
                {story.optionalNode.label}
              </div>
              <div className="mt-1 text-[11px] leading-4 text-slate-500">
                {story.optionalNode.caption}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{story.architectureSummary}</p>

      <div className="mt-4">
        <Link
          href={`/map?starter=${story.key}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-4 py-2 text-sm font-semibold text-[#2f5be3] transition hover:bg-[#dbe5ff]"
        >
          Open Map view
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ExportCard({
  canExport,
  hasArchitecture,
  exportingType,
  exportStatusMessage,
  exportJobHref,
  exportError,
  onExport,
}: {
  canExport: boolean;
  hasArchitecture: boolean;
  exportingType: Exclude<ArtifactType, "job_output"> | null;
  exportStatusMessage: string | null;
  exportJobHref: string | null;
  exportError: string | null;
  onExport: (type: Exclude<ArtifactType, "job_output">) => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Export bundle
          </div>
          <h3 className="mt-1 text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-900">
            Package the session
          </h3>
        </div>
        <FileDown className="h-5 w-5 text-[#2f5be3]" />
      </div>

      <div className="space-y-3">
        {EXPORT_ITEMS.map((item) => {
          const isDisabled = !canExport || Boolean(item.requiresArchitecture && !hasArchitecture);
          const isPreparing = exportingType === item.type;
          const availabilityLabel = !canExport
            ? "Unavailable"
            : isPreparing
              ? "Preparing"
              : "Download";

          return (
            <div key={item.type} className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <button
                  type="button"
                  disabled={isDisabled || isPreparing}
                  onClick={() => onExport(item.type)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isDisabled || isPreparing
                      ? "bg-white text-slate-400"
                      : "bg-[#eef2ff] text-[#2f5be3] hover:bg-[#dbe5ff]"
                  }`}
                >
                  {availabilityLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[18px] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">
        Keep the exports honest: label simulation-first assumptions, note missing evidence, and preserve the chosen time horizon in the bundle.
      </div>
      {exportStatusMessage ? (
        <div className="mt-4 rounded-[18px] border border-[#d8e2f3] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
            Worker-backed export
          </div>
          {exportStatusMessage}
          <div className="mt-3">
            <Link
              href={exportJobHref ?? "/jobs"}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#2f5be3] transition hover:bg-[#dbe5ff]"
            >
              Open job activity
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
      {exportError ? (
        <div className="mt-4 rounded-[18px] border border-[#fecaca] bg-[#fff1f2] p-4 text-sm leading-6 text-[#b91c1c]">
          {exportError}
        </div>
      ) : null}
    </div>
  );
}

function BuildPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session_id");
  const initialKey = normalizeStarterKey(
    searchParams.get("starter") ?? searchParams.get("circuit"),
  );
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(activeSessionId);

  const [selectedKey, setSelectedKey] = useState<StarterKey>(initialKey);
  const [outputTab, setOutputTab] = useState<OutputTab>("results");
  const [simulationState, setSimulationState] = useState<"ready" | "running">("ready");
  const [focusedCard, setFocusedCard] = useState<FocusCard>(null);
  const [workspaceRun, setWorkspaceRun] = useState<CircuitRun | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureMap | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<Exclude<ArtifactType, "job_output"> | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [sessionTitle, setSessionTitle] = useState(buildDefaultSessionTitle(initialKey, null));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [backgroundJobId, setBackgroundJobId] = useState<string | null>(null);
  const [backgroundRunState, setBackgroundRunState] = useState<"idle" | "queued" | "hydrating">("idle");
  const requestIdRef = useRef(0);
  const restoredSessionRef = useRef<string | null>(null);
  const skippedInitialRestoredRunRef = useRef<string | null>(null);
  const handledExportJobRef = useRef<string | null>(null);
  const handledBackgroundJobRef = useRef<string | null>(null);
  const assessmentRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLDivElement>(null);
  const { data: sessionDetail } = useSession(activeSessionId);
  const { data: projects } = useProjects(50);
  const { data: recentSessions } = useSessions({ limit: 5 });
  const submitJobMutation = useSubmitJob();
  const { data: exportJob } = useJob(exportJobId);
  const { data: backgroundJob } = useJob(backgroundJobId);
  const createProjectMutation = useCreateProject();
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const activeUseCaseId = searchParams.get("use_case_id") ?? sessionDetail?.selected_use_case_id ?? null;
  const { data: selectedUseCase } = useUseCase(activeUseCaseId);

  useEffect(() => {
    setSelectedKey(initialKey);
  }, [initialKey]);

  useEffect(() => {
    setCurrentSessionId(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId || !sessionDetail) return;
    if (restoredSessionRef.current === sessionDetail.id) return;

    restoredSessionRef.current = sessionDetail.id;
    setCurrentSessionId(sessionDetail.id);
    setCurrentProjectId(sessionDetail.project_id);
    setProjectName(sessionDetail.project_name ?? DEFAULT_PROJECT_NAME);
    setSessionTitle(sessionDetail.title);
    setSelectedKey(normalizeStarterKey(sessionDetail.starter_key));
    setWorkspaceRun(sessionDetail.latest_circuit_run);
    setArchitecture(sessionDetail.latest_architecture);
    setOutputTab("results");
    setFocusedCard(null);
    setSaveState("idle");
    setSaveError(null);
    setExportError(null);
  }, [activeSessionId, sessionDetail]);

  useEffect(() => {
    if (currentSessionId || sessionTitle.trim()) return;
    setSessionTitle(buildDefaultSessionTitle(selectedKey, selectedUseCase));
  }, [currentSessionId, selectedKey, selectedUseCase, sessionTitle]);

  const story = useMemo(() => getStarterStory(selectedKey), [selectedKey]);
  const displayStory = useMemo(
    () => mergeLiveStory(story, workspaceRun, architecture, selectedUseCase),
    [architecture, selectedUseCase, story, workspaceRun],
  );

  const hydrateBackgroundRun = useCallback(
    async (runId: string, jobResult: Record<string, unknown> | null) => {
      try {
        const run = await fetchCircuitRun(runId);
        setWorkspaceRun(run);

        const workerArchitecture = architectureFromJobResult(jobResult);
        if (workerArchitecture) {
          setArchitecture(workerArchitecture);
        } else {
          const nextArchitecture = await fetchArchitecture({
            circuit_run_id: run.id,
            use_case_id: run.use_case_id ?? activeUseCaseId ?? undefined,
          });
          setArchitecture(nextArchitecture);
        }

        setOutputTab("results");
      } catch (error) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "The background job completed, but the workspace could not be hydrated.",
        );
      } finally {
        setSimulationState("ready");
        setBackgroundRunState("idle");
        setBackgroundJobId(null);
      }
    },
    [activeUseCaseId],
  );

  const loadWorkspace = useCallback(
    async (starterKey: StarterKey) => {
      const activeRequestId = requestIdRef.current + 1;
      requestIdRef.current = activeRequestId;

      handledBackgroundJobRef.current = null;
      setBackgroundJobId(null);
      setBackgroundRunState("idle");
      setSimulationState("running");
      setWorkspaceError(null);
      setExportError(null);
      setSaveState("idle");

      try {
        const activeStory = getStarterStory(starterKey);
        const run = await runCircuit({
          template_key: starterKey,
          prompt: activeStory.prompt,
          use_case_id: activeUseCaseId ?? undefined,
          session_id: currentSessionId ?? undefined,
        });

        if (requestIdRef.current !== activeRequestId) {
          return;
        }

        setWorkspaceRun(run);

        const nextArchitecture = await fetchArchitecture({
          circuit_run_id: run.id,
          use_case_id: run.use_case_id ?? activeUseCaseId ?? undefined,
        });

        if (requestIdRef.current !== activeRequestId) {
          return;
        }

        setArchitecture(nextArchitecture);
      } catch (error) {
        if (requestIdRef.current !== activeRequestId) {
          return;
        }

        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "The workspace could not load live circuit results.",
        );
      } finally {
        if (requestIdRef.current === activeRequestId) {
          setSimulationState("ready");
        }
      }
    },
    [activeUseCaseId, currentSessionId],
  );

  useEffect(() => {
    if (!backgroundJobId || !backgroundJob) return;

    if (backgroundJob.status === "PENDING" || backgroundJob.status === "RUNNING") {
      setSimulationState("running");
      setBackgroundRunState("queued");
      return;
    }

    if (handledBackgroundJobRef.current === backgroundJob.id) {
      return;
    }
    handledBackgroundJobRef.current = backgroundJob.id;

    if (backgroundJob.status === "FAILED") {
      setBackgroundRunState("idle");
      setSimulationState("ready");
      setWorkspaceError(
        backgroundJob.error_message || "The background worker could not finish the circuit run.",
      );
      setBackgroundJobId(null);
      return;
    }

    if (backgroundJob.status === "COMPLETED") {
      const runId =
        typeof backgroundJob.result?.circuit_run_id === "string"
          ? backgroundJob.result.circuit_run_id
          : null;

      if (!runId) {
        setBackgroundRunState("idle");
        setSimulationState("ready");
        setWorkspaceError(
          "The worker completed without returning a persisted circuit run identifier.",
        );
        setBackgroundJobId(null);
        return;
      }

      setBackgroundRunState("hydrating");
      void hydrateBackgroundRun(runId, backgroundJob.result);
    }
  }, [backgroundJob, backgroundJobId, hydrateBackgroundRun]);

  useEffect(() => {
    if (!exportJobId || !exportJob) return;

    if (exportJob.status === "PENDING" || exportJob.status === "RUNNING") {
      return;
    }

    if (handledExportJobRef.current === exportJob.id) {
      return;
    }
    handledExportJobRef.current = exportJob.id;

    if (exportJob.status === "FAILED") {
      setExportError(
        exportJob.error_message || "The worker could not generate the session summary export.",
      );
      setExportingType(null);
      setExportJobId(null);
      return;
    }

    if (exportJob.status === "COMPLETED") {
      const artifactId =
        typeof exportJob.result?.artifact_id === "string" ? exportJob.result.artifact_id : null;
      const filename =
        typeof exportJob.result?.filename === "string" ? exportJob.result.filename : "session_summary.md";

      if (!artifactId) {
        setExportError("The worker completed without returning an export artifact identifier.");
        setExportingType(null);
        setExportJobId(null);
        return;
      }

      const link = document.createElement("a");
      link.href = getArtifactDownloadUrl(artifactId);
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportError(null);
      setExportingType(null);
      setExportJobId(null);
    }
  }, [exportJob, exportJobId]);

  useEffect(() => {
    if (activeSessionId && !sessionDetail) {
      return;
    }
    if (
      activeSessionId &&
      sessionDetail?.latest_circuit_run &&
      skippedInitialRestoredRunRef.current !== sessionDetail.id
    ) {
      skippedInitialRestoredRunRef.current = sessionDetail.id;
      return;
    }
    void loadWorkspace(selectedKey);
  }, [activeSessionId, loadWorkspace, selectedKey, sessionDetail]);

  function syncQuery(
    nextKey: StarterKey,
    overrides?: {
      sessionId?: string | null;
      useCaseId?: string | null;
    },
  ) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("starter", nextKey);
    params.delete("circuit");
    const nextSessionId =
      overrides && "sessionId" in overrides ? overrides.sessionId : currentSessionId;
    const nextUseCaseId =
      overrides && "useCaseId" in overrides ? overrides.useCaseId : activeUseCaseId;

    if (nextSessionId) {
      params.set("session_id", nextSessionId);
    } else {
      params.delete("session_id");
    }

    if (nextUseCaseId) {
      params.set("use_case_id", nextUseCaseId);
    } else {
      params.delete("use_case_id");
    }

    router.replace(`/build?${params.toString()}`, { scroll: false });
  }

  function selectStarter(nextKey: StarterKey) {
    handledBackgroundJobRef.current = null;
    setBackgroundJobId(null);
    setBackgroundRunState("idle");
    setSelectedKey(nextKey);
    setOutputTab("results");
    setFocusedCard(null);
    setSaveState("idle");
    syncQuery(nextKey);
  }

  function cycleStarter() {
    const currentIndex = STARTER_ORDER.indexOf(selectedKey);
    const nextKey = STARTER_ORDER[(currentIndex + 1) % STARTER_ORDER.length];
    selectStarter(nextKey);
  }

  function runSimulation() {
    setOutputTab("results");
    void loadWorkspace(selectedKey);
  }

  async function queueBackgroundRun() {
    const activeStory = getStarterStory(selectedKey);
    handledBackgroundJobRef.current = null;
    setBackgroundRunState("queued");
    setSimulationState("running");
    setWorkspaceError(null);
    setExportError(null);
    setSaveState("idle");

    try {
      const job = await submitJobMutation.mutateAsync({
        job_type: selectedKey,
        payload: {
          prompt: activeStory.prompt,
          session_id: currentSessionId ?? undefined,
          use_case_id: activeUseCaseId ?? undefined,
        },
      });
      setBackgroundJobId(job.id);
    } catch (error) {
      setBackgroundRunState("idle");
      setSimulationState("ready");
      setWorkspaceError(
        error instanceof Error
          ? error.message
          : "The background run could not be queued.",
      );
    }
  }

  function focusCard(which: FocusCard) {
    setFocusedCard(which);
    const target = which === "assessment" ? assessmentRef.current : architectureRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function saveWorkspace() {
    if (!workspaceRun) {
      setSaveError("Generate a circuit first so there is a live workspace to save.");
      return;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      let nextProjectId = currentProjectId;
      const trimmedProjectName = projectName.trim() || DEFAULT_PROJECT_NAME;
      const trimmedSessionTitle =
        sessionTitle.trim() || buildDefaultSessionTitle(selectedKey, selectedUseCase);

      if (!nextProjectId) {
        const project = await createProjectMutation.mutateAsync({
          name: trimmedProjectName,
          description: "Saved Hybrid Lab workspaces and demo sessions.",
          status: "active",
        });
        nextProjectId = project.id;
        setCurrentProjectId(project.id);
        setProjectName(project.name);
      }

      const body = {
        project_id: nextProjectId ?? undefined,
        selected_use_case_id: activeUseCaseId ?? undefined,
        title: trimmedSessionTitle,
        current_mode: "build",
        starter_key: selectedKey,
        notes: {
          last_saved_at: new Date().toISOString(),
          last_architecture_id: architecture?.id ?? null,
        },
        latest_circuit_run_id: workspaceRun.id,
      };

      const savedSession = currentSessionId
        ? await updateSessionMutation.mutateAsync({
            id: currentSessionId,
            body,
          })
        : await createSessionMutation.mutateAsync(body);

      setCurrentSessionId(savedSession.id);
      setCurrentProjectId(savedSession.project_id);
      setSessionTitle(savedSession.title);
      setProjectName(savedSession.project_name ?? trimmedProjectName);
      setSaveState("saved");
      syncQuery(selectedKey, {
        sessionId: savedSession.id,
        useCaseId: savedSession.selected_use_case_id,
      });
    } catch (error) {
      setSaveState("idle");
      setSaveError(
        error instanceof Error
          ? error.message
          : "The workspace could not be saved.",
      );
    }
  }

  function openSavedSession(session: SavedSession) {
    restoredSessionRef.current = null;
    skippedInitialRestoredRunRef.current = null;
    handledExportJobRef.current = null;
    setExportJobId(null);
    handledBackgroundJobRef.current = null;
    setBackgroundJobId(null);
    setBackgroundRunState("idle");
    setSaveState("idle");
    setSaveError(null);
    setWorkspaceError(null);
    setExportError(null);
    setWorkspaceRun(null);
    setArchitecture(null);
    setCurrentSessionId(session.id);
    setCurrentProjectId(session.project_id);
    setProjectName(session.project_name ?? DEFAULT_PROJECT_NAME);
    setSessionTitle(session.title);
    syncQuery(normalizeStarterKey(session.starter_key), {
      sessionId: session.id,
      useCaseId: session.selected_use_case_id,
    });
  }

  function resetWorkspace() {
    restoredSessionRef.current = null;
    skippedInitialRestoredRunRef.current = null;
    handledExportJobRef.current = null;
    setExportJobId(null);
    handledBackgroundJobRef.current = null;
    setBackgroundJobId(null);
    setBackgroundRunState("idle");
    setCurrentSessionId(null);
    setCurrentProjectId(null);
    setWorkspaceRun(null);
    setArchitecture(null);
    setProjectName(DEFAULT_PROJECT_NAME);
    setSessionTitle(buildDefaultSessionTitle(selectedKey, selectedUseCase));
    setSaveState("idle");
    setSaveError(null);
    syncQuery(selectedKey, {
      sessionId: null,
      useCaseId: activeUseCaseId,
    });
  }

  async function exportArtifact(type: Exclude<ArtifactType, "job_output">) {
    if (!workspaceRun) {
      setExportError("Run a circuit first so the export bundle has real content.");
      return;
    }

    setExportingType(type);
    setExportError(null);

    try {
      if (type === "session_summary") {
        handledExportJobRef.current = null;
        const job = await submitJobMutation.mutateAsync({
          job_type: "session_summary_export",
          payload: {
            circuit_run_id: workspaceRun.id,
            architecture_record_id: architecture?.id ?? undefined,
          },
        });
        setExportJobId(job.id);
        return;
      }

      const artifact = await createArtifact({
        artifact_type: type,
        circuit_run_id: workspaceRun.id,
        architecture_record_id: architecture?.id ?? undefined,
      });
      const link = document.createElement("a");
      link.href = getArtifactDownloadUrl(artifact.id);
      link.download = artifact.filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "The export could not be generated.",
      );
      setExportJobId(null);
    } finally {
      if (type !== "session_summary") {
        setExportingType(null);
      }
    }
  }

  const isLoadingWorkspace =
    simulationState === "running";
  const backgroundStatusMessage =
    backgroundRunState === "hydrating"
      ? "Background run completed. Syncing the persisted circuit run and architecture back into the workspace."
      : backgroundJob?.status === "RUNNING"
        ? "Worker is executing the simulator run now. The result will rehydrate this workspace when it completes."
        : backgroundJob?.status === "PENDING"
          ? "Background run queued. The worker will pick up the job and persist the next circuit run."
          : null;
  const exportStatusMessage =
    exportJob?.status === "RUNNING"
      ? "Worker is generating the session summary in the background. The download will start automatically when it completes."
      : exportJob?.status === "PENDING"
        ? "Session summary export queued. The worker will package the artifact and attach it to this workspace history."
        : null;
  const backgroundJobHref = backgroundJobId ? `/jobs?job_id=${backgroundJobId}` : "/jobs";
  const exportJobHref = exportJobId ? `/jobs?job_id=${exportJobId}` : "/jobs";

  function selectProject(projectId: string | null) {
    if (!projectId) {
      setCurrentProjectId(null);
      setProjectName(DEFAULT_PROJECT_NAME);
      setSaveState("idle");
      return;
    }

    const project = projects?.items.find((item) => item.id === projectId);
    setCurrentProjectId(projectId);
    if (project) {
      setProjectName(project.name);
    }
    setSaveState("idle");
  }

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-[#dbe5f1] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
                Hybrid lab
              </span>
              <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#157052]">
                Simulation first
              </span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Hardware optional
              </span>
              {selectedUseCase ? (
                <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
                  Use case: {selectedUseCase.title}
                </span>
              ) : null}
            </div>
            <h1 className="text-[clamp(2.15rem,4vw,3.35rem)] font-black tracking-[-0.05em] text-slate-900">
              Build a toy prototype, then map it to GCP
            </h1>
            <p className="mt-3 text-[1.05rem] leading-8 text-slate-600">
              One workspace for guided circuit generation, plain-English explanation,
              simulation output, QALS-lite readiness, and a simulator-first GCP architecture story.
            </p>
            {workspaceError ? (
              <div className="mt-4 rounded-[18px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
                Live backend request failed. The workspace is still showing the storyboard shell.
                <span className="block pt-1 text-xs text-[#991b1b]">{workspaceError}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setOutputTab("notes");
                void loadWorkspace(selectedKey);
              }}
              disabled={isLoadingWorkspace}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
            >
              <Bot className="h-4 w-4" />
              {isLoadingWorkspace ? "Refreshing workspace" : "Ask inside workspace"}
            </button>
            <Link
              href={`/map?starter=${displayStory.key}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)] transition hover:-translate-y-[1px]"
            >
              Open architecture view
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setOutputTab("notes");
              void loadWorkspace(selectedKey);
            }}
            disabled={isLoadingWorkspace}
            className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.25)]"
          >
            <Wand2 className="h-4 w-4" />
            {isLoadingWorkspace ? "Generating..." : "Generate circuit"}
          </button>
          <button
            type="button"
            onClick={runSimulation}
            disabled={isLoadingWorkspace}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
          >
            <Play className="h-4 w-4" />
            {isLoadingWorkspace ? "Running simulation" : "Run simulation"}
          </button>
          <button
            type="button"
            onClick={queueBackgroundRun}
            disabled={isLoadingWorkspace}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
          >
            <Clock3 className="h-4 w-4" />
            {backgroundRunState === "idle" ? "Run in worker" : "Worker in progress"}
          </button>
          <button
            type="button"
            onClick={() => setOutputTab("code")}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
          >
            <Code2 className="h-4 w-4" />
            Show Cirq code
          </button>
          <button
            type="button"
            onClick={() => focusCard("assessment")}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
          >
            <Sparkles className="h-4 w-4" />
            Assess fit
          </button>
          <button
            type="button"
            onClick={() => focusCard("architecture")}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
          >
            <GitBranch className="h-4 w-4" />
            Map to GCP
          </button>
        </div>

        {backgroundStatusMessage ? (
          <div className="mb-6 rounded-[22px] border border-[#d8e2f3] bg-[#f8fbff] px-4 py-4 text-sm leading-7 text-slate-600">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Worker-backed run
            </div>
            {backgroundStatusMessage}
            <div className="mt-3">
              <Link
                href={backgroundJobHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#2f5be3] transition hover:bg-[#dbe5ff]"
              >
                Open job activity
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_330px]">
          <WorkspaceRail
            active="hybrid-lab"
            tip="Use the starter prompts to move from intuition into a credible prototype path without leaving the workspace."
          />

          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
              <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Quantum guide
                    </div>
                    <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.02em] text-slate-900">
                      One guide, one workspace
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]">
                    {displayStory.badge}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[22px] bg-[#eef2ff] p-4 text-sm leading-7 text-[#2f5be3]">
                    {displayStory.prompt}
                  </div>
                  <div className="rounded-[22px] border border-[#d8e2f3] bg-[#f8fbff] p-4 text-sm leading-7 text-slate-600">
                    {displayStory.guideReply}
                  </div>
                  <div className="rounded-[22px] border border-[#e2e8f0] bg-white p-4 text-sm leading-7 text-slate-500">
                    {displayStory.guideFollowUp}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Starter prompts
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STARTER_ORDER.map((key) => {
                      const starter = getStarterStory(key);
                      const isActive = key === selectedKey;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => selectStarter(key)}
                          disabled={isLoadingWorkspace}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                            isActive
                              ? "bg-[#2f5be3] text-white shadow-[0_12px_24px_rgba(47,91,227,0.22)]"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {starter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cycleStarter}
                  disabled={isLoadingWorkspace}
                  className="mt-5 w-full rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.24)] transition hover:-translate-y-[1px]"
                >
                  {isLoadingWorkspace ? "Updating workspace..." : "Generate next artifact"}
                </button>
              </div>

              <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Prompt-to-circuit
                    </div>
                    <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.02em] text-slate-900">
                      {displayStory.label}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#2f5be3]">
                      {displayStory.concept}
                    </span>
                    <span className="rounded-full bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-500">
                      Cirq code
                    </span>
                  </div>
                </div>

                <CircuitCanvas story={displayStory} />

                <div className="mt-4 rounded-[22px] bg-[#f8fbff] p-4 text-sm leading-7 text-slate-600">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Guide explanation
                  </div>
                  {displayStory.explanation}
                </div>
              </div>
            </div>

            <ResultsPanel
              story={displayStory}
              activeTab={outputTab}
              simulationState={simulationState}
              setActiveTab={setOutputTab}
            />
          </div>

          <div className="space-y-5">
            <WorkspaceMemoryCard
              currentProjectId={currentProjectId}
              projectName={projectName}
              sessionTitle={sessionTitle}
              currentSessionId={currentSessionId}
              saveState={saveState}
              saveError={saveError}
              availableProjects={projects?.items ?? []}
              recentSessions={recentSessions?.items ?? []}
              isBusy={saveState === "saving"}
              onProjectSelectionChange={selectProject}
              onProjectNameChange={setProjectName}
              onSessionTitleChange={setSessionTitle}
              onSave={saveWorkspace}
              onOpenSession={openSavedSession}
              onReset={resetWorkspace}
            />
            <div ref={assessmentRef}>
              <AssessmentCard story={displayStory} focused={focusedCard === "assessment"} />
            </div>
            <div ref={architectureRef}>
              <ArchitectureCard story={displayStory} focused={focusedCard === "architecture"} />
            </div>
            <ExportCard
              canExport={Boolean(workspaceRun)}
              hasArchitecture={Boolean(architecture?.id)}
              exportingType={exportingType}
              exportStatusMessage={exportStatusMessage}
              exportJobHref={exportJobHref}
              exportError={exportError}
              onExport={exportArtifact}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function BuildPageFallback() {
  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 h-8 w-56 rounded-full bg-slate-200" />
        <div className="mb-4 h-14 max-w-[520px] rounded-[24px] bg-slate-200" />
        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_330px]">
          <div className="skeleton h-[620px]" />
          <div className="space-y-5">
            <div className="skeleton h-[360px]" />
            <div className="skeleton h-[320px]" />
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

export default function BuildPage() {
  return (
    <Suspense fallback={<BuildPageFallback />}>
      <BuildPageContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileBadge2,
  FlaskConical,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { useCreateAssessment, useUseCases } from "@/lib/hooks";
import {
  STARTER_ORDER,
  StarterKey,
  getStarterStory,
  normalizeStarterKey,
} from "@/lib/studio-mocks";
import {
  Assessment,
  AssessmentInputs,
  AssessmentRecommendation,
  UseCase,
} from "@/types/api";

const QUESTIONS: Array<{
  key: keyof AssessmentInputs;
  label: string;
  hint: string;
  options: Array<{
    value: AssessmentInputs[keyof AssessmentInputs];
    label: string;
  }>;
}> = [
  {
    key: "problem_size",
    label: "Problem size",
    hint: "How large is the search space, data shape, or decision surface?",
    options: [
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" },
      { value: "large", label: "Large" },
      { value: "very_large", label: "Very large" },
    ],
  },
  {
    key: "data_structure",
    label: "Data structure",
    hint: "Can the workload be expressed with graphs, matrices, or Hamiltonian-like structure?",
    options: [
      { value: "unstructured", label: "Unstructured" },
      { value: "structured", label: "Structured" },
      { value: "quantum_native", label: "Quantum native" },
    ],
  },
  {
    key: "classical_hardness",
    label: "Classical hardness",
    hint: "How quickly do classical baselines hit cost, time, or scaling walls?",
    options: [
      { value: "easy", label: "Easy" },
      { value: "medium", label: "Medium" },
      { value: "hard", label: "Hard" },
      { value: "intractable", label: "Intractable" },
    ],
  },
  {
    key: "timeline",
    label: "Time horizon",
    hint: "When does this need to matter to the buyer or delivery team?",
    options: [
      { value: "now", label: "Now" },
      { value: "1-2 years", label: "1-2 years" },
      { value: "2-3 years", label: "2-3 years" },
      { value: "5+ years", label: "5+ years" },
    ],
  },
];

function buildDefaultInputs(starter: StarterKey, useCase: UseCase): AssessmentInputs {
  const problemSize =
    useCase.complexity_score >= 4.5
      ? "very_large"
      : useCase.complexity_score >= 3.5
        ? "large"
        : useCase.complexity_score >= 2.5
          ? "medium"
          : "small";

  const dataStructure =
    starter === "chemistry" || useCase.industry === "materials" || useCase.industry === "pharma"
      ? "quantum_native"
      : "structured";

  const classicalHardness =
    useCase.complexity_score >= 4.5
      ? "intractable"
      : useCase.complexity_score >= 3.5
        ? "hard"
        : "medium";

  const timeline =
    useCase.horizon === "near-term"
      ? "1-2 years"
      : useCase.horizon === "mid-term"
        ? "2-3 years"
        : "5+ years";

  return {
    problem_size: problemSize,
    data_structure: dataStructure,
    classical_hardness: classicalHardness,
    timeline,
  };
}

const RECOMMENDATION_META: Record<
  AssessmentRecommendation,
  {
    label: string;
    eyebrow: string;
    summary: string;
    badgeClassName: string;
    panelClassName: string;
  }
> = {
  classical_now: {
    label: "Classical now",
    eyebrow: "Best immediate path",
    summary: "Keep the workload in a strong classical lane for now and revisit quantum only if the constraints materially change.",
    badgeClassName: "bg-slate-900/10 text-slate-800",
    panelClassName: "border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)]",
  },
  hybrid_pilot_now: {
    label: "Hybrid pilot now",
    eyebrow: "Primary recommendation",
    summary: "This is strong enough for a simulator-first hybrid pilot with a real KPI, a bounded scope, and evidence behind it.",
    badgeClassName: "bg-[#dcfce7] text-[#166534]",
    panelClassName: "border-[#b7e4c7] bg-[linear-gradient(135deg,#f3fff7,#ecfdf5)]",
  },
  watchlist: {
    label: "Watchlist",
    eyebrow: "Promising, not ready",
    summary: "The case is directionally credible, but the evidence or pilot design still needs to sharpen before committing.",
    badgeClassName: "bg-[#fef3c7] text-[#92400e]",
    panelClassName: "border-[#f7d58d] bg-[linear-gradient(135deg,#fffdf5,#fff7db)]",
  },
  research_only: {
    label: "Research only",
    eyebrow: "Longer-horizon fit",
    summary: "Treat this as a research track for now. The idea may matter later, but it is not a near-term business pilot yet.",
    badgeClassName: "bg-[#ede9fe] text-[#6d28d9]",
    panelClassName: "border-[#d9ccff] bg-[linear-gradient(135deg,#faf7ff,#f5f3ff)]",
  },
};

function deriveFallbackRecommendation(useCase: UseCase | null): AssessmentRecommendation {
  if (!useCase) return "watchlist";
  if (useCase.horizon === "near-term") return "watchlist";
  if (useCase.horizon === "long-term") return "research_only";
  return "watchlist";
}

function buildFallbackWhyPromising(useCase: UseCase | null): string[] {
  if (!useCase) {
    return ["Pick a seeded use case to generate a recommendation and supporting rationale."];
  }

  const reasons = [
    `${useCase.title} is already framed as a concrete ${useCase.industry} workflow instead of a vague quantum concept.`,
  ];

  if (useCase.blueprint.hybrid_pattern) {
    reasons.push("The use-case blueprint already describes how a hybrid workflow could fit beside the classical stack.");
  }

  if (useCase.evidence_items.length >= 2) {
    reasons.push(`There are ${useCase.evidence_items.length} evidence items attached to the use case today.`);
  }

  return reasons;
}

function buildFallbackWhyNotNow(useCase: UseCase | null): string[] {
  if (!useCase) {
    return ["The assessment needs a selected use case before it can call out the tradeoffs clearly."];
  }

  const reasons = [
    "The recommendation is still based on deterministic heuristics, not a benchmark claim.",
  ];

  if (useCase.horizon === "long-term") {
    reasons.push("This use case is explicitly long-term, which keeps it out of an immediate pilot lane.");
  }

  if (!useCase.blueprint.next_90_days?.length) {
    reasons.push("A concrete 90-day benchmark plan has not been filled in yet.");
  }

  return reasons;
}

function buildFallbackBlockers(useCase: UseCase | null): string[] {
  if (!useCase) {
    return ["Select a use case to see blockers and next actions."];
  }

  const blockers = [];

  if (useCase.horizon === "long-term") {
    blockers.push("The use case sits on a longer hardware and algorithm timeline.");
  }

  if (useCase.evidence_items.length < 2) {
    blockers.push("The evidence base is still thin for a stronger recommendation.");
  }

  if (!useCase.blueprint.hybrid_pattern) {
    blockers.push("The hybrid workflow is not scoped tightly enough yet.");
  }

  return blockers.length ? blockers : ["The main blocker is turning the blueprint into a disciplined benchmark plan."];
}

function buildFallbackNext90Days(useCase: UseCase | null): string[] {
  if (useCase?.blueprint.next_90_days?.length) {
    return useCase.blueprint.next_90_days;
  }

  return [
    "Define one narrow workflow and KPI before expanding the scope.",
    "Benchmark the classical baseline against a simulator-first experiment on the same data.",
    "Revisit the recommendation once the benchmark evidence is documented.",
  ];
}

function formatPublishedDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercent(score: number) {
  return Math.round(score * 100);
}

function AssessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const starter = normalizeStarterKey(
    searchParams.get("starter") ?? searchParams.get("circuit"),
  );
  const story = getStarterStory(starter);
  const selectedUseCaseId = searchParams.get("use_case_id");
  const { data: useCaseList, isLoading, error } = useUseCases();
  const { mutateAsync, isPending } = useCreateAssessment();
  const [inputs, setInputs] = useState<AssessmentInputs | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const selectedUseCase = useMemo(() => {
    const items = useCaseList?.items ?? [];
    if (!items.length) return null;
    return items.find((item) => item.id === selectedUseCaseId) ?? items[0];
  }, [selectedUseCaseId, useCaseList?.items]);

  const runAssessment = useCallback(async (useCase: UseCase, nextInputs: AssessmentInputs) => {
    try {
      setPageError(null);
      const assessment = await mutateAsync({
        use_case_id: useCase.id,
        user_inputs: nextInputs,
      });
      setResult(assessment);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "The readiness assessment could not be completed.",
      );
    }
  }, [mutateAsync]);

  useEffect(() => {
    if (!selectedUseCase) return;
    const defaults = buildDefaultInputs(starter, selectedUseCase);
    setInputs(defaults);
    setResult(null);
    setPageError(null);
    void runAssessment(selectedUseCase, defaults);
  }, [runAssessment, selectedUseCase, starter]);

  function syncQuery(nextStarter: StarterKey, nextUseCaseId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("starter", nextStarter);
    params.delete("circuit");
    if (nextUseCaseId) {
      params.set("use_case_id", nextUseCaseId);
    } else {
      params.delete("use_case_id");
    }
    router.replace(`/assess?${params.toString()}`, { scroll: false });
  }

  function selectStarter(nextStarter: StarterKey) {
    syncQuery(nextStarter, selectedUseCase?.id ?? null);
  }

  function selectUseCase(useCaseId: string) {
    syncQuery(starter, useCaseId);
  }

  function updateInput(key: keyof AssessmentInputs, value: AssessmentInputs[keyof AssessmentInputs]) {
    setInputs((current) => {
      if (!current) return current;
      return { ...current, [key]: value } as AssessmentInputs;
    });
  }

  async function rerunAssessment() {
    if (!selectedUseCase || !inputs) return;
    await runAssessment(selectedUseCase, inputs);
  }

  const recommendation = result?.recommendation ?? deriveFallbackRecommendation(selectedUseCase);
  const recommendationMeta = RECOMMENDATION_META[recommendation];
  const whyPromising = result?.why_promising?.length
    ? result.why_promising
    : buildFallbackWhyPromising(selectedUseCase);
  const whyNotNow = result?.why_not_now?.length
    ? result.why_not_now
    : buildFallbackWhyNotNow(selectedUseCase);
  const topBlockers = result?.top_blockers?.length
    ? result.top_blockers
    : buildFallbackBlockers(selectedUseCase);
  const next90Days = result?.next_90_days?.length
    ? result.next_90_days
    : buildFallbackNext90Days(selectedUseCase);
  const evidenceItems = selectedUseCase?.evidence_items ?? [];
  const buildHref = selectedUseCase
    ? `/build?starter=${story.key}&use_case_id=${selectedUseCase.id}`
    : `/build?starter=${story.key}`;
  const exploreHref = selectedUseCase
    ? `/explore?use_case_id=${selectedUseCase.id}`
    : "/explore";

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Idea evaluator
            </span>
            <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#157052]">
              Decision recommendation
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Deterministic heuristic
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-slate-900">
            Decide the next move for a quantum use case
          </h1>
          <p className="mt-3 max-w-[760px] text-[1.02rem] leading-8 text-slate-600">
            Use a real seeded industry case, tune the assumptions openly, and let
            the product recommend the next move: classical now, hybrid pilot now,
            watchlist, or research only.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_320px]">
          <WorkspaceRail
            active="idea-evaluator"
            tip="Use the evaluator after Learn or Explore so the score lands in context instead of acting like a black-box answer."
          />

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Prototype lane
              </div>
              <div className="flex flex-wrap gap-2">
                {STARTER_ORDER.map((item) => {
                  const selected = item === starter;
                  const lane = getStarterStory(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selectStarter(item)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        selected
                          ? "bg-[#2f5be3] text-white shadow-[0_12px_24px_rgba(47,91,227,0.22)]"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {lane.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4 text-sm leading-7 text-slate-600">
                {story.guideReply}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Industry context
                  </div>
                  <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
                    Choose the use case being qualified
                  </h2>
                </div>
                {selectedUseCase ? (
                  <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold capitalize text-[#2f5be3]">
                    {selectedUseCase.industry}
                  </span>
                ) : null}
              </div>

              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="skeleton h-[96px]" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[20px] border border-[#fecaca] bg-[#fff1f2] p-4 text-sm leading-6 text-[#b91c1c]">
                  {error instanceof Error ? error.message : "The use-case catalog could not be loaded."}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(useCaseList?.items ?? []).slice(0, 8).map((useCase) => {
                    const selected = useCase.id === selectedUseCase?.id;
                    return (
                      <button
                        key={useCase.id}
                        type="button"
                        onClick={() => selectUseCase(useCase.id)}
                        className={`rounded-[22px] border px-4 py-4 text-left transition ${
                          selected
                            ? "border-[#2f5be3] bg-[#eef2ff] shadow-[0_14px_30px_rgba(47,91,227,0.12)]"
                            : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#c7d7f4] hover:bg-white"
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-900">{useCase.title}</div>
                        <div className="mt-2 text-xs leading-6 text-slate-500">{useCase.description}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Decision inputs
                  </div>
                  <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
                    Adjust the assumptions in plain language
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void rerunAssessment()}
                  disabled={!selectedUseCase || !inputs || isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isPending ? "Generating..." : "Generate recommendation"}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {QUESTIONS.map((question) => (
                  <div key={question.key} className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {question.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{question.hint}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {question.options.map((option) => {
                        const selected = inputs?.[question.key] === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateInput(question.key, option.value)}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                              selected
                                ? "bg-[#2f5be3] text-white shadow-[0_12px_24px_rgba(47,91,227,0.22)]"
                                : "bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className={`rounded-[28px] border p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)] ${recommendationMeta.panelClassName}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[760px]">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {recommendationMeta.eyebrow}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="text-[clamp(1.9rem,3vw,2.8rem)] font-black tracking-[-0.05em] text-slate-900">
                        {recommendationMeta.label}
                      </h2>
                      <span className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${recommendationMeta.badgeClassName}`}>
                        {selectedUseCase?.horizon ?? "assessment"}
                      </span>
                    </div>
                    <p className="mt-3 max-w-[680px] text-sm leading-7 text-slate-600">
                      {recommendationMeta.summary}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[22px] border border-white/70 bg-white/80 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Starter lane
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-800">{story.label}</div>
                      </div>
                      <div className="rounded-[22px] border border-white/70 bg-white/80 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Evidence items
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-800">{evidenceItems.length}</div>
                      </div>
                      <div className="rounded-[22px] border border-white/70 bg-white/80 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Pilot scope
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-800">
                          {selectedUseCase?.blueprint.pilot_scope_weeks
                            ? `${selectedUseCase.blueprint.pilot_scope_weeks} weeks`
                            : "Scope pending"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[220px] rounded-[24px] border border-white/80 bg-white/85 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      CTA
                    </div>
                    <div className="mt-4 space-y-3">
                      <Link
                        href={buildHref}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)] transition hover:-translate-y-[1px]"
                      >
                        Go to Build
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={exploreHref}
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Back to Explore
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#158c61]" />
                    Why this could work
                  </div>
                  <div className="space-y-3">
                    {whyPromising.map((item) => (
                      <div key={item} className="rounded-[18px] border border-[#dcfce7] bg-[#f3fff7] p-4 text-sm leading-6 text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ShieldAlert className="h-4 w-4 text-[#c2410c]" />
                    What blocks it today
                  </div>
                  <div className="space-y-3">
                    {topBlockers.map((item) => (
                      <div key={item} className="rounded-[18px] border border-[#fed7aa] bg-[#fff7ed] p-4 text-sm leading-6 text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {whyNotNow.map((item) => (
                      <div key={item} className="text-sm leading-6 text-slate-500">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ClipboardList className="h-4 w-4 text-[#2f5be3]" />
                    Best next 90 days
                  </div>
                  <div className="space-y-3">
                    {next90Days.map((item) => (
                      <div key={item} className="rounded-[18px] border border-[#dbeafe] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FileBadge2 className="h-4 w-4 text-[#2f5be3]" />
                    Evidence
                  </div>
                  <div className="space-y-3">
                    {evidenceItems.length ? evidenceItems.map((item) => (
                      <div key={`${item.title}-${item.published_at}`} className="rounded-[20px] border border-[#e2e8f0] bg-[#fbfdff] p-4">
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-600">{item.claim}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-400">
                          <span>{item.publisher}</span>
                          <span>•</span>
                          <span>{formatPublishedDate(item.published_at)}</span>
                        </div>
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center text-sm font-semibold text-[#2f5be3] transition hover:text-[#1d4ed8]"
                        >
                          Open source
                        </a>
                      </div>
                    )) : (
                      <div className="rounded-[20px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm leading-6 text-slate-500">
                        No structured evidence items are attached to this use case yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <details className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                  QALS-lite details
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                  <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      qals_score
                    </div>
                    <div className="mt-2 text-[2.6rem] font-black tracking-[-0.05em] text-[#2f5be3]">
                      {result ? formatPercent(result.qals_score) : story.assessment.score}
                    </div>
                    <div className="text-sm font-semibold text-slate-500">
                      {result?.verdict ?? story.assessment.verdict}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <FlaskConical className="h-4 w-4 text-[#2f5be3]" />
                      Score breakdown
                    </div>
                    <div className="space-y-3">
                      {(result ? Object.entries(result.score_breakdown) : []).map(([label, value]) => (
                        <div key={label}>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-semibold uppercase tracking-[0.14em]">
                              {label.replaceAll("_", " ")}
                            </span>
                            <span>{Math.round(value * 100)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-[#2f5be3] via-[#5f3ef0] to-[#1cc98b]"
                              style={{ width: `${Math.max(10, value * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {!result ? (
                        <div className="text-sm leading-6 text-slate-500">
                          Run the assessment to populate the weighted QALS-lite breakdown.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Decision notes
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The recommendation is deterministic and simulation-first. It is meant to guide the next product move, not to imply benchmarked quantum advantage.
              </p>
              <div className="mt-4 rounded-[20px] border border-[#e2e8f0] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">
                Keep the selected use case attached when you move into Build so the circuit, architecture map, and exported narrative stay in one thread.
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Selected use case
              </div>
              {selectedUseCase ? (
                <>
                  <div className="mt-3 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                    {selectedUseCase.title}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {selectedUseCase.quantum_approach}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Pick a seeded use case to see the live decision rationale.
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-[#2f5be3]" />
                Guardrails
              </div>
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>Keep simulation-first language visible throughout the scorecard.</p>
                <p>Use the score to explain tradeoffs, not to imply a benchmark win.</p>
                <p>Let the product say “not yet” when the assumptions are weak.</p>
              </div>
            </div>

            {pageError ? (
              <div className="rounded-[28px] border border-[#fecaca] bg-[#fff1f2] p-5 text-sm leading-7 text-[#b91c1c]">
                {pageError}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function AssessPageFallback() {
  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 h-8 w-56 rounded-full bg-slate-200" />
        <div className="mb-4 h-14 max-w-[480px] rounded-[24px] bg-slate-200" />
        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_320px]">
          <div className="skeleton h-[560px]" />
          <div className="space-y-5">
            <div className="skeleton h-[180px]" />
            <div className="skeleton h-[240px]" />
            <div className="skeleton h-[520px]" />
          </div>
          <div className="space-y-5">
            <div className="skeleton h-[220px]" />
            <div className="skeleton h-[220px]" />
            <div className="skeleton h-[180px]" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<AssessPageFallback />}>
      <AssessPageContent />
    </Suspense>
  );
}

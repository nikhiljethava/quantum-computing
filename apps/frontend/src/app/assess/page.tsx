"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { useCreateAssessment, useUseCases } from "@/lib/hooks";
import {
  STARTER_ORDER,
  StarterKey,
  getStarterStory,
  normalizeStarterKey,
} from "@/lib/studio-mocks";
import { Assessment, AssessmentInputs, UseCase } from "@/types/api";

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

function deriveTimeHorizon(score: number) {
  if (score >= 0.75) return "Hybrid experiment now";
  if (score >= 0.55) return "Prototype now";
  if (score >= 0.35) return "Hardware-gated later";
  return "Classical now";
}

function deriveConfidence(score: number) {
  if (score >= 0.7) return "Medium confidence";
  if (score >= 0.45) return "Moderate confidence";
  return "Lower confidence";
}

function buildExplanation(
  useCase: UseCase,
  story: ReturnType<typeof getStarterStory>,
  inputs: AssessmentInputs,
  assessment: Assessment,
) {
  const score = assessment.qals_score;
  return [
    `${useCase.title} is anchored to the ${useCase.industry} industry and starts from a complexity score of ${useCase.complexity_score.toFixed(1)} / 5.`,
    `${story.label} keeps the recommendation simulation-first, with ${inputs.classical_hardness.replace("_", " ")} classical pressure and ${inputs.data_structure.replace("_", " ")} structure.`,
    score >= 0.55
      ? "The current inputs point toward a credible prototype or hybrid experiment, not a claim of direct quantum advantage."
      : "The current inputs suggest the best next step is more framing and evidence before positioning this as a near-term quantum candidate.",
  ];
}

function buildAssumptions(
  inputs: AssessmentInputs,
  useCase: UseCase,
) {
  const assumptions = [
    `The team can isolate one sub-problem inside ${useCase.title} instead of promising an end-to-end workload rewrite.`,
    "Simulation-first output is acceptable for the first prototype and stakeholder review cycle.",
  ];

  if (inputs.timeline === "now") {
    assumptions.push("A near-term delivery expectation may still favor strong classical baselines over quantum experimentation.");
  } else if (inputs.data_structure === "unstructured") {
    assumptions.push("The data may need substantial classical preprocessing before any quantum kernel becomes credible.");
  } else {
    assumptions.push("The problem can be expressed cleanly enough for a narrow hybrid quantum kernel to be meaningful.");
  }

  return assumptions;
}

function buildSignals(
  story: ReturnType<typeof getStarterStory>,
  useCase: UseCase,
) {
  return [
    `${useCase.title} is being used as the public-facing reference workload for this assessment path.`,
    ...story.assessment.publicSignals.slice(0, 2),
  ];
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

  const timeHorizon = result ? deriveTimeHorizon(result.qals_score) : story.assessment.horizon;
  const confidence = result ? deriveConfidence(result.qals_score) : story.assessment.confidence;
  const explanation = selectedUseCase && inputs && result
    ? buildExplanation(selectedUseCase, story, inputs, result)
    : story.assessment.explanation;
  const assumptions = selectedUseCase && inputs
    ? buildAssumptions(inputs, selectedUseCase)
    : story.assessment.assumptions;
  const publicSignals = selectedUseCase
    ? buildSignals(story, selectedUseCase)
    : story.assessment.publicSignals;

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Idea evaluator
            </span>
            <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#157052]">
              Live QALS-lite
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Deterministic heuristic
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-slate-900">
            Assess credible quantum readiness
          </h1>
          <p className="mt-3 max-w-[760px] text-[1.02rem] leading-8 text-slate-600">
            Use a real seeded industry case, tune the assumptions openly, and let
            the product explain what is prototype-ready versus what still belongs in a longer-term roadmap.
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
                    QALS-lite inputs
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
                  {isPending ? "Scoring..." : "Run QALS-lite"}
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

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Live result
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-[4rem] font-black tracking-[-0.06em] text-[#2f5be3]">
                        {result ? formatPercent(result.qals_score) : story.assessment.score}
                      </div>
                      <div className="pb-3 text-lg font-semibold text-slate-500">/ 100</div>
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-[#eaf7f2] px-4 py-3 text-sm font-semibold text-[#158c61]">
                    {result?.verdict ?? story.assessment.verdict}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Time horizon", timeHorizon],
                    ["Confidence", confidence],
                    ["Primary concept", story.concept],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-[#e2e8f0] bg-[#f8fbff] p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BarChart3 className="h-4 w-4 text-[#2f5be3]" />
                    Why the score landed here
                  </div>
                  <div className="space-y-3">
                    {explanation.map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                        <span className="mt-[7px] h-2 w-2 rounded-full bg-[#2f5be3]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  {result ? (
                    <div className="mt-5 space-y-3">
                      {Object.entries(result.score_breakdown).map(([label, value]) => (
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
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ClipboardList className="h-4 w-4 text-[#2f5be3]" />
                    Missing assumptions
                  </div>
                  <div className="space-y-3">
                    {assumptions.map((item) => (
                      <div key={item} className="rounded-[18px] bg-[#f8fafc] p-4 text-sm leading-6 text-slate-600">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#158c61]" />
                    Similar public signals
                  </div>
                  <div className="space-y-3">
                    {publicSignals.map((item) => (
                      <div key={item} className="rounded-[18px] border border-[#e2e8f0] p-4 text-sm leading-6 text-slate-600">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Recommended next action
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {selectedUseCase
                  ? `Open the ${story.label} lane in Hybrid Lab and keep the selected use case attached so the circuit, architecture map, and exports stay in one narrative.`
                  : story.assessment.nextAction}
              </p>
              <Link
                href={
                  selectedUseCase
                    ? `/build?starter=${story.key}&use_case_id=${selectedUseCase.id}`
                    : `/build?starter=${story.key}`
                }
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)] transition hover:-translate-y-[1px]"
              >
                Open Hybrid Lab
                <ArrowRight className="h-4 w-4" />
              </Link>
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
                  Pick a seeded use case to see the live QALS-lite reasoning.
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

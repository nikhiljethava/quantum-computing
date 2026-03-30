"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList } from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { STARTER_ORDER, getStarterStory, normalizeStarterKey } from "@/lib/studio-mocks";

function AssessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const starter = normalizeStarterKey(
    searchParams.get("starter") ?? searchParams.get("circuit"),
  );
  const story = getStarterStory(starter);

  function selectStarter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("starter", next);
    params.delete("circuit");
    router.replace(`/assess?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Idea evaluator
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Transparent heuristic
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-slate-900">
            Assess credible quantum readiness
          </h1>
          <p className="mt-3 max-w-[760px] text-[1.02rem] leading-8 text-slate-600">
            QALS-lite is meant to explain the recommendation, not to mystify it.
            Use it to show time horizon, confidence, assumptions, and the next best
            action for the selected prototype path.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_320px]">
          <WorkspaceRail
            active="idea-evaluator"
            tip="Use assessment after Learn or Explore so the user understands the problem shape before seeing a score."
          />

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Prototype lanes
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
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      QALS-lite result
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-[4rem] font-black tracking-[-0.06em] text-[#2f5be3]">
                        {story.assessment.score}
                      </div>
                      <div className="pb-3 text-lg font-semibold text-slate-500">/ 100</div>
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-[#eaf7f2] px-4 py-3 text-sm font-semibold text-[#158c61]">
                    {story.assessment.verdict}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Time horizon", story.assessment.horizon],
                    ["Confidence", story.assessment.confidence],
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
                    {story.assessment.explanation.map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                        <span className="mt-[7px] h-2 w-2 rounded-full bg-[#2f5be3]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ClipboardList className="h-4 w-4 text-[#2f5be3]" />
                    Missing assumptions
                  </div>
                  <div className="space-y-3">
                    {story.assessment.assumptions.map((item) => (
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
                    {story.assessment.publicSignals.map((item) => (
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
                {story.assessment.nextAction}
              </p>
              <Link
                href={`/build?starter=${story.key}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)] transition hover:-translate-y-[1px]"
              >
                Open Hybrid Lab
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Guardrails
              </div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <p>Keep simulation-first language visible throughout the scorecard.</p>
                <p>Do not imply direct hardware access unless a feature flag is enabled later.</p>
                <p>Let the product conclude &quot;not yet a fit&quot; when the assumptions are weak.</p>
              </div>
            </div>
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
            <div className="skeleton h-[120px]" />
            <div className="skeleton h-[420px]" />
          </div>
          <div className="space-y-5">
            <div className="skeleton h-[220px]" />
            <div className="skeleton h-[220px]" />
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

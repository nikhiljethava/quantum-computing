"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Download, GitBranch } from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { STARTER_ORDER, getStarterStory, normalizeStarterKey } from "@/lib/studio-mocks";

const NODE_STYLE = {
  primary: { bg: "#e0e7ff", border: "#2f5be3", text: "#1d4ed8" },
  secondary: { bg: "#dcfce7", border: "#1c9d68", text: "#157052" },
  accent: { bg: "#efe2ff", border: "#7c3aed", text: "#6d28d9" },
  warn: { bg: "#ffedd5", border: "#ea580c", text: "#c2410c" },
} as const;

function MapPageContent() {
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
    router.replace(`/map?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Architecture mapper
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Hybrid split
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-slate-900">
            Map the prototype to Google Cloud
          </h1>
          <p className="mt-3 max-w-[760px] text-[1.02rem] leading-8 text-slate-600">
            Show the classical prep, the narrow quantum kernel, the post-processing
            loop, and the export path in one diagram that a cloud architect can read quickly.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_320px]">
          <WorkspaceRail
            active="exports"
            tip="Map after the user sees a circuit so the architecture feels connected to a concrete prototype, not abstract platform marketing."
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

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <GitBranch className="h-4 w-4 text-[#2f5be3]" />
                Simulator-first GCP architecture
              </div>

              <div className="rounded-[28px] border border-[#e2e8f0] bg-[#f8fbff] p-6">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {story.architectureNodes.map((node, index) => {
                    const style = NODE_STYLE[node.tone];
                    return (
                      <div key={node.id} className="flex items-center gap-3">
                        <div
                          className="min-w-[150px] rounded-[22px] border px-4 py-4 text-center shadow-sm"
                          style={{ backgroundColor: style.bg, borderColor: style.border }}
                        >
                          <div className="text-sm font-semibold" style={{ color: style.text }}>
                            {node.label}
                          </div>
                          <div className="mt-2 text-[12px] leading-5 text-slate-500">{node.caption}</div>
                        </div>
                        {index < story.architectureNodes.length - 1 ? (
                          <ArrowRight className="h-5 w-5 text-slate-400" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {story.optionalNode ? (
                  <div className="mt-6 flex justify-center">
                    <div
                      className="rounded-[22px] border px-4 py-4 text-center shadow-sm"
                      style={{
                        backgroundColor: NODE_STYLE[story.optionalNode.tone].bg,
                        borderColor: NODE_STYLE[story.optionalNode.tone].border,
                      }}
                    >
                      <div
                        className="text-sm font-semibold"
                        style={{ color: NODE_STYLE[story.optionalNode.tone].text }}
                      >
                        {story.optionalNode.label}
                      </div>
                      <div className="mt-2 text-[12px] leading-5 text-slate-500">
                        {story.optionalNode.caption}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-600">{story.architectureSummary}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Export bundle
              </div>
              <div className="mt-4 space-y-3">
                {story.exportItems.map((item) => (
                  <div key={item} className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)]"
              >
                <Download className="h-4 w-4" />
                Preview export set
              </button>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Continue editing
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Architecture should feel like a consequence of the prototype, not a detached platform slide.
              </p>
              <Link
                href={`/build?starter=${story.key}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
              >
                Return to Hybrid Lab
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MapPageFallback() {
  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 h-8 w-56 rounded-full bg-slate-200" />
        <div className="mb-4 h-14 max-w-[520px] rounded-[24px] bg-slate-200" />
        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_320px]">
          <div className="skeleton h-[560px]" />
          <div className="space-y-5">
            <div className="skeleton h-[120px]" />
            <div className="skeleton h-[420px]" />
          </div>
          <div className="space-y-5">
            <div className="skeleton h-[260px]" />
            <div className="skeleton h-[220px]" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapPageFallback />}>
      <MapPageContent />
    </Suspense>
  );
}

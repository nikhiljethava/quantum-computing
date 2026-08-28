"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";
import { ResultTrustPanel } from "@/components/trust/ResultTrustPanel";
import type {
  ArticleCompanion,
  InteractionModel,
  PlatformLayer,
  SeriesArticle,
} from "@/content/series";
import { trackProductEvent } from "@/lib/analytics";
import type { EvidenceCategory, ResultTrust } from "@/types/api";

const EXECUTION_STYLE = {
  classical: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  "simulated quantum": "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
  "optional approved hardware": "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
  "future only": "border-slate-300 bg-slate-100 text-slate-600",
} as const;

function evidenceCategory(resultType: ResultTrust["result_type"]): EvidenceCategory {
  if (resultType === "Tutorial") return "tutorial";
  if (resultType === "Simulation") return "toy simulation";
  if (resultType === "Hardware Measured") return "measured hardware result";
  if (resultType === "Vendor Reported") return "vendor-reported claim";
  if (resultType === "Independently Reproduced") return "independently reproduced result";
  return "estimate";
}

function companionTrust(article: SeriesArticle, companion: ArticleCompanion): ResultTrust {
  const evidence = companion.evidenceRecords[0];
  const resultType = evidence?.resultType ?? "Unknown";
  return {
    result_type: resultType,
    evidence_category: evidenceCategory(resultType),
    backend: "static interactive companion",
    hardware_or_simulator_name: null,
    execution_status: "explanation and architecture estimate",
    estimate_level: "conceptual architecture",
    hardware_horizon: "simulator now; approved hardware optional; fault-tolerant work later",
    qubit_count: null,
    circuit_depth: null,
    one_qubit_gate_count: null,
    two_qubit_gate_count: null,
    shots: null,
    result_distribution: [],
    ideal_or_noisy: null,
    noise_model_description: null,
    classical_baseline_status: "required before a serious Contract-mode experiment",
    contract_validity_status: "TUTORIAL_ONLY",
    readiness_verdict: "EDUCATION_ONLY",
    confidence: "MEDIUM",
    time_horizon: "SIMULATOR_NOW",
    trust_labels: ["TUTORIAL", "HARDWARE_GATED"],
    assumptions: ["The companion describes a reference workflow, not a workload-specific implementation."],
    missing_evidence: ["workload-specific classical baseline", "validated Algorithm Contract"],
    caveats: [
      "The guided example is a toy simulation and is not evidence of quantum advantage.",
      "Optional hardware execution remains access-controlled.",
      "This trust summary is not QCVV or hardware characterization.",
    ],
    provenance: [`Series article ${article.sequence}`, evidence?.title ?? "Quantum Foundry companion"],
    generated_at: evidence?.lastVerifiedAt ?? null,
    software_or_model_version: "Quantum Foundry article companion v1",
    source_type: evidence?.sourceType ?? "UNKNOWN",
    source_organization: evidence?.organization ?? null,
    source_link: evidence?.url ?? null,
    publication_date: evidence?.publishedAt ?? null,
    last_verified_date: evidence?.lastVerifiedAt ?? null,
    claim_status: evidence?.notes ?? "Educational explanation",
  };
}

function PlatformArchitecture({ article, layers }: { article: SeriesArticle; layers: PlatformLayer[] }) {
  const [selectedId, setSelectedId] = useState(layers[0]?.id ?? "");
  const [detailLevel, setDetailLevel] = useState<"simple" | "deeper">("simple");
  const selected = layers.find((layer) => layer.id === selectedId) ?? layers[0];

  function selectLayer(layer: PlatformLayer) {
    setSelectedId(layer.id);
    void trackProductEvent("companion_layer_opened", `${article.id}-${layer.id}`);
  }

  if (!selected) return null;

  return (
    <section className="border-y border-slate-200 bg-white py-12" aria-labelledby="platform-architecture-title">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase text-[#2563eb]">Interactive platform architecture</div>
            <h2 id="platform-architecture-title" className="mt-2 text-3xl font-black text-slate-950">
              Follow the decision, not only the circuit
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Select each layer to see what it contributes and how mature the supporting evidence is.
            </p>
          </div>
          <div className="inline-flex w-fit border border-slate-300 bg-white p-1" aria-label="Explanation depth">
            {(["simple", "deeper"] as const).map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={detailLevel === level}
                onClick={() => setDetailLevel(level)}
                className={`px-4 py-2 text-sm font-bold capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
                  detailLevel === level ? "bg-[#2563eb] text-white" : "text-slate-600"
                }`}
              >
                {level === "deeper" ? "One level deeper" : "Simple view"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <ol className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-3" aria-label="Quantum platform layers">
            {layers.map((layer, index) => (
              <li key={layer.id} className="bg-white">
                <button
                  type="button"
                  aria-pressed={selected.id === layer.id}
                  onClick={() => selectLayer(layer)}
                  className={`h-full min-h-[142px] w-full p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#2563eb] ${
                    selected.id === layer.id ? "bg-[#eff6ff]" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-black text-[#2563eb]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-3 block text-base font-black text-slate-950">{layer.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">{layer.whatItDoes}</span>
                </button>
              </li>
            ))}
          </ol>

          <aside className="border border-slate-200 bg-[#fbfdff] p-6" aria-live="polite">
            <div className="text-xs font-bold uppercase text-[#2563eb]">Selected layer</div>
            <h3 className="mt-2 text-2xl font-black text-slate-950">{selected.label}</h3>
            <div className="mt-5 grid gap-5 text-sm leading-7 text-slate-600">
              <div>
                <div className="font-black text-slate-950">Why it matters</div>
                <p className="mt-1">{selected.whyItMatters}</p>
              </div>
              <div>
                <div className="font-black text-slate-950">Simple example</div>
                <p className="mt-1">{selected.example}</p>
              </div>
              {detailLevel === "deeper" ? (
                <>
                  <div>
                    <div className="font-black text-slate-950">What exists today</div>
                    <p className="mt-1">{selected.existsToday}</p>
                  </div>
                  <div>
                    <div className="font-black text-slate-950">What remains developing</div>
                    <p className="mt-1">{selected.stillDeveloping}</p>
                  </div>
                </>
              ) : null}
              <div className="border-l-2 border-[#34d399] pl-3">
                <div className="font-black text-slate-950">Evidence status</div>
                <p className="mt-1">{selected.evidenceStatus}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function HybridWorkflow({ article, companion }: { article: SeriesArticle; companion: ArticleCompanion }) {
  const interactiveModule = companion.interactiveModule;
  const models = interactiveModule.kind === "HYBRID_WORKFLOW" ? interactiveModule.interactionModels : [];
  const steps = interactiveModule.kind === "HYBRID_WORKFLOW" ? interactiveModule.steps : [];
  const [selectedModelId, setSelectedModelId] = useState<InteractionModel["id"]>(models[0]?.id ?? "batch");
  const selectedModel = models.find((model) => model.id === selectedModelId) ?? models[0];

  function selectModel(model: InteractionModel) {
    setSelectedModelId(model.id);
    void trackProductEvent("companion_layer_opened", `${article.id}-${model.id}`);
  }

  if (!selectedModel) return null;

  return (
    <section className="border-y border-slate-200 bg-white py-12" aria-labelledby="hybrid-workflow-title">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase text-[#0f766e]">Interactive hybrid workflow</div>
          <h2 id="hybrid-workflow-title" className="mt-2 text-3xl font-black text-slate-950">
            Compare four interaction models
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            The quantum step changes role as latency, feedback, error management, and hardware maturity change.
          </p>
        </div>

        <ol className="mt-8 grid gap-3 lg:grid-cols-5" aria-label="Hybrid execution stages">
          {steps.map((step, index) => (
            <li key={step.id} className="flex min-w-0 items-stretch gap-3 lg:block">
              <div className={`min-h-[164px] flex-1 border p-4 ${EXECUTION_STYLE[step.executionKind]}`}>
                <div className="text-xs font-black uppercase">{step.executionKind}</div>
                <div className="mt-3 text-base font-black text-slate-950">{step.label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
              {index < steps.length - 1 ? <ArrowRight className="mt-16 h-5 w-5 shrink-0 text-slate-400 lg:hidden" /> : null}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="grid gap-2" role="group" aria-label="Hybrid interaction models">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                aria-pressed={selectedModel.id === model.id}
                onClick={() => selectModel(model)}
                className={`border px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
                  selectedModel.id === model.id
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-black">{model.label}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{model.summary}</span>
              </button>
            ))}
          </div>

          <div className="border border-slate-200 bg-[#fbfdff] p-6" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-black text-slate-950">{selectedModel.label}</h3>
              <span className="border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-2 text-xs font-black text-[#6d28d9]">
                {selectedModel.trustLabel.replaceAll("_", " ")}
              </span>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <div className="text-xs font-black uppercase text-slate-400">Prepared example</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">{selectedModel.example}</p>
              </div>
              <div>
                <div className="text-xs font-black uppercase text-slate-400">Maturity</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">{selectedModel.maturity}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SeriesCompanionExperience({
  article,
  companion,
  nextArticle,
}: {
  article: SeriesArticle;
  companion: ArticleCompanion;
  nextArticle: SeriesArticle | null;
}) {
  const trust = useMemo(() => companionTrust(article, companion), [article, companion]);
  const assessmentParams = new URLSearchParams({
    level: "quick",
    source: companion.relatedAssessmentDefaults.source,
    problemClass: companion.relatedAssessmentDefaults.problemClass,
    goal: companion.relatedAssessmentDefaults.goal,
  });
  const guidedExampleParams = new URLSearchParams({
    mode: "tutorial",
    starter: companion.guidedExampleId,
    source: companion.relatedAssessmentDefaults.source,
  });
  const guidedExampleHref = `/build?${guidedExampleParams.toString()}`;

  return (
    <div className="bg-[#f7f9fc] text-slate-950">
      <AnalyticsEvent event="article_companion_viewed" context={article.id} />

      <header className="border-b border-slate-800 bg-[#070b16] px-4 py-14 text-white md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Series breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/series" className="font-bold text-[#93c5fd] hover:text-white">Beyond the Quantum Processor</Link>
            <span aria-hidden="true">/</span>
            <span>Article {article.sequence}</span>
          </nav>
          <div className="mt-8 max-w-5xl">
            <div className="text-xs font-black uppercase text-[#6ee7b7]">Interactive companion</div>
            <h1 className="mt-4 text-[clamp(2.7rem,7vw,5.7rem)] font-black leading-[0.98]">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-200">{article.subtitle}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={guidedExampleHref}
              onClick={() => void trackProductEvent("guided_example_started", article.id)}
              className="inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <FlaskConical className="h-4 w-4" />
              Try the guided example
            </Link>
            <Link
              href={`/assess?${assessmentParams.toString()}`}
              className="inline-flex items-center gap-2 border border-slate-500 px-5 py-3 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Start Quick Assessment
              <ArrowRight className="h-4 w-4" />
            </Link>
            {article.canonicalArticleUrl ? (
              <a
                href={article.canonicalArticleUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => void trackProductEvent("return_to_article_clicked", article.id)}
                className="inline-flex items-center gap-2 px-3 py-3 text-sm font-black text-slate-300 underline decoration-slate-500 underline-offset-4 hover:text-white"
              >
                Read the full article
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
          <p className="mt-8 max-w-3xl border-l-2 border-[#34d399] pl-4 text-sm leading-7 text-slate-300">
            Independent personal project. Not an official Google product. Simulator-first. No public quantum-hardware access.
          </p>
        </div>
      </header>

      <div>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2563eb]">
              <BookOpen className="h-4 w-4" /> One-minute summary
            </div>
            <h2 className="mt-3 text-3xl font-black text-slate-950">The idea in plain English</h2>
          </div>
          <div className="grid gap-5">
            <p className="text-lg leading-9 text-slate-700">{companion.simpleExplanation}</p>
            <details className="border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-black text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]">
                One level deeper
              </summary>
              <p className="mt-4 text-sm leading-8 text-slate-600">{companion.technicalExplanation}</p>
            </details>
          </div>
        </section>

        {companion.interactiveModule.kind === "PLATFORM_ARCHITECTURE" ? (
          <PlatformArchitecture article={article} layers={companion.interactiveModule.layers} />
        ) : (
          <HybridWorkflow article={article} companion={companion} />
        )}

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6" aria-labelledby="guided-sample-title">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7c3aed]">
                <FlaskConical className="h-4 w-4" /> Guided sample
              </div>
              <h2 id="guided-sample-title" className="mt-3 text-3xl font-black text-slate-950">
                See one small workflow run end to end
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                The prepared example opens in Tutorial mode. It cannot satisfy a real Algorithm Contract or export a business recommendation.
              </p>
              <Link
                href={guidedExampleHref}
                onClick={() => void trackProductEvent("guided_example_started", `${article.id}-${companion.guidedExampleId}`)}
                className="mt-6 inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-black text-white"
              >
                Open tutorial / toy simulation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ResultTrustPanel trust={trust} title="Companion Trust Check" />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-12" aria-labelledby="evidence-title">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0f766e]">
                  <ShieldCheck className="h-4 w-4" /> Evidence
                </div>
                <h2 id="evidence-title" className="mt-3 text-3xl font-black text-slate-950">What supports this companion</h2>
                <div className="mt-6 grid gap-3">
                  {companion.evidenceRecords.map((record) => (
                    <article key={record.id} className="border border-slate-200 bg-[#fbfdff] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-black uppercase text-[#2563eb]">{record.sourceType.replaceAll("_", " ")}</div>
                        <div className="text-xs font-bold text-slate-500">{record.resultType}</div>
                      </div>
                      <h3 className="mt-2 text-base font-black text-slate-950">{record.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{record.claimSupported}</p>
                      <div className="mt-3 text-xs leading-6 text-slate-500">{record.organization} | verified {record.lastVerifiedAt}</div>
                      {record.url ? (
                        <a href={record.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#2563eb]">
                          Open configured source <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7c3aed]">
                  <CircleDot className="h-4 w-4" /> Glossary
                </div>
                <h2 className="mt-3 text-3xl font-black text-slate-950">Words worth making explicit</h2>
                <dl className="mt-6 grid gap-px border border-slate-200 bg-slate-200">
                  {companion.glossary.map((item) => (
                    <div key={item.term} className="bg-white p-5">
                      <dt className="font-black text-slate-950">{item.term}</dt>
                      <dd className="mt-2 text-sm leading-7 text-slate-600">{item.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="grid gap-6 border border-slate-200 bg-[#070b16] p-7 text-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#6ee7b7]">
                <CheckCircle2 className="h-4 w-4" /> Continue the journey
              </div>
              <h2 className="mt-3 text-3xl font-black">Turn the idea into an honest next decision</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Quick Assessment identifies the likely contract shape and missing evidence. Only the full QALS 3.0 Algorithm Contract can unlock serious Build output.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href={`/assess?${assessmentParams.toString()}`} className="inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-black text-white">
                Start Quick Assessment <ArrowRight className="h-4 w-4" />
              </Link>
              {nextArticle ? (
                <Link href={`/series/${nextArticle.slug}`} className="inline-flex items-center gap-2 border border-slate-500 px-5 py-3 text-sm font-black text-white">
                  Article {nextArticle.sequence}: {nextArticle.title} <GitBranch className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/series" className="inline-flex items-center gap-2 border border-slate-500 px-5 py-3 text-sm font-black text-white">
                  Back to the series <Layers3 className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

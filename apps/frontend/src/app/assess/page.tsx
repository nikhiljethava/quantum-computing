"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  Download,
  FileText,
  FlaskConical,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { getArtifactDownloadUrl } from "@/lib/api";
import {
  useCreateAssessment,
  useCreateExperimentBundle,
  useExportAssessmentMemo,
  useUseCases,
} from "@/lib/hooks";
import {
  Assessment,
  AssessmentInputs,
  ProblemClass,
  TrustLabel,
  UseCase,
} from "@/types/api";

const PROBLEM_CLASSES: Array<{ value: ProblemClass; label: string; hint: string }> = [
  { value: "QUANTUM_SIMULATION", label: "Battery / materials simulation", hint: "Chemistry, materials, batteries, catalysts, molecular simulation" },
  { value: "OPTIMIZATION", label: "Logistics / optimization", hint: "Routing, scheduling, portfolio, supply chain, resource allocation" },
  { value: "CRYPTO_SECURITY", label: "Crypto / PQC readiness", hint: "RSA, ECC, DH, ECDSA, long-lived secrets, regulated data" },
  { value: "SEARCH", label: "Search", hint: "Grover-like search with explicit oracle and data-loading caveats" },
  { value: "LINEAR_SYSTEMS", label: "Linear systems", hint: "HHL-shaped ideas, CFD, matrices, input/output constraints" },
  { value: "QUANTUM_ML", label: "Quantum ML", hint: "Kernel or model experiments benchmarked against classical ML" },
  { value: "UNKNOWN", label: "Unknown", hint: "Use this when the problem shape still needs triage" },
];

const INDUSTRIES = ["energy", "materials", "logistics", "finance", "pharma", "aerospace", "security", "other"];

const TRUST_LABEL_TEXT: Record<TrustLabel, string> = {
  TUTORIAL: "Tutorial",
  TOY_SIMULATION: "Toy simulation",
  BENCHMARK_CANDIDATE: "Benchmark candidate",
  RESEARCH_CANDIDATE: "Research candidate",
  HARDWARE_GATED: "Hardware-gated",
  FTQC_LATER: "FTQC-later",
  ACTION_NOW: "Action-now",
};

function inferProblemClass(useCase: UseCase | null): ProblemClass {
  const text = `${useCase?.title ?? ""} ${useCase?.industry ?? ""} ${useCase?.description ?? ""}`.toLowerCase();
  if (text.includes("battery") || text.includes("material") || text.includes("molecular") || text.includes("catalyst") || text.includes("drug")) {
    return "QUANTUM_SIMULATION";
  }
  if (text.includes("routing") || text.includes("scheduling") || text.includes("portfolio") || text.includes("supply chain")) {
    return "OPTIMIZATION";
  }
  return "UNKNOWN";
}

function defaultInputs(useCase: UseCase | null): AssessmentInputs {
  const problemClass = inferProblemClass(useCase);
  const baseline =
    problemClass === "QUANTUM_SIMULATION"
      ? "DFT / classical HPC workflow"
      : problemClass === "OPTIMIZATION"
        ? "OR-Tools or MILP solver"
        : "";
  return {
    industry: useCase?.industry ?? "energy",
    objective: useCase?.blueprint.business_kpi ?? "",
    problemClass,
    problemDescription: useCase?.description ?? "",
    businessValue: useCase?.blueprint.business_kpi ?? "",
    dataType: problemClass === "QUANTUM_SIMULATION" ? "molecular/material fragment" : "structured benchmark instance",
    problemSize: useCase?.blueprint.sample_input ?? "",
    constraints: "",
    accuracyNeeds: "",
    latencyTolerance: useCase?.horizon === "near-term" ? "simulator-now planning cycle" : "hardware-gated research horizon",
    currentClassicalBaseline: baseline,
    baselineMetrics: "",
    currentSolverOrWorkflow: baseline,
    knownAlgorithmsConsidered: problemClass === "OPTIMIZATION" ? "QAOA toy benchmark" : "VQE / molecule-fragment starter",
    evidenceLinks: [],
    userFilesOrNotes: "",
    securityCryptoInventory: {},
  };
}

function starterForAssessment(assessment: Assessment | null) {
  if (!assessment) return "routing";
  if (assessment.problem_class === "QUANTUM_SIMULATION") return "chemistry";
  if (assessment.problem_class === "OPTIMIZATION") return "routing";
  if (assessment.problem_class === "SEARCH") return "grover";
  return "coin_flip";
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const className = "mt-2 w-full rounded-[18px] border border-[#d8e2f3] bg-[#f8fbff] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f5be3]";
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-400">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

function TrustLabels({ labels }: { labels: TrustLabel[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase text-[#2f5be3]"
        >
          {TRUST_LABEL_TEXT[label] ?? label}
        </span>
      ))}
    </div>
  );
}

function EvidenceList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
      <div className="text-xs font-semibold uppercase text-slate-400">{title}</div>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))
        ) : (
          <div className="text-sm leading-6 text-slate-500">{empty}</div>
        )}
      </div>
    </div>
  );
}

function AssessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUseCaseId = searchParams.get("use_case_id");
  const { data: useCaseList, isLoading } = useUseCases({ limit: 12 });
  const selectedUseCase = useMemo(() => {
    const items = useCaseList?.items ?? [];
    return items.find((item) => item.id === selectedUseCaseId) ?? items[0] ?? null;
  }, [selectedUseCaseId, useCaseList?.items]);

  const [inputs, setInputs] = useState<AssessmentInputs>(() => defaultInputs(null));
  const [activeUseCaseId, setActiveUseCaseId] = useState<string | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [bundleId, setBundleId] = useState<string | null>(null);
  const createAssessment = useCreateAssessment();
  const createBundle = useCreateExperimentBundle();
  const exportMemo = useExportAssessmentMemo();

  useEffect(() => {
    if (!selectedUseCase || selectedUseCase.id === activeUseCaseId || result) return;
    setActiveUseCaseId(selectedUseCase.id);
    setInputs(defaultInputs(selectedUseCase));
  }, [activeUseCaseId, result, selectedUseCase]);

  function updateInput<K extends keyof AssessmentInputs>(key: K, value: AssessmentInputs[K]) {
    setInputs((current) => ({ ...current, [key]: value }));
    setPageError(null);
  }

  function updateCryptoInventory(key: string, value: string) {
    setInputs((current) => ({
      ...current,
      securityCryptoInventory: {
        ...(current.securityCryptoInventory ?? {}),
        [key]: value,
      },
    }));
  }

  function selectUseCase(useCase: UseCase) {
    setActiveUseCaseId(useCase.id);
    setInputs(defaultInputs(useCase));
    setResult(null);
    setBundleId(null);
    router.replace(`/assess?use_case_id=${useCase.id}`, { scroll: false });
  }

  async function runAssessment() {
    if (!selectedUseCase) return;
    try {
      setPageError(null);
      setBundleId(null);
      const assessment = await createAssessment.mutateAsync({
        use_case_id: selectedUseCase.id,
        user_inputs: inputs,
      });
      setResult(assessment);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The readiness assessment failed.");
    }
  }

  async function createExperimentBundle() {
    if (!result) return;
    try {
      setPageError(null);
      const bundle = await createBundle.mutateAsync({
        assessmentId: result.id,
        body: { queue_simulation: true },
      });
      setBundleId(bundle.id);
      router.push(`/build?assessment_id=${result.id}&bundle_id=${bundle.id}&starter=${starterForAssessment(result)}`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The experiment bundle could not be created.");
    }
  }

  async function downloadMemo() {
    if (!result) return;
    try {
      setPageError(null);
      const memo = await exportMemo.mutateAsync(result.id);
      const link = document.createElement("a");
      link.href = getArtifactDownloadUrl(memo.artifact.id);
      link.download = memo.artifact.filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The opportunity memo could not be exported.");
    }
  }

  const isCrypto = inputs.problemClass === "CRYPTO_SECURITY";
  const canCreateBundle = result?.build_eligibility === "ELIGIBLE";

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase text-[#2f5be3]">
              Readiness assessment
            </span>
            <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase text-[#157052]">
              Evidence-backed verdict
            </span>
            <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-semibold uppercase text-[#c2410c]">
              Classical baseline required
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black text-slate-900">
            Assess a quantum opportunity before you build
          </h1>
          <p className="mt-3 max-w-[820px] text-[1.02rem] leading-8 text-slate-600">
            QALS 2.0 produces a verdict, confidence, time horizon, trust labels, evidence, missing evidence,
            assumptions, caveats, and the next decision. The score is intentionally secondary.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_340px]">
          <WorkspaceRail
            active="idea-evaluator"
            tip="Assess is the spine: Learn explains the inputs, Explore helps choose the problem shape, Build waits for the verdict."
          />

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Problem shape</div>
                  <h2 className="mt-1 text-[1.15rem] font-semibold text-slate-900">Choose the opportunity lane</h2>
                </div>
                <ShieldCheck className="h-5 w-5 text-[#2f5be3]" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {PROBLEM_CLASSES.map((item) => {
                  const selected = inputs.problemClass === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => updateInput("problemClass", item.value)}
                      className={`rounded-[22px] border px-4 py-4 text-left transition ${
                        selected
                          ? "border-[#2f5be3] bg-[#eef2ff]"
                          : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#c7d7f4]"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                      <div className="mt-2 text-xs leading-5 text-slate-500">{item.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 text-xs font-semibold uppercase text-slate-400">Guided intake</div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-slate-400">Industry</span>
                  <select
                    value={inputs.industry ?? ""}
                    onChange={(event) => updateInput("industry", event.target.value)}
                    className="mt-2 w-full rounded-[18px] border border-[#d8e2f3] bg-[#f8fbff] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f5be3]"
                  >
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </label>
                <InputField label="Objective" value={inputs.objective ?? ""} onChange={(value) => updateInput("objective", value)} placeholder="What decision should this support?" />
                <InputField label="Business value" value={inputs.businessValue ?? ""} onChange={(value) => updateInput("businessValue", value)} placeholder="What matters to the business owner?" />
                <InputField label="Data shape / problem size" value={inputs.problemSize ?? ""} onChange={(value) => updateInput("problemSize", value)} placeholder="Stops, molecules, variables, rows, constraints..." />
                <InputField label="Current classical baseline" value={inputs.currentClassicalBaseline ?? ""} onChange={(value) => updateInput("currentClassicalBaseline", value)} placeholder="OR-Tools, MILP, DFT, HPC, current internal solver..." />
                <InputField label="Baseline metrics" value={inputs.baselineMetrics ?? ""} onChange={(value) => updateInput("baselineMetrics", value)} placeholder="Runtime, quality gap, accuracy, cost, throughput..." />
                <InputField label="Constraints" value={inputs.constraints ?? ""} onChange={(value) => updateInput("constraints", value)} placeholder="Capacity, time windows, active-space limits, compliance..." />
                <InputField label="Accuracy / latency needs" value={`${inputs.accuracyNeeds ?? ""}${inputs.latencyTolerance ? `; ${inputs.latencyTolerance}` : ""}`} onChange={(value) => updateInput("accuracyNeeds", value)} placeholder="Accuracy tolerance and decision window" />
                <InputField label="Problem description" value={inputs.problemDescription ?? ""} onChange={(value) => updateInput("problemDescription", value)} textarea />
                <InputField label="Evidence links or notes" value={inputs.userFilesOrNotes ?? ""} onChange={(value) => updateInput("userFilesOrNotes", value)} textarea placeholder="Papers, internal notes, dataset names, assumptions..." />
              </div>

              {isCrypto ? (
                <div className="mt-5 rounded-[24px] border border-[#d8e2f3] bg-[#f8fbff] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-[#157052]" />
                    Crypto/security intake
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="RSA / ECC / DH / ECDSA usage" value={String(inputs.securityCryptoInventory?.algorithms ?? "")} onChange={(value) => updateCryptoInventory("algorithms", value)} />
                    <InputField label="Certificate lifetime" value={String(inputs.securityCryptoInventory?.certificate_lifetime ?? "")} onChange={(value) => updateCryptoInventory("certificate_lifetime", value)} />
                    <InputField label="Data retention sensitivity" value={String(inputs.securityCryptoInventory?.retention_sensitivity ?? "")} onChange={(value) => updateCryptoInventory("retention_sensitivity", value)} />
                    <InputField label="Systems needing inventory" value={String(inputs.securityCryptoInventory?.systems ?? "")} onChange={(value) => updateCryptoInventory("systems", value)} />
                    <InputField label="Migration owner / status" value={String(inputs.securityCryptoInventory?.migration_owner_status ?? "")} onChange={(value) => updateCryptoInventory("migration_owner_status", value)} />
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void runAssessment()}
                disabled={!selectedUseCase || createAssessment.isPending}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createAssessment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                {createAssessment.isPending ? "Running assessment..." : "Generate evidence-backed verdict"}
              </button>
            </div>

            {result ? (
              <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-[760px]">
                    <div className="text-xs font-semibold uppercase text-slate-400">Verdict</div>
                    <h2 className="mt-2 text-[clamp(2rem,4vw,3.2rem)] font-black text-slate-900">
                      {result.verdict.replaceAll("_", " ")}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="rounded-full bg-[#dcfce7] px-3 py-2 text-xs font-semibold uppercase text-[#157052]">
                        Confidence: {result.confidence}
                      </span>
                      <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold uppercase text-[#2f5be3]">
                        Time horizon: {result.time_horizon.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-5 text-base leading-8 text-slate-700">
                      {result.plain_english_recommendation}
                    </p>
                    <div className="mt-5">
                      <TrustLabels labels={result.trust_labels} />
                    </div>
                  </div>
                  <div className="min-w-[180px] rounded-[24px] border border-[#e2e8f0] bg-[#f8fbff] p-5 text-center">
                    <div className="text-xs font-semibold uppercase text-slate-400">Readiness score</div>
                    <div className="mt-2 text-5xl font-black text-[#2f5be3]">{result.readiness_score}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">Secondary to verdict and evidence</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <EvidenceList title="Classical baseline" items={[result.classical_baseline_summary]} empty="Classical baseline required." />
                  <EvidenceList title="Quantum candidate" items={[result.quantum_candidate_summary]} empty="No candidate recommended." />
                  <EvidenceList title="Evidence used" items={result.evidence_used} empty="No evidence attached yet." />
                  <EvidenceList title="Missing evidence" items={result.missing_evidence} empty="No missing evidence recorded." />
                  <EvidenceList title="Assumptions" items={result.assumptions} empty="No assumptions recorded." />
                  <EvidenceList title="Caveats" items={result.caveats} empty="No caveats recorded." />
                </div>

                <div className="mt-5 rounded-[22px] border border-[#d8e2f3] bg-[#f8fbff] p-5">
                  <div className="text-xs font-semibold uppercase text-slate-400">Next best action</div>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{result.next_best_action}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {canCreateBundle ? (
                      <button
                        type="button"
                        onClick={() => void createExperimentBundle()}
                        disabled={createBundle.isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.25)] transition hover:-translate-y-[1px]"
                      >
                        {createBundle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                        Create experiment bundle
                      </button>
                    ) : (
                      <span className="rounded-full bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#c2410c]">
                        Build eligibility: {result.build_eligibility.replaceAll("_", " ")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void downloadMemo()}
                      disabled={exportMemo.isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
                    >
                      {exportMemo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Export opportunity memo
                    </button>
                  </div>
                  {bundleId ? (
                    <Link
                      href={`/build?assessment_id=${result.id}&bundle_id=${bundleId}&starter=${starterForAssessment(result)}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2f5be3]"
                    >
                      Open bundle in Build
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-[#2f5be3]" />
                Explore examples
              </div>
              {isLoading ? (
                <div className="skeleton h-[240px]" />
              ) : (
                <div className="space-y-3">
                  {(useCaseList?.items ?? []).slice(0, 6).map((useCase) => (
                    <button
                      key={useCase.id}
                      type="button"
                      onClick={() => selectUseCase(useCase)}
                      className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                        useCase.id === selectedUseCase?.id
                          ? "border-[#2f5be3] bg-[#eef2ff]"
                          : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#c7d7f4]"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{useCase.title}</div>
                      <div className="mt-1 text-xs capitalize text-slate-500">{useCase.industry}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="text-xs font-semibold uppercase text-slate-400">Guardrails</div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <p>No serious quantum build artifact is generated without a hypothesis, classical baseline, time horizon, evidence or assumptions, and trust label.</p>
                <p>Logistics recommendations are benchmark-first, and production advantage unproven is always explicit.</p>
                <p>Crypto/security defaults to PQC migration-now, not QKD or quantum hardware.</p>
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

function AssessFallback() {
  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.18)]">
        <div className="skeleton h-[680px]" />
      </section>
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<AssessFallback />}>
      <AssessPageContent />
    </Suspense>
  );
}

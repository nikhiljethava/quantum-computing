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
  useCreateAlgorithmContract,
  useCreateAssessment,
  useCreateContractExperimentBundle,
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
  OVERCOMPILED_DEMO: "Overcompiled demo",
  MEANINGFUL_SMALL_INSTANCE: "Meaningful small instance",
  BENCHMARK_CANDIDATE: "Benchmark candidate",
  RESEARCH_CANDIDATE: "Research candidate",
  HARDWARE_GATED: "Hardware-gated",
  FTQC_LATER: "FTQC-later",
  ACTION_NOW: "Action-now",
  ORACLE_DEPENDENT: "Oracle-dependent",
  HAMILTONIAN_DEPENDENT: "Hamiltonian-dependent",
  CONVERGENCE_UNCERTAIN: "Convergence uncertain",
  BASELINE_REQUIRED: "Baseline required",
  INSUFFICIENT_CONTRACT: "Insufficient contract",
};

function inferProblemClass(useCase: UseCase | null): ProblemClass {
  const text = `${useCase?.title ?? ""} ${useCase?.industry ?? ""} ${useCase?.description ?? ""}`.toLowerCase();
  if (text.includes("battery") || text.includes("material") || text.includes("molecular") || text.includes("catalyst") || text.includes("drug")) {
    return "QUANTUM_SIMULATION";
  }
  if (text.includes("routing") || text.includes("scheduling") || text.includes("portfolio") || text.includes("supply chain")) {
    return "OPTIMIZATION";
  }
  if (text.includes("crypto") || text.includes("pqc") || text.includes("rsa") || text.includes("ecc")) {
    return "CRYPTO_SECURITY";
  }
  if (text.includes("grover") || text.includes("oracle") || text.includes("search")) {
    return "SEARCH";
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
    moleculeOrMaterialFragment: "",
    hamiltonianPath: "",
    observable: "",
    ansatz: "",
    optimizer: "",
    variables: "",
    quboConstraints: "",
    quboObjective: "",
    penaltyTerms: "",
    predicateDefinition: "",
    inputSizeN: "",
    markedItemCountM: "",
    dataLoadingAssumption: "",
    functionDescription: "",
    assumesRealHardware: false,
    tutorialSampleSelected: false,
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
  const [contractId, setContractId] = useState<string | null>(null);
  const createAssessment = useCreateAssessment();
  const createContract = useCreateAlgorithmContract();
  const createBundle = useCreateContractExperimentBundle();
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
    setContractId(null);
    router.replace(`/assess?use_case_id=${useCase.id}`, { scroll: false });
  }

  async function runAssessment() {
    if (!selectedUseCase) return;
    try {
      setPageError(null);
      setBundleId(null);
      setContractId(null);
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
      const contract = await createContract.mutateAsync(result.id);
      setContractId(contract.id);
      const bundle = await createBundle.mutateAsync({ contractId: contract.id, body: { queue_simulation: true } });
      setBundleId(bundle.id);
      router.push(
        `/build?assessment_id=${result.id}&contract_id=${contract.id}&bundle_id=${bundle.id}&starter=${starterForAssessment(result)}`,
      );
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The Algorithm Experiment Bundle could not be created.");
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
      setPageError(error instanceof Error ? error.message : "The Algorithm Brief could not be exported.");
    }
  }

  const isCrypto = inputs.problemClass === "CRYPTO_SECURITY";
  const isQuantumSimulation = inputs.problemClass === "QUANTUM_SIMULATION";
  const isOptimization = inputs.problemClass === "OPTIMIZATION";
  const isSearch = inputs.problemClass === "SEARCH";
  const canCreateBundle =
    result?.build_eligibility === "ELIGIBLE_FOR_TOY_EXPERIMENT" ||
    result?.build_eligibility === "ELIGIBLE_FOR_BENCHMARK" ||
    result?.build_eligibility === "ELIGIBLE_FOR_RESEARCH_PROTOTYPE" ||
    result?.build_eligibility === "NON_COMPUTE_ACTION_ONLY";
  const buildIsBusy = createContract.isPending || createBundle.isPending;

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
            QALS 3.0 turns the intake into an Algorithm Contract: problem statement, mathematical reduction,
            classical baseline, algorithm family, trust labels, missing inputs, and a simulator-first next decision.
            The score is intentionally secondary.
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

              {isQuantumSimulation ? (
                <div className="mt-5 rounded-[24px] border border-[#d8e2f3] bg-[#f8fbff] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FlaskConical className="h-4 w-4 text-[#2f5be3]" />
                    Hamiltonian / VQE contract inputs
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Molecule or material fragment" value={inputs.moleculeOrMaterialFragment ?? ""} onChange={(value) => updateInput("moleculeOrMaterialFragment", value)} placeholder="Li-ion electrolyte fragment, catalyst active site..." />
                    <InputField label="Hamiltonian path" value={inputs.hamiltonianPath ?? ""} onChange={(value) => updateInput("hamiltonianPath", value)} placeholder="OpenFermion transform, active-space plan, imported Hamiltonian..." />
                    <InputField label="Observable" value={inputs.observable ?? ""} onChange={(value) => updateInput("observable", value)} placeholder="Ground-state energy, band gap proxy, reaction energy..." />
                    <InputField label="Ansatz" value={inputs.ansatz ?? ""} onChange={(value) => updateInput("ansatz", value)} placeholder="UCCSD, hardware-efficient, problem-inspired..." />
                    <InputField label="Optimizer" value={inputs.optimizer ?? ""} onChange={(value) => updateInput("optimizer", value)} placeholder="COBYLA, SPSA, L-BFGS, fixed grid..." />
                    <InputField label="Hardware assumption" value={inputs.assumesRealHardware ? "yes" : ""} onChange={(value) => updateInput("assumesRealHardware", value.trim().toLowerCase() === "yes")} placeholder="yes only when hardware access is assumed" />
                  </div>
                </div>
              ) : null}

              {isOptimization ? (
                <div className="mt-5 rounded-[24px] border border-[#d8e2f3] bg-[#f8fbff] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ClipboardCheck className="h-4 w-4 text-[#2f5be3]" />
                    QUBO / QAOA contract inputs
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Variables" value={inputs.variables ?? ""} onChange={(value) => updateInput("variables", value)} placeholder="Binary route/staffing/portfolio variables" />
                    <InputField label="QUBO objective" value={inputs.quboObjective ?? ""} onChange={(value) => updateInput("quboObjective", value)} placeholder="Minimize cost, lateness, risk, emissions..." />
                    <InputField label="QUBO constraints" value={inputs.quboConstraints ?? ""} onChange={(value) => updateInput("quboConstraints", value)} placeholder="Capacity, time windows, assignment constraints..." />
                    <InputField label="Penalty terms" value={inputs.penaltyTerms ?? ""} onChange={(value) => updateInput("penaltyTerms", value)} placeholder="Penalty weights or tuning plan" />
                  </div>
                </div>
              ) : null}

              {isSearch ? (
                <div className="mt-5 rounded-[24px] border border-[#d8e2f3] bg-[#f8fbff] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-[#2f5be3]" />
                    Grover oracle contract inputs
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Predicate / oracle definition" value={inputs.predicateDefinition ?? ""} onChange={(value) => updateInput("predicateDefinition", value)} placeholder="The reversible predicate that marks a solution" />
                    <InputField label="Input size N" value={inputs.inputSizeN ?? ""} onChange={(value) => updateInput("inputSizeN", value)} placeholder="Search-space size or qubit count" />
                    <InputField label="Marked items M" value={inputs.markedItemCountM ?? ""} onChange={(value) => updateInput("markedItemCountM", value)} placeholder="Expected number of marked states" />
                    <InputField label="Data-loading assumption" value={inputs.dataLoadingAssumption ?? ""} onChange={(value) => updateInput("dataLoadingAssumption", value)} placeholder="How the data becomes a reversible oracle" />
                  </div>
                </div>
              ) : null}

              {isCrypto ? (
                <div className="mt-5 rounded-[24px] border border-[#d8e2f3] bg-[#f8fbff] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-[#157052]" />
                    Crypto/security intake
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="RSA / ECC / DH / ECDSA usage" value={String(inputs.securityCryptoInventory?.algorithms ?? "")} onChange={(value) => updateCryptoInventory("algorithms", value)} />
                    <InputField label="Certificate lifetimes" value={String(inputs.securityCryptoInventory?.certificateLifetimes ?? "")} onChange={(value) => updateCryptoInventory("certificateLifetimes", value)} />
                    <InputField label="Data shelf life / retention" value={String(inputs.securityCryptoInventory?.dataShelfLife ?? "")} onChange={(value) => updateCryptoInventory("dataShelfLife", value)} />
                    <InputField label="Systems needing inventory" value={String(inputs.securityCryptoInventory?.systems ?? "")} onChange={(value) => updateCryptoInventory("systems", value)} />
                    <InputField label="Migration time / owner" value={String(inputs.securityCryptoInventory?.migrationTime ?? "")} onChange={(value) => updateCryptoInventory("migrationTime", value)} />
                    <InputField label="Assumed quantum risk horizon" value={String(inputs.securityCryptoInventory?.assumedQuantumCollapseTimeYears ?? "")} onChange={(value) => updateCryptoInventory("assumedQuantumCollapseTimeYears", value)} placeholder="Years until relevant cryptanalytic risk" />
                    <InputField label="Inventory completeness" value={String(inputs.securityCryptoInventory?.inventoryCompleteness ?? "")} onChange={(value) => updateCryptoInventory("inventoryCompleteness", value)} placeholder="complete, partial, unknown" />
                    <InputField label="Crypto agility status" value={String(inputs.securityCryptoInventory?.cryptoAgility ?? "")} onChange={(value) => updateCryptoInventory("cryptoAgility", value)} />
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
                      <span className="rounded-full bg-[#fff7ed] px-3 py-2 text-xs font-semibold uppercase text-[#c2410c]">
                        Build: {result.build_eligibility.replaceAll("_", " ")}
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
                  <EvidenceList title="Recommended contract" items={[`${result.recommended_contract_type.replaceAll("_", " ")} / ${result.recommended_algorithm_family.replaceAll("_", " ")}`]} empty="No contract recommended." />
                  <EvidenceList title="Contract validity" items={[result.contract_validity_status.replaceAll("_", " ")]} empty="No validity status." />
                  <EvidenceList title="Mathematical object" items={[result.mathematical_object]} empty="No mathematical object supplied." />
                  <EvidenceList title="Reduction summary" items={[result.reduction_summary]} empty="No reduction summary supplied." />
                  <EvidenceList title="Classical baseline" items={[result.classical_baseline_summary]} empty="Classical baseline required." />
                  <EvidenceList title="Quantum candidate" items={[result.quantum_candidate_summary]} empty="No candidate recommended." />
                  <EvidenceList title="Required inputs" items={result.required_inputs} empty="No required inputs recorded." />
                  <EvidenceList title="Missing contract inputs" items={result.missing_inputs} empty="No missing contract inputs recorded." />
                  <EvidenceList title="Benchmark plan" items={[result.benchmark_plan]} empty="No benchmark plan supplied." />
                  <EvidenceList title="Resource estimate" items={[JSON.stringify(result.resource_estimate)]} empty="No resource estimate supplied." />
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
                        disabled={buildIsBusy}
                        className="inline-flex items-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.25)] transition hover:-translate-y-[1px]"
                      >
                        {buildIsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                        Create Algorithm Experiment Bundle
                      </button>
                    ) : (
                      <span className="rounded-full bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#c2410c]">
                        Build gated: {result.build_eligibility.replaceAll("_", " ")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void downloadMemo()}
                      disabled={exportMemo.isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
                    >
                      {exportMemo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Export Algorithm Brief
                    </button>
                  </div>
                  {bundleId ? (
                    <Link
                      href={`/build?assessment_id=${result.id}${contractId ? `&contract_id=${contractId}` : ""}&bundle_id=${bundleId}&starter=${starterForAssessment(result)}`}
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
                <p>No serious quantum build artifact is generated without a valid or partial Algorithm Contract, classical baseline, time horizon, evidence or assumptions, and trust label.</p>
                <p>Logistics remains benchmark-first unless the QUBO/QAOA reduction and baseline are explicit; production advantage unproven is always visible.</p>
                <p>Crypto/security produces a PQC Migration Memo, not a quantum circuit or QKD recommendation.</p>
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

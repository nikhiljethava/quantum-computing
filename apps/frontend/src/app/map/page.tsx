"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  GitBranch,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { WorkspaceRail } from "@/components/workspace/WorkspaceRail";
import { ResultTrustPanel } from "@/components/trust/ResultTrustPanel";
import {
  createArtifact,
  exportAssessmentMemo,
  fetchArchitecture,
  getArtifactDownloadUrl,
  runCircuit,
} from "@/lib/api";
import { GuidePanel } from "@/components/GuidePanel";
import { HardwareAccessNote } from "@/components/HardwareAccessNote";
import {
  useAlgorithmContract,
  useAssessment,
  useExperimentBundle,
  useSession,
  useUseCases,
} from "@/lib/hooks";
import {
  architectureResultTrust,
  assessmentResultTrust,
  bundleResultTrust,
} from "@/lib/result-trust";
import { STARTER_ORDER, StarterKey, getStarterStory, normalizeStarterKey } from "@/lib/studio-mocks";
import { ArchitectureMap, CircuitRun, GcpComponent, UseCase } from "@/types/api";

const NODE_STYLE = {
  primary: { bg: "#e0e7ff", border: "#2f5be3", text: "#1d4ed8" },
  secondary: { bg: "#dcfce7", border: "#1c9d68", text: "#157052" },
  accent: { bg: "#efe2ff", border: "#7c3aed", text: "#6d28d9" },
  warn: { bg: "#ffedd5", border: "#ea580c", text: "#c2410c" },
  neutral: { bg: "#f8fafc", border: "#cbd5e1", text: "#475569" },
} as const;

type NodeTone = keyof typeof NODE_STYLE;

function toneFromComponent(component: GcpComponent): NodeTone {
  if (component.execution_kind === "simulated_quantum") return "accent";
  if (component.execution_kind === "optional_approved_hardware" || component.execution_kind === "future_only") return "warn";
  if (component.service.includes("Storage") || component.service.includes("BigQuery")) return "primary";
  if (component.service.includes("Post") || component.service.includes("Monitoring")) return "secondary";
  return "neutral";
}

const EXECUTION_LABELS: Record<GcpComponent["execution_kind"], string> = {
  classical: "Classical",
  simulated_quantum: "Simulated quantum",
  optional_approved_hardware: "Optional approved hardware",
  future_only: "Future only",
};

const REFERENCE_NODE_NAMES: Record<string, string> = {
  optimization_input: "Problem Input",
  problem_construction: "Classical Problem Construction",
  classical_solver_baseline: "Declared Classical Baseline",
  qubo_formulation: "QUBO or Ising Formulation",
  circuit_runner: "Algorithm Simulator",
  vertex_ai: "Classical Optimizer Loop",
  comparison_decision: "Benchmark Comparison and Decision",
  molecule_definition: "Molecule or Material Definition",
  basis_active_space: "Basis and Active-Space Assumptions",
  hamiltonian_construction: "Hamiltonian Construction",
  openfermion_cirq_path: "Algorithm Implementation Path",
  classical_chemistry_baseline: "Classical Chemistry Baseline",
  result_interpretation: "Result Interpretation",
  search_space: "Search-Space Definition",
  oracle_contract: "Oracle Contract",
  data_loading: "Data-Loading Assumption",
  query_complexity: "Query-Complexity Result",
  end_to_end_caveats: "End-to-End Caveats",
  crypto_inventory: "Cryptographic Inventory",
  risk_clock: "Risk-Clock Analysis",
  prioritization: "Migration Prioritization",
  standards_selection: "Standards and Algorithm Selection",
  interop_testing: "Interoperability and Performance Testing",
  staged_migration: "Staged Migration",
  crypto_agility: "Crypto-Agility Monitoring",
  pqc_memo: "PQC Migration Memo",
  input_data: "Input Data",
  classical_preprocessing: "Classical Preprocessing",
  classical_postprocessing: "Classical Post-Processing",
  artifact_export: "Decision and Artifact Export",
  future_resource_estimation: "Future Resource-Estimation Path",
  hardware_gate: "Optional Approved Hardware",
};

function referenceNodeName(component: GcpComponent): string {
  return REFERENCE_NODE_NAMES[component.id] ?? component.name;
}

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session_id");
  const assessmentId = searchParams.get("assessment_id");
  const contractId = searchParams.get("contract_id");
  const bundleId = searchParams.get("bundle_id");
  const starter = normalizeStarterKey(
    searchParams.get("starter") ?? searchParams.get("circuit"),
  );
  const story = getStarterStory(starter);
  const selectedUseCaseId = searchParams.get("use_case_id");
  const { data: sessionDetail } = useSession(activeSessionId);
  const { data: useCaseList } = useUseCases();
  const assessmentQuery = useAssessment(assessmentId);
  const { data: sourceContract } = useAlgorithmContract(contractId);
  const { data: sourceBundle } = useExperimentBundle(bundleId);
  const sourceAssessment = assessmentQuery.data;
  const [currentRun, setCurrentRun] = useState<CircuitRun | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureMap | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingMemo, setIsExportingMemo] = useState(false);
  const [architectureView, setArchitectureView] = useState<"reference" | "cloud">("reference");
  const requestIdRef = useRef(0);

  const selectedUseCase = useMemo(() => {
    const items = useCaseList?.items ?? [];
    if (!items.length) return null;
    const sessionUseCaseId = sessionDetail?.selected_use_case_id ?? sessionDetail?.latest_circuit_run?.use_case_id ?? null;
    const targetId = selectedUseCaseId ?? sessionUseCaseId ?? sourceAssessment?.use_case_id;
    return items.find((item) => item.id === targetId) ?? items[0];
  }, [selectedUseCaseId, sessionDetail, sourceAssessment?.use_case_id, useCaseList?.items]);

  const loadLiveArchitecture = useCallback(async (
    nextStarter: StarterKey,
    useCase: UseCase,
    sessionId?: string | null,
  ) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setPageError(null);

    try {
      if (assessmentId) {
        setCurrentRun(null);
        const nextArchitecture = await fetchArchitecture({
          assessment_id: assessmentId,
          contract_id: contractId ?? undefined,
          use_case_id: useCase.id,
        });
        if (requestIdRef.current !== requestId) return;
        setArchitecture(nextArchitecture);
        return;
      }

      const circuitRun = await runCircuit({
        template_key: nextStarter,
        prompt: getStarterStory(nextStarter).prompt,
        use_case_id: useCase.id,
        session_id: sessionId ?? undefined,
      });

      if (requestIdRef.current !== requestId) return;

      setCurrentRun(circuitRun);

      const nextArchitecture = await fetchArchitecture({
        circuit_run_id: circuitRun.id,
        use_case_id: useCase.id,
      });

      if (requestIdRef.current !== requestId) return;

      setArchitecture(nextArchitecture);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setPageError(
        err instanceof Error ? err.message : "The live architecture map could not be generated.",
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [assessmentId, contractId]);

  useEffect(() => {
    if (assessmentId) {
      if (assessmentQuery.isLoading || !sourceAssessment || !selectedUseCase) return;
      void loadLiveArchitecture(starter, selectedUseCase, activeSessionId);
      return;
    }

    if (activeSessionId && !sessionDetail) return;

    if (activeSessionId && sessionDetail) {
      const savedStarter = normalizeStarterKey(sessionDetail.starter_key);
      const savedUseCaseId =
        sessionDetail.selected_use_case_id ?? sessionDetail.latest_circuit_run?.use_case_id ?? null;
      const queryMatchesSaved =
        savedStarter === starter && savedUseCaseId === (selectedUseCase?.id ?? null);

      if (queryMatchesSaved && sessionDetail.latest_circuit_run) {
        setCurrentRun(sessionDetail.latest_circuit_run);
        if (sessionDetail.latest_architecture) {
          setArchitecture(sessionDetail.latest_architecture);
          setPageError(null);
          setIsLoading(false);
          return;
        }

        void (async () => {
          setIsLoading(true);
          try {
            const nextArchitecture = await fetchArchitecture({
              circuit_run_id: sessionDetail.latest_circuit_run!.id,
              use_case_id: savedUseCaseId ?? undefined,
              assessment_id: assessmentId ?? undefined,
            });
            setArchitecture(nextArchitecture);
            setPageError(null);
          } catch (err) {
            setPageError(
              err instanceof Error ? err.message : "The saved architecture could not be regenerated.",
            );
          } finally {
            setIsLoading(false);
          }
        })();
        return;
      }
    }

    if (!selectedUseCase) return;
    void loadLiveArchitecture(starter, selectedUseCase, activeSessionId);
  }, [
    activeSessionId,
    assessmentId,
    assessmentQuery.isLoading,
    loadLiveArchitecture,
    selectedUseCase,
    sessionDetail,
    sourceAssessment,
    starter,
  ]);

  function syncQuery(nextStarter: StarterKey, nextUseCaseId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("starter", nextStarter);
    params.delete("circuit");
    if (nextUseCaseId) {
      params.set("use_case_id", nextUseCaseId);
    } else {
      params.delete("use_case_id");
    }
    if (activeSessionId) {
      params.set("session_id", activeSessionId);
    }
    router.replace(`/map?${params.toString()}`, { scroll: false });
  }

  function selectStarter(nextStarter: StarterKey) {
    syncQuery(nextStarter, selectedUseCase?.id ?? null);
  }

  function selectUseCase(useCaseId: string) {
    syncQuery(starter, useCaseId);
  }

  async function downloadArchitectureJson() {
    if (!architecture?.id) {
      setPageError("Generate or restore a persisted architecture map before exporting JSON.");
      return;
    }

    try {
      setIsExporting(true);
      setPageError(null);
      const artifact = await createArtifact({
        artifact_type: "architecture_json",
        circuit_run_id: currentRun?.id,
        architecture_record_id: architecture.id,
      });
      const link = document.createElement("a");
      link.href = getArtifactDownloadUrl(artifact.id);
      link.download = artifact.filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "The architecture export could not be prepared.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function downloadOpportunityMemo() {
    if (!assessmentId) {
      setPageError("Run or open an assessment before exporting an assessment memo.");
      return;
    }

    try {
      setIsExportingMemo(true);
      setPageError(null);
      const memo = await exportAssessmentMemo(assessmentId);
      const link = document.createElement("a");
      link.href = getArtifactDownloadUrl(memo.artifact.id);
      link.download = memo.artifact.filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "The assessment memo export could not be prepared.",
      );
    } finally {
      setIsExportingMemo(false);
    }
  }

  const buildParams = new URLSearchParams({
    mode: assessmentId ? "contract" : "tutorial",
    starter,
    ...(selectedUseCase ? { use_case_id: selectedUseCase.id } : {}),
    ...(activeSessionId ? { session_id: activeSessionId } : {}),
    ...(assessmentId ? { assessment_id: assessmentId } : {}),
    ...(contractId ? { contract_id: contractId } : {}),
    ...(bundleId ? { bundle_id: bundleId } : {}),
    ...(sourceAssessment?.problem_class === "CRYPTO_SECURITY" ? { workflow: "pqc" } : {}),
  });
  const buildHref = `/build?${buildParams.toString()}`;
  const isPqcMap = sourceAssessment?.problem_class === "CRYPTO_SECURITY";
  const mapTrust =
    architectureResultTrust(architecture) ??
    bundleResultTrust(sourceBundle) ??
    assessmentResultTrust(sourceAssessment);

  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-4 shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:p-6">
        <div className="mb-6 border-b border-[#dbe5f1] pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5be3]">
              Architecture mapper
            </span>
            <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#157052]">
              Live map
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Simulator first
            </span>
          </div>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-slate-900">
            {assessmentId
              ? "Map the Algorithm Contract and hybrid architecture"
              : "Map the workflow and implementation example"}
          </h2>
          <p className="mt-3 max-w-[760px] text-[1.02rem] leading-8 text-slate-600">
            {sourceAssessment?.problem_class === "CRYPTO_SECURITY"
              ? "Generate a classical PQC migration architecture from inventory through testing, staged migration, monitoring, and memo export. No circuit or QPU path is included."
              : "Generate a contract-specific hybrid architecture with the classical baseline, simulated quantum step, post-processing, time horizon, assumptions, and access controls visible."}
          </p>
          {assessmentId ? (
            <div className="mt-4 inline-flex rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold uppercase text-[#2f5be3]">
              Assessment attached: {assessmentId}
            </div>
          ) : null}
          {bundleId ? (
            <div className="ml-2 mt-4 inline-flex rounded-full bg-[#dcfce7] px-3 py-2 text-xs font-semibold uppercase text-[#157052]">
              Bundle attached: {bundleId}
            </div>
          ) : null}
          {sourceContract ? (
            <div className="ml-2 mt-4 inline-flex rounded-full bg-[#f5f3ff] px-3 py-2 text-xs font-semibold uppercase text-[#6d28d9]">
              Contract: {sourceContract.contract_type.replaceAll("_", " ")}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_320px]">
          <WorkspaceRail
            active="exports"
            tip="Use Map after an assessment or Algorithm Contract so the architecture stays connected to a decision, baseline, and trust labels."
          />

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {assessmentId ? "Algorithm Contract anchor" : "Tutorial prototype lane"}
              </div>
              {assessmentId ? (
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold uppercase text-[#2f5be3]">
                    {sourceAssessment?.problem_class.replaceAll("_", " ") ?? "Loading problem class"}
                  </span>
                  <span className="rounded-full bg-[#f5f3ff] px-3 py-2 text-xs font-semibold uppercase text-[#6d28d9]">
                    {sourceContract?.contract_type.replaceAll("_", " ") ?? architecture?.contract_type.replaceAll("_", " ") ?? "Loading contract"}
                  </span>
                  <span className="rounded-full bg-[#f0fdf4] px-3 py-2 text-xs font-semibold uppercase text-[#166534]">
                    {sourceAssessment?.time_horizon.replaceAll("_", " ") ?? architecture?.time_horizon.replaceAll("_", " ") ?? "Time horizon pending"}
                  </span>
                </div>
              ) : (
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
              )}

              <div className="mt-5 rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4 text-sm leading-7 text-slate-600">
                {sourceAssessment?.reduction_summary || story.architectureSummary}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Use case anchor
                  </div>
                  <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
                    Keep the cloud story tied to a real use case
                  </h2>
                </div>
                {selectedUseCase ? (
                  <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold capitalize text-[#2f5be3]">
                    {selectedUseCase.industry}
                  </span>
                ) : null}
              </div>

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
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <GitBranch className="h-4 w-4 text-[#2f5be3]" />
                  {architectureView === "reference" ? "Vendor-neutral reference architecture" : "Cloud implementation example"}
                </div>
                <button
                  type="button"
                  onClick={() => selectedUseCase && void loadLiveArchitecture(starter, selectedUseCase, activeSessionId)}
                  disabled={!selectedUseCase || isLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isLoading ? "Generating..." : assessmentId ? "Regenerate contract map" : "Generate tutorial map"}
                </button>
              </div>

              <div className="mb-5 flex flex-col gap-3 border-y border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex w-fit border border-slate-300 bg-white p-1" aria-label="Architecture view">
                  <button
                    type="button"
                    aria-pressed={architectureView === "reference"}
                    onClick={() => setArchitectureView("reference")}
                    className={`px-4 py-2 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${architectureView === "reference" ? "bg-[#2563eb] text-white" : "text-slate-600"}`}
                  >
                    Reference architecture
                  </button>
                  <button
                    type="button"
                    aria-pressed={architectureView === "cloud"}
                    onClick={() => setArchitectureView("cloud")}
                    className={`px-4 py-2 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${architectureView === "cloud" ? "bg-[#2563eb] text-white" : "text-slate-600"}`}
                  >
                    Cloud implementation example
                  </button>
                </div>
                <p className="max-w-xl text-xs leading-6 text-slate-500">
                  {architectureView === "reference"
                    ? "This view explains workflow responsibilities without prescribing a vendor."
                    : "Google Cloud services are shown as one possible implementation, not an official Google quantum product or universal reference architecture."}
                </p>
              </div>

              {architecture ? (
                <>
                  <div className="rounded-[28px] border border-[#e2e8f0] bg-[#f8fbff] p-6">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {architecture.components.map((component, index) => {
                        const style = NODE_STYLE[toneFromComponent(component)];
                        const executionKind = component.execution_kind ?? "classical";
                        return (
                          <div key={component.id} className="flex items-center gap-3">
                            <div
                              className="min-w-[160px] rounded-[22px] border px-4 py-4 text-center shadow-sm"
                              style={{ backgroundColor: style.bg, borderColor: style.border }}
                            >
                              <div className="text-sm font-semibold" style={{ color: style.text }}>
                                {architectureView === "reference" ? referenceNodeName(component) : component.name}
                              </div>
                              <div className="mt-2 text-[12px] leading-5 text-slate-500">
                                {component.description}
                              </div>
                              <div className="mt-3 border border-white/80 bg-white/70 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                                {EXECUTION_LABELS[executionKind]}
                              </div>
                              {architectureView === "cloud" ? (
                                <div className="mt-2 text-[10px] font-bold uppercase text-slate-500">
                                  {component.service}
                                </div>
                              ) : null}
                            </div>
                            {index < architecture.components.length - 1 ? (
                              <ArrowRight className="h-5 w-5 text-slate-400" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-5">
                      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Architecture summary
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{architecture.summary}</p>
                    </div>

                    <div className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-5">
                      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Architecture notes
                      </div>
                      <div className="mt-3 space-y-3">
                        {architecture.notes.map((note) => (
                          <div key={note} className="flex gap-3 text-sm leading-6 text-slate-600">
                            <span className="mt-[7px] h-2 w-2 rounded-full bg-[#2f5be3]" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <ResultTrustPanel trust={mapTrust} title="Architecture Result Trust" />
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#d8e2f3] bg-[#f8fbff] p-6 text-sm leading-7 text-slate-500">
                  Select a starter lane and use case to generate a live architecture map.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {isPqcMap ? "PQC Migration Memo" : "Quantum Algorithm Brief"}
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-slate-700">
                  Executive verdict, contract, and problem shape
                </div>
                <div className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-slate-700">
                  Classical baseline, algorithm candidate, and trust labels
                </div>
                <div className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-slate-700">
                  Evidence, caveats, Algorithm Experiment Bundle, GCP architecture, time horizon, next decision
                </div>
              </div>
              <button
                type="button"
                onClick={() => void downloadOpportunityMemo()}
                disabled={!assessmentId || isExportingMemo}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f5be3] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(47,91,227,0.3)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExportingMemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExportingMemo
                  ? "Packaging memo..."
                  : isPqcMap
                    ? "Export PQC Migration Memo"
                    : "Export Algorithm Brief"}
              </button>
              <button
                type="button"
                onClick={() => void downloadArchitectureJson()}
                disabled={!architecture?.id || isExporting}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExporting ? "Packaging architecture..." : "Download architecture JSON"}
              </button>
              <div className="mt-5 border-t border-slate-200 pt-5">
                <ResultTrustPanel trust={mapTrust} title="Export Trust Preview" embedded />
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)]">
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Continue editing
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {currentRun
                  ? "Return to the Algorithm Experiment Workspace to refine the circuit, rerun the simulation, or export the broader bundle."
                  : sourceAssessment?.problem_class === "CRYPTO_SECURITY"
                    ? "Return to the PQC migration workspace. This path intentionally has no circuit editor."
                    : "Return to Contract mode to review the bundle and simulator job."}
              </p>
              <Link
                href={buildHref}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#2f5be3] hover:text-[#2f5be3]"
              >
                {assessmentId ? "Return to Build workspace" : "Return to Tutorial mode"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-[#d8e2f3] bg-[#f8fbff] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-[#2f5be3]" />
                Guardrails
              </div>
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>Keep the architecture simulator-first by default.</p>
                <p>Only mention hardware as an optional future branch, not the primary execution path.</p>
                <p>Use the map to explain the hybrid split, not to imply that the workload is already production-validated.</p>
              </div>
            </div>

            <HardwareAccessNote />

            <GuidePanel
              pageContext="map"
              useCaseId={selectedUseCase?.id}
              circuitRunId={currentRun?.id}
              architectureId={architecture?.id ?? undefined}
              starterQuestion="Explain this Google Cloud architecture in plain language."
            />

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

function MapPageFallback() {
  return (
    <div className="mx-auto max-w-[1460px] px-4 py-8 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,245,255,0.96))] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.18)]">
        <div className="mb-6 h-8 w-56 rounded-full bg-slate-200" />
        <div className="mb-4 h-14 max-w-[520px] rounded-[24px] bg-slate-200" />
        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1.35fr)_320px]">
          <div className="skeleton h-[560px]" />
          <div className="space-y-5">
            <div className="skeleton h-[180px]" />
            <div className="skeleton h-[240px]" />
            <div className="skeleton h-[520px]" />
          </div>
          <div className="space-y-5">
            <div className="skeleton h-[260px]" />
            <div className="skeleton h-[220px]" />
            <div className="skeleton h-[180px]" />
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

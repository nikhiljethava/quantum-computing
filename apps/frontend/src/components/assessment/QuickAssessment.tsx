"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ClipboardCheck, ShieldCheck } from "lucide-react";

import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";
import { trackProductEvent } from "@/lib/analytics";
import type {
  AlgorithmFamily,
  AssessmentInputs,
  ContractType,
  ProblemClass,
  TimeHorizon,
} from "@/types/api";

export type QuickGoal = "learning" | "benchmarking" | "research" | "operational";
type StructuredInput = "yes" | "partial" | "no";
type QuickHorizon = "now" | "one-to-three-years" | "future";

export interface QuickAssessmentResult {
  likelyContractType: ContractType;
  likelyAlgorithmFamily: AlgorithmFamily;
  likelyTimeHorizon: TimeHorizon;
  missingEvidence: string[];
  recommendedNextAction: string;
}

const PROBLEM_OPTIONS: Array<{ value: ProblemClass; label: string }> = [
  { value: "QUANTUM_SIMULATION", label: "Chemistry, battery, or materials simulation" },
  { value: "OPTIMIZATION", label: "Routing, scheduling, allocation, or portfolio optimization" },
  { value: "SEARCH", label: "Oracle-based unstructured search" },
  { value: "CRYPTO_SECURITY", label: "Post-quantum cryptography readiness" },
  { value: "LINEAR_SYSTEMS", label: "Structured linear systems" },
  { value: "QUANTUM_ML", label: "Quantum machine learning" },
  { value: "UNKNOWN", label: "I am not sure yet" },
];

function likelyContract(problemClass: ProblemClass): {
  contract: ContractType;
  family: AlgorithmFamily;
  requiredEvidence: string[];
  action: string;
} {
  if (problemClass === "QUANTUM_SIMULATION") {
    return {
      contract: "VQE",
      family: "VQE",
      requiredEvidence: ["molecule or material definition", "Hamiltonian path", "observable, ansatz, and optimizer"],
      action: "Continue into the full contract and scope one molecule or material fragment against a declared chemistry baseline.",
    };
  }
  if (problemClass === "OPTIMIZATION") {
    return {
      contract: "QUBO_ISING",
      family: "QAOA",
      requiredEvidence: ["variables and objective", "constraints and penalty strategy", "same-instance benchmark metrics"],
      action: "Continue into the full contract and freeze a small QUBO benchmark against the current classical solver.",
    };
  }
  if (problemClass === "SEARCH") {
    return {
      contract: "ORACLE",
      family: "GROVER_SEARCH",
      requiredEvidence: ["reversible predicate or oracle", "oracle construction cost", "data-loading assumption"],
      action: "Continue into the full oracle contract before treating Grover as more than a tutorial.",
    };
  }
  if (problemClass === "CRYPTO_SECURITY") {
    return {
      contract: "PQC_RISK",
      family: "PQC_READINESS",
      requiredEvidence: ["cryptographic inventory", "data lifetime and certificate lifetime", "migration owner and status"],
      action: "Continue into the full security intake for a classical PQC inventory and migration decision.",
    };
  }
  if (problemClass === "LINEAR_SYSTEMS") {
    return {
      contract: "TUTORIAL",
      family: "UNKNOWN",
      requiredEvidence: ["matrix structure and conditioning", "input-state preparation", "required classical output", "strong classical solver baseline"],
      action: "Continue into the full contract for benchmark-first scoping; no serious Build is unlocked from this preview.",
    };
  }
  return {
    contract: "TUTORIAL",
    family: "UNKNOWN",
    requiredEvidence: ["clear mathematical problem structure", "declared classical baseline", "measurable success criteria"],
    action: "Use the full readiness intake to clarify the problem before selecting a serious experiment path.",
  };
}

function timeHorizon(horizon: QuickHorizon, goal: QuickGoal, problemClass: ProblemClass): TimeHorizon {
  if (problemClass === "CRYPTO_SECURITY") return "NOW_CLASSICAL";
  if (horizon === "future") return "FTQC_LATER";
  if (horizon === "one-to-three-years" || goal === "research") return "NISQ_EXPLORATION";
  return "SIMULATOR_NOW";
}

export function QuickAssessment({
  initialProblemClass,
  initialGoal,
  source,
  onContinue,
}: {
  initialProblemClass: ProblemClass;
  initialGoal: QuickGoal;
  source: string | null;
  onContinue: (inputs: Partial<AssessmentInputs>) => void;
}) {
  const [problemDescription, setProblemDescription] = useState("");
  const [problemClass, setProblemClass] = useState<ProblemClass>(initialProblemClass);
  const [classicalBaseline, setClassicalBaseline] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [structuredInput, setStructuredInput] = useState<StructuredInput>("partial");
  const [horizon, setHorizon] = useState<QuickHorizon>("now");
  const [goal, setGoal] = useState<QuickGoal>(initialGoal);
  const [result, setResult] = useState<QuickAssessmentResult | null>(null);

  const sourceContext = useMemo(() => source ?? "direct", [source]);

  function runQuickAssessment() {
    const likely = likelyContract(problemClass);
    const missingEvidence = [
      ...(classicalBaseline.trim() || problemClass === "CRYPTO_SECURITY" ? [] : ["current classical baseline"]),
      ...(problemDescription.trim() ? [] : ["specific problem statement"]),
      ...(businessValue.trim() ? [] : ["measurable outcome or value"]),
      ...(structuredInput === "yes" ? [] : likely.requiredEvidence),
    ];
    setResult({
      likelyContractType: likely.contract,
      likelyAlgorithmFamily: likely.family,
      likelyTimeHorizon: timeHorizon(horizon, goal, problemClass),
      missingEvidence: [...new Set(missingEvidence)],
      recommendedNextAction: likely.action,
    });
    void trackProductEvent("quick_assessment_completed", `${sourceContext}-${problemClass}`);
  }

  function continueToFull() {
    onContinue({
      problemClass,
      problemDescription,
      objective: problemDescription,
      businessValue,
      currentClassicalBaseline: classicalBaseline,
      currentSolverOrWorkflow: classicalBaseline,
      dataType: structuredInput === "yes" ? "structured mathematical input available" : "structure still requires validation",
      latencyTolerance: horizon,
      userFilesOrNotes: `Quick Assessment goal: ${goal}. Source: ${sourceContext}.`,
      tutorialSampleSelected: false,
    });
  }

  const fieldClass = "mt-2 w-full border border-[#d8e2f3] bg-[#f8fbff] px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#2563eb]";

  return (
    <section className="border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_40px_rgba(148,163,184,0.18)] md:p-6" aria-labelledby="quick-assessment-title">
      <AnalyticsEvent event="quick_assessment_started" context={sourceContext} />
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="text-xs font-black uppercase text-[#2563eb]">Five-minute entry flow</div>
          <h2 id="quick-assessment-title" className="mt-2 text-3xl font-black text-slate-950">Quick Assessment</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Identify a likely contract shape, time horizon, and missing evidence. This preview never creates a contract, score, verdict, or serious Build eligibility.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-xs font-black uppercase text-[#c2410c]">
          <ShieldCheck className="h-4 w-4" /> Cannot unlock Build
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-xs font-black uppercase text-slate-500">What problem are you trying to solve?</span>
          <textarea value={problemDescription} onChange={(event) => setProblemDescription(event.target.value)} rows={3} className={fieldClass} placeholder="Describe the decision, scientific question, or security concern." />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-slate-500">Which broad problem class fits best?</span>
          <select value={problemClass} onChange={(event) => setProblemClass(event.target.value as ProblemClass)} className={fieldClass}>
            {PROBLEM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-slate-500">How is it solved today?</span>
          <input value={classicalBaseline} onChange={(event) => setClassicalBaseline(event.target.value)} className={fieldClass} placeholder="OR-Tools, MILP, DFT, HPC, existing workflow..." />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-slate-500">What outcome or value matters?</span>
          <input value={businessValue} onChange={(event) => setBusinessValue(event.target.value)} className={fieldClass} placeholder="Accuracy, runtime, coverage, risk reduction..." />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-slate-500">Does a mathematical model or structured input exist?</span>
          <select value={structuredInput} onChange={(event) => setStructuredInput(event.target.value as StructuredInput)} className={fieldClass}>
            <option value="yes">Yes, it is explicit</option>
            <option value="partial">Partially</option>
            <option value="no">Not yet</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-slate-500">What time horizon matters?</span>
          <select value={horizon} onChange={(event) => setHorizon(event.target.value as QuickHorizon)} className={fieldClass}>
            <option value="now">Now / simulator-first</option>
            <option value="one-to-three-years">One to three years</option>
            <option value="future">Future fault-tolerant horizon</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-slate-500">What is the goal?</span>
          <select value={goal} onChange={(event) => setGoal(event.target.value as QuickGoal)} className={fieldClass}>
            <option value="learning">Learning</option>
            <option value="benchmarking">Benchmarking</option>
            <option value="research">Research</option>
            <option value="operational">Operational decision</option>
          </select>
        </label>
      </div>

      <button type="button" onClick={runQuickAssessment} className="mt-6 inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]">
        <ClipboardCheck className="h-4 w-4" /> Preview the contract shape
      </button>

      {result ? (
        <div className="mt-7 border-t border-slate-200 pt-7" aria-live="polite">
          <div className="text-xs font-black uppercase text-[#0f766e]">Quick Assessment output</div>
          <div className="mt-4 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
            <div className="bg-[#fbfdff] p-4"><div className="text-xs font-black uppercase text-slate-400">Likely contract type</div><div className="mt-2 font-black text-slate-950">{result.likelyContractType.replaceAll("_", " ")}</div></div>
            <div className="bg-[#fbfdff] p-4"><div className="text-xs font-black uppercase text-slate-400">Likely algorithm family</div><div className="mt-2 font-black text-slate-950">{result.likelyAlgorithmFamily.replaceAll("_", " ")}</div></div>
            <div className="bg-[#fbfdff] p-4"><div className="text-xs font-black uppercase text-slate-400">Likely time horizon</div><div className="mt-2 font-black text-slate-950">{result.likelyTimeHorizon.replaceAll("_", " ")}</div></div>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="border border-[#fed7aa] bg-[#fff7ed] p-4">
              <div className="text-xs font-black uppercase text-[#c2410c]">Most important missing evidence</div>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                {(result.missingEvidence.length ? result.missingEvidence : ["No obvious gap from the quick answers; full validation is still required."]).map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </div>
            <div className="border border-[#bbf7d0] bg-[#f0fdf4] p-4">
              <div className="text-xs font-black uppercase text-[#166534]">Recommended next action</div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{result.recommendedNextAction}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button type="button" onClick={continueToFull} className="inline-flex items-center gap-2 bg-[#0f766e] px-5 py-3 text-sm font-black text-white">
              Continue to Full Algorithm Contract <ArrowRight className="h-4 w-4" />
            </button>
            <p className="max-w-xl text-xs leading-6 text-slate-500">Only the full QALS 3.0 assessment can create a persisted Algorithm Contract or determine Build eligibility.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

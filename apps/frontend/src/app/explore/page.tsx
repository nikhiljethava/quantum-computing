import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ExploreClient from "./ExploreClient";

const description =
  "Explore Algorithm Contract patterns with business context, classical baselines, Cirq-based workflows, and Google Cloud architecture patterns.";

const algorithmPatterns = [
  {
    title: "Hamiltonian / VQE",
    posture: "Research candidate",
    copy: "Battery, materials, catalyst, and molecular simulation ideas need a molecule or fragment, Hamiltonian path, observable, baseline workflow, and future-hardware upside caveats.",
  },
  {
    title: "QUBO / QAOA",
    posture: "Benchmark candidate",
    copy: "Routing, scheduling, supply-chain, and portfolio ideas need variables, objective, constraints, penalties, and a declared classical baseline before any benchmark bundle.",
  },
  {
    title: "PQC Risk",
    posture: "Action-now",
    copy: "Crypto/security work produces a PQC Migration Memo from inventory, certificate lifetime, retention sensitivity, owner, and migration status. No quantum hardware or QKD default.",
  },
  {
    title: "Grover Oracle",
    posture: "Oracle-dependent",
    copy: "Search ideas must define a reversible predicate, input size, marked item estimate, oracle cost, and data-loading assumption. It is not a generic database replacement.",
  },
  {
    title: "Phase Estimation",
    posture: "FTQC-later",
    copy: "Phase estimation and Shor-style period finding stay tutorial or future-fault-tolerant unless the contract explicitly supports the hardware assumptions.",
  },
];

const flagshipScenarios = [
  {
    title: "Battery Materials Simulation",
    industry: "Energy / Materials",
    persona: "Battery R&D lead, computational chemistry lead, or materials platform PM",
    businessKpi: "Screen a narrowed molecule or material fragment with simulator-first evidence and future-hardware upside.",
    classicalBaseline:
      "DFT, molecular dynamics, classical HPC workflows, and existing chemistry simulation pipelines.",
    quantumApproach:
      "Hamiltonian / VQE contract with OpenFermion/Cirq-style toy implementation when the reduction is supplied.",
    maturity: "Research candidate / simulator-first",
    ctas: [
      { label: "Create contract", href: "/assess" },
      { label: "Open learning path", href: "/learn/openfermion" },
    ],
  },
  {
    title: "Molecular Docking & Drug Design",
    industry: "Life sciences / Pharma",
    persona: "Computational chemistry lead, drug-discovery platform lead, or R&D strategist",
    businessKpi:
      "Explore how molecular modeling and Hamiltonian simulation concepts relate to discovery workflows.",
    classicalBaseline:
      "Molecular docking, molecular dynamics, density functional theory, and classical simulation pipelines.",
    quantumApproach:
      "Hamiltonian simulation or VQE contract; clearly simulator-first and hardware-gated for production claims.",
    maturity: "Research only / simulate small examples",
    ctas: [
      { label: "View use case", href: "/use-cases/molecular-docking-drug-design" },
      { label: "Open learning path", href: "/learn/openfermion" },
      { label: "Create contract", href: "/assess" },
    ],
  },
  {
    title: "Vehicle Routing Optimization",
    industry: "Logistics",
    persona: "Supply chain planner, logistics platform PM, or optimization engineer",
    businessKpi:
      "Explore routing and scheduling tradeoffs with constraints, costs, and service windows.",
    classicalBaseline:
      "Vehicle routing heuristics, mixed-integer programming, local search, and metaheuristics.",
    quantumApproach:
      "QUBO/QAOA benchmark candidate with classical orchestration and production advantage unproven caveat.",
    maturity: "Benchmark-first / toy simulation",
    ctas: [
      { label: "View use case", href: "/use-cases/vehicle-routing-optimization" },
      { label: "Create contract", href: "/assess" },
    ],
  },
  {
    title: "PQC Readiness",
    industry: "Security",
    persona: "CISO, platform security lead, compliance owner, or crypto inventory program manager",
    businessKpi:
      "Prioritize systems that use RSA, ECC, DH, or ECDSA against long-lived secrets and harvest-now-decrypt-later risk.",
    classicalBaseline:
      "Current certificate inventory, crypto usage inventory, data retention policy, migration owner, and crypto-agility status.",
    quantumApproach:
      "PQC readiness contract and migration memo. This is a non-compute action path, not a quantum circuit or QKD recommendation.",
    maturity: "Action-now",
    ctas: [
      { label: "Create contract", href: "/assess" },
      { label: "Learn the basics", href: "/learn" },
    ],
  },
];

export const metadata: Metadata = {
  title: "Explore Industry Scenarios | Quantum Foundry",
  description,
  openGraph: {
    title: "Explore Industry Scenarios | Quantum Foundry",
    description:
      "Flagship Algorithm Contract scenarios for exploring quantum concepts, Cirq-based simulation, and Google Cloud architecture patterns.",
  },
  alternates: {
    canonical: "/explore",
  },
};

export default function ExplorePage() {
  return (
    <>
      <section className="mx-auto max-w-[1460px] px-4 pt-10 md:px-6">
        <div className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
          <div className="max-w-4xl">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
              Flagship scenarios
            </div>
            <h1 className="mt-3 text-[clamp(2.25rem,5vw,4rem)] font-black tracking-[-0.05em] text-slate-950">
              Flagship Algorithm Contract scenarios
            </h1>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              Start with practical, simulator-first scenarios that connect quantum concepts to real
              enterprise questions. Each path is framed as an Algorithm Contract with baseline,
              evidence, trust labels, and caveats before Build.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-4">
            {flagshipScenarios.map((scenario) => (
              <article
                key={scenario.title}
                className="flex min-h-[560px] flex-col rounded-[28px] border border-[#d8e2f3] bg-white/90 p-5 shadow-[0_18px_44px_rgba(148,163,184,0.16)]"
              >
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-bold text-[#1967d2]">
                      {scenario.industry}
                    </span>
                    <span className="rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-bold text-[#137333]">
                      {scenario.maturity}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                    {scenario.title}
                  </h2>
                </div>

                <dl className="mt-5 grid gap-4 text-sm leading-7">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Persona
                    </dt>
                    <dd className="mt-1 text-slate-700">{scenario.persona}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Business KPI
                    </dt>
                    <dd className="mt-1 text-slate-700">{scenario.businessKpi}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Classical baseline
                    </dt>
                    <dd className="mt-1 text-slate-700">{scenario.classicalBaseline}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Quantum approach
                    </dt>
                    <dd className="mt-1 text-slate-700">{scenario.quantumApproach}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  {scenario.ctas.map((cta) => (
                    <Link
                      key={cta.label}
                      href={cta.href}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-[#f8fbff] px-3 py-2 text-xs font-bold text-[#1967d2] transition hover:border-[#1967d2]"
                    >
                      {cta.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-[#d8e2f3] bg-white/80 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
              Algorithm patterns
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              {algorithmPatterns.map((pattern) => (
                <article key={pattern.title} className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fbff] p-4">
                  <h2 className="text-base font-black tracking-[-0.03em] text-slate-950">
                    {pattern.title}
                  </h2>
                  <div className="mt-2 inline-flex rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[11px] font-bold text-[#1967d2]">
                    {pattern.posture}
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-600">{pattern.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <ExploreClient />
    </>
  );
}

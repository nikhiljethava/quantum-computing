import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ExploreClient from "./ExploreClient";

const description =
  "Explore simulation-first quantum learning scenarios with business context, classical baselines, Cirq-based workflows, and Google Cloud architecture patterns.";

const flagshipScenarios = [
  {
    title: "Portfolio Optimization",
    industry: "Finance",
    persona: "Quant researcher, portfolio manager, or fintech PM",
    businessKpi: "Improve portfolio allocation experiments under constraints and risk tradeoffs.",
    classicalBaseline:
      "Convex optimization, mixed-integer programming, Monte Carlo simulation, and heuristic solvers.",
    quantumApproach:
      "QAOA / Ising or QUBO-style optimization, framed as an educational hybrid workflow.",
    maturity: "Simulate now / pilot carefully",
    ctas: [
      { label: "View use case", href: "/use-cases/portfolio-optimization" },
      { label: "Run related lab", href: "/build" },
      { label: "Assess fit", href: "/assess" },
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
      "OpenFermion/Cirq-style educational chemistry workflow; clearly simulation-first.",
    maturity: "Research only / simulate small examples",
    ctas: [
      { label: "View use case", href: "/use-cases/molecular-docking-drug-design" },
      { label: "Open learning path", href: "/learn/openfermion" },
      { label: "Assess fit", href: "/assess" },
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
      "QAOA/QUBO-style educational optimization workflow with classical orchestration.",
    maturity: "Simulate now / pilot carefully",
    ctas: [
      { label: "View use case", href: "/use-cases/vehicle-routing-optimization" },
      { label: "Run related lab", href: "/build" },
      { label: "Assess fit", href: "/assess" },
    ],
  },
];

export const metadata: Metadata = {
  title: "Explore Industry Scenarios | Quantum Foundry",
  description,
  openGraph: {
    title: "Explore Industry Scenarios | Quantum Foundry",
    description:
      "Flagship learning scenarios for exploring quantum concepts, Cirq-based simulation, and Google Cloud architecture patterns.",
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
              Flagship learning scenarios
            </h1>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              Start with three practical, simulation-first scenarios that connect quantum concepts
              to real industry questions. Each scenario is framed as a learning and pilot-design
              exercise, not a claim of quantum advantage.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
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
        </div>
      </section>
      <ExploreClient />
    </>
  );
}

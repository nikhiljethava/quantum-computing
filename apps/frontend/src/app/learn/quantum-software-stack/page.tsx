import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Braces,
  Cpu,
  FlaskConical,
  Layers3,
  Play,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Quantum Software Stack",
  description:
    "A focused overview of frameworks, domain libraries, compilers, simulators, runtimes, backends, and quantum processors.",
  alternates: { canonical: "/learn/quantum-software-stack" },
};

const STACK_LAYERS = [
  {
    id: "framework",
    title: "Framework",
    icon: Braces,
    simple: "Helps developers describe circuits, algorithms, and hybrid programs.",
    deeper:
      "A framework supplies program objects, gates, parameter handling, execution interfaces, and tooling. Cirq is the supported execution and export path in Quantum Foundry.",
    why: "It gives the problem a precise software representation that can be inspected, transformed, and tested.",
    example:
      "Cirq is executable here. Qiskit, PennyLane, and CUDA-Q are representative educational examples; this app does not claim to execute them.",
    trust:
      "Framework choice does not establish algorithm suitability or quantum advantage. A full Algorithm Contract still controls serious Build eligibility.",
  },
  {
    id: "domain-library",
    title: "Domain library",
    icon: Boxes,
    simple: "Provides reusable methods for a particular scientific or algorithmic domain.",
    deeper:
      "Domain libraries encode specialized objects and transformations so teams do not have to rebuild every chemistry, optimization, or resource-analysis primitive.",
    why: "The quality of the domain reduction often matters more than the number of gates in a toy circuit.",
    example:
      "OpenFermion supports chemistry and Hamiltonian workflows already represented in the app. Qualtran is an educational example for algorithm construction and resource analysis.",
    trust:
      "A library can implement a method correctly while the selected workload, approximation, or baseline remains unsuitable.",
  },
  {
    id: "compiler",
    title: "Compiler and intermediate representation",
    icon: Layers3,
    simple: "Translate higher-level programs into operations a selected target can execute.",
    deeper:
      "Compilation can decompose gates, simplify operations, route interactions, schedule instructions, and expose target-specific resource costs through one or more intermediate representations.",
    why: "Logical algorithms and executable circuits can differ dramatically in depth, connectivity needs, and error exposure.",
    example: "A controlled operation may become several native gates after decomposition for a target backend.",
    trust:
      "A compiled circuit estimate is not a measured hardware result. Target assumptions and software versions must stay attached.",
  },
  {
    id: "simulator",
    title: "Simulator",
    icon: FlaskConical,
    simple: "Runs a mathematical model of a quantum program on classical hardware.",
    deeper:
      "State-vector, tensor-network, stabilizer, and noisy simulation techniques make different tradeoffs. Simulator limits grow quickly with qubit count and circuit structure.",
    why: "Simulation is the safest place to debug semantics, inspect distributions, and establish a small reproducible benchmark.",
    example:
      "Quantum Foundry uses Cirq and supports qsim where configured. cuQuantum-based simulators and Stim are representative specialized examples, not execution paths promised by this app.",
    trust:
      "An ideal or educational-noise simulation is not calibrated hardware behavior and is not QCVV.",
  },
  {
    id: "runtime",
    title: "Runtime and backend",
    icon: ServerCog,
    simple: "Manage execution, queues, parameters, results, retries, and provenance.",
    deeper:
      "A runtime coordinates classical preparation, a simulator or approved hardware backend, post-processing, and iterative control flow such as VQE or QAOA optimization.",
    why: "Operational latency, failure recovery, and evidence capture often determine whether a prototype is usable.",
    example: "A Cloud Run API queues a Python simulation worker and stores artifacts with their assessment and trust context.",
    trust:
      "Backend names, software versions, shots, noise assumptions, and provenance belong in every Result Trust panel.",
  },
  {
    id: "qpu",
    title: "QPU",
    icon: Cpu,
    simple: "The quantum processor that performs quantum operations on physical qubits.",
    deeper:
      "A QPU depends on control electronics, calibration, compilation, error management, classical feedback, and access policy. Fault-tolerant workloads additionally require logical qubits and sustained decoding.",
    why: "The processor is important, but it cannot replace problem formulation, software, baselines, or evidence review.",
    example: "Quantum Foundry models an optional approved-hardware branch but exposes no public QPU runner.",
    trust:
      "Hardware access is restricted, and simulator results cannot be relabeled as hardware measurements.",
  },
] as const;

export default function QuantumSoftwareStackPage() {
  return (
    <div className="bg-[#f7f9fc] text-slate-950">
      <header className="border-b border-slate-800 bg-[#070b16] px-4 py-14 text-white md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 border border-slate-700 px-3 py-2 text-xs font-black text-slate-200">
            <Layers3 className="h-4 w-4 text-[#93c5fd]" /> Focused learning overview
          </div>
          <div className="mt-8 max-w-5xl">
            <h1 className="text-[clamp(3rem,8vw,6.4rem)] font-black leading-[0.94]">Understand the quantum software stack</h1>
            <p className="mt-7 max-w-3xl text-xl leading-9 text-slate-200">
              See how frameworks, domain libraries, compilers, simulators, runtimes, backends, and QPUs play different roles in one hybrid workflow.
            </p>
          </div>
          <p className="mt-8 max-w-3xl border-l-2 border-[#34d399] pl-4 text-sm leading-7 text-slate-300">
            Cirq remains the supported execution path. Other ecosystems are representative educational examples, not installed or promised integrations.
          </p>
        </div>
      </header>

      <div>
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6" aria-labelledby="stack-flow-title">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase text-[#2563eb]">One program, several responsibilities</div>
            <h2 id="stack-flow-title" className="mt-3 text-3xl font-black">A stack is a chain of translations and controls</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              These layers are not a ranking or marketplace. They describe jobs that a trustworthy workflow must perform.
            </p>
          </div>
          <ol className="mt-8 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-6">
            {STACK_LAYERS.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <li key={layer.id} className="min-w-0 bg-white p-4">
                  <Icon className="h-5 w-5 text-[#2563eb]" />
                  <div className="mt-4 text-xs font-black text-slate-400">{String(index + 1).padStart(2, "0")}</div>
                  <div className="mt-1 break-words text-sm font-black text-slate-950">{layer.title}</div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="border-y border-slate-200 bg-white py-12" aria-labelledby="stack-layers-title">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-7 lg:grid-cols-[0.55fr_1.45fr]">
              <div>
                <div className="text-xs font-black uppercase text-[#0f766e]">Layer by layer</div>
                <h2 id="stack-layers-title" className="mt-3 text-3xl font-black">Simple first, detail on demand</h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Open the deeper explanation when you need it. Every layer ends with a trust check so capabilities and evidence do not blur together.
                </p>
              </div>
              <div className="grid gap-4">
                {STACK_LAYERS.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <article key={layer.id} className="border border-slate-200 bg-[#fbfdff] p-6">
                      <div className="flex items-start gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-black text-slate-950">{layer.title}</h3>
                          <p className="mt-2 text-base leading-8 text-slate-700">{layer.simple}</p>
                        </div>
                      </div>
                      <details className="mt-5 border-t border-slate-200 pt-5">
                        <summary className="cursor-pointer font-black text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]">
                          One level deeper
                        </summary>
                        <div className="mt-4 grid gap-5 text-sm leading-7 text-slate-600 md:grid-cols-3">
                          <div>
                            <div className="font-black text-slate-950">How it works</div>
                            <p className="mt-1">{layer.deeper}</p>
                          </div>
                          <div>
                            <div className="font-black text-slate-950">Why it matters</div>
                            <p className="mt-1">{layer.why}</p>
                            <div className="mt-4 font-black text-slate-950">Example</div>
                            <p className="mt-1">{layer.example}</p>
                          </div>
                          <div className="border-l-2 border-[#34d399] pl-4">
                            <div className="flex items-center gap-2 font-black text-slate-950">
                              <ShieldCheck className="h-4 w-4 text-[#0f766e]" /> Trust check
                            </div>
                            <p className="mt-1">{layer.trust}</p>
                          </div>
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="grid gap-6 border border-slate-200 bg-[#070b16] p-7 text-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#6ee7b7]">
                <Play className="h-4 w-4" /> Put the stack in motion
              </div>
              <h2 className="mt-3 text-3xl font-black">Run one supported Cirq tutorial</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                The tutorial stays labeled Tutorial and Toy Simulation. A real problem still needs a full QALS 3.0 Algorithm Contract and classical baseline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/build?mode=tutorial&starter=coin_flip" className="inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-black text-white">
                Open Tutorial mode <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/series" className="inline-flex items-center gap-2 border border-slate-500 px-5 py-3 text-sm font-black text-white">
                Explore the series <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-500">
            Quantum Foundry is an independent personal project and is not an official Google product. It is simulator-first and provides no public quantum-hardware access.
          </p>
        </section>
      </div>
    </div>
  );
}

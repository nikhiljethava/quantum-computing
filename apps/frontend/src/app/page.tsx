import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Atom,
  Binary,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  FlaskConical,
  Gauge,
  GitBranch,
  Layers3,
  Map,
  Network,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Waves,
} from "lucide-react";

import { ContinueJourneyCard } from "@/components/home/ContinueJourneyCard";

export const metadata: Metadata = {
  title: "Quantum Foundry - Learn, Explore, and Prototype",
  description:
    "An independent companion lab for learning how quantum ideas become useful and trustworthy hybrid workflows.",
  alternates: { canonical: "/" },
};

const ENTRY_PATHS = [
  {
    title: "Explore the series",
    description:
      "Explore interactive companions to the Beyond the Quantum Processor articles.",
    href: "/series",
    action: "Explore the series",
    icon: BookOpen,
    tone: "blue",
  },
  {
    title: "Understand the quantum software stack",
    description:
      "Learn how frameworks, libraries, compilers, simulators, runtimes, and QPUs fit together.",
    href: "/learn/quantum-software-stack",
    action: "Explore the software stack",
    icon: Layers3,
    tone: "green",
  },
  {
    title: "Assess a quantum idea",
    description:
      "Turn a real problem into an evidence-backed Algorithm Contract and recommended next step.",
    href: "/assess",
    action: "Start an assessment",
    icon: SlidersHorizontal,
    tone: "violet",
  },
] as const;

const JOURNEY = [
  { label: "Learn", description: "Build enough intuition to read the assessment", icon: BookOpen, href: "/learn" },
  { label: "Explore", description: "Choose a problem shape and inspect examples", icon: ScanSearch, href: "/explore" },
  { label: "Assess", description: "Create an evidence-backed Algorithm Contract", icon: SlidersHorizontal, href: "/assess" },
  { label: "Build", description: "Run a tutorial or a contract-backed experiment", icon: FlaskConical, href: "/build" },
  { label: "Map", description: "Show the hybrid split and export the decision", icon: Map, href: "/map" },
] as const;

const CONCEPTS = [
  {
    title: "Classical bits and qubits",
    icon: Binary,
    summary:
      "A classical bit is read as 0 or 1. A qubit is described by a quantum state and only produces a classical value when measured.",
    detail:
      "Qubits are physical systems controlled through operations called gates. Their state description can include amplitudes, phase, and correlations with other qubits.",
    href: "/learn/beginner/what-is-a-qubit",
  },
  {
    title: "Superposition",
    icon: CircleDot,
    summary:
      "A qubit can be prepared with amplitudes for both 0 and 1. Quantum algorithms create useful results by controlling how those amplitudes interfere before measurement.",
    detail:
      "Measurement still produces one classical outcome. Superposition is not the same as freely trying or reading every possible answer at once.",
    href: "/learn/beginner/superposition",
  },
  {
    title: "Entanglement",
    icon: Network,
    summary:
      "Entangled qubits have measurement outcomes that cannot be described independently. These correlations are useful in quantum computing and communication, but they do not transmit information faster than light.",
    detail:
      "Entanglement is a property of a joint quantum state. Its usefulness depends on the wider algorithm, noise, controls, and measurement strategy.",
    href: "/learn/beginner/entanglement",
  },
  {
    title: "Measurement",
    icon: Gauge,
    summary:
      "Measurement converts quantum information into a classical outcome. One run produces a sample, not a complete answer distribution.",
    detail:
      "Quantum programs are usually executed many times to estimate a probability distribution. The number of shots and uncertainty belong beside every result.",
    href: "/learn/beginner/measurement",
  },
  {
    title: "Interference",
    icon: Waves,
    summary:
      "Quantum algorithms shape amplitudes so useful outcomes become more likely and unwanted outcomes become less likely.",
    detail:
      "The useful effect comes from a carefully designed sequence of operations, not from superposition alone. Interference can reinforce or cancel amplitudes.",
    href: "/learn/beginner/interference",
  },
  {
    title: "Noise and error correction",
    icon: ShieldCheck,
    summary:
      "Physical qubits are noisy. Error mitigation can reduce some effects of noise in limited experiments, but it is not fault tolerance.",
    detail:
      "Fault tolerance requires logical qubits, repeated error detection, classical decoding, and control throughout the computation. Educational noise is not calibrated hardware noise.",
    href: "/learn/beginner/noise-and-error-correction",
  },
  {
    title: "Today versus future maturity",
    icon: Layers3,
    summary:
      "Today is strongest for learning, classical simulation, careful benchmarks, research prototypes, and post-quantum migration planning.",
    detail:
      "Many large-scale algorithms require future fault-tolerant hardware. Quantum Foundry keeps simulator-now, hardware-gated, and FTQC-later claims visibly separate.",
    href: "/learn/beginner/today-versus-future",
  },
] as const;

const TONE_CLASSES = {
  blue: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  green: "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]",
  violet: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
} as const;

export default function HomePage() {
  return (
    <div className="bg-[#f7f9fc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-800 bg-[#070b16] px-4 pb-12 pt-10 text-white md:px-6 md:pb-14 md:pt-14">
        <div className="pointer-events-none absolute inset-0 opacity-25" aria-hidden="true">
          <div className="absolute left-[8%] top-[24%] h-px w-[84%] bg-[#60a5fa]" />
          <div className="absolute left-[18%] top-[58%] h-px w-[64%] bg-[#34d399]" />
          <div className="absolute left-[20%] top-[calc(24%-7px)] h-4 w-4 rounded-full border-2 border-[#93c5fd] bg-[#070b16]" />
          <div className="absolute left-[48%] top-[calc(24%-7px)] h-4 w-4 rounded-full border-2 border-[#c4b5fd] bg-[#070b16]" />
          <div className="absolute right-[19%] top-[calc(58%-7px)] h-4 w-4 rounded-full border-2 border-[#6ee7b7] bg-[#070b16]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-bold text-slate-200">
            <Atom className="h-4 w-4 text-[#93c5fd]" />
            <span className="sm:hidden">Independent. Simulator-first. No public hardware.</span>
            <span className="hidden sm:inline">Independent personal project. Not an official Google product. Simulator-first. No public quantum-hardware access.</span>
          </div>

          <div className="mt-8 max-w-4xl">
            <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-black leading-[0.92] text-white">
              Quantum Foundry
            </h1>
            <p className="mt-6 max-w-3xl text-[clamp(1.35rem,3vw,2.35rem)] font-semibold leading-tight text-slate-100">
              Understand the quantum platform. Explore the software. Test an idea.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              An independent, simulator-first lab for learning how classical computing, quantum
              software, and quantum processors work together.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/series"
              className="inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <BookOpen className="h-4 w-4" />
              Explore the series
            </Link>
            <Link
              href="/learn/quantum-software-stack"
              className="inline-flex items-center gap-2 border border-slate-500 bg-slate-900/80 px-5 py-3 text-sm font-bold text-white transition hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Explore the software stack
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 px-3 py-3 text-sm font-bold text-slate-300 underline decoration-slate-500 underline-offset-4 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Start an assessment
            </Link>
          </div>

          <div className="mt-8 hidden max-w-3xl border-l-2 border-[#34d399] pl-4 text-sm leading-7 text-slate-300 sm:block">
            <strong className="text-white">Trust rule:</strong> AI can assist with explanation and
            generation. Deterministic checks and evidence control strong claims.
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-7 max-w-7xl px-4 md:px-6" aria-labelledby="entry-paths-title">
        <div className="border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.14)] md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-[#2563eb]">Choose your starting point</div>
              <h2 id="entry-paths-title" className="mt-2 text-2xl font-black text-slate-950">
                Three ways into Quantum Foundry
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Read an idea, inspect the software around it, or bring a real problem into a
              readiness and Algorithm Contract flow.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {ENTRY_PATHS.map((path) => {
              const Icon = path.icon;
              return (
                <article key={path.title} className="border border-slate-200 bg-[#fbfdff] p-5">
                  <div className={`grid h-11 w-11 place-items-center border ${TONE_CLASSES[path.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-slate-950">{path.title}</h3>
                  <p className="mt-3 min-h-[84px] text-sm leading-7 text-slate-600">{path.description}</p>
                  <Link href={path.href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#2563eb]">
                    {path.action}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>

          <ContinueJourneyCard />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6" aria-labelledby="journey-title">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <div className="text-xs font-bold uppercase text-[#0f766e]">One connected journey</div>
            <h2 id="journey-title" className="mt-3 text-3xl font-black text-slate-950">
              Learn, then make the evidence do some work
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Assess remains the spine for serious work. Learn and Explore make the assessment
              understandable; Build and Map preserve its baseline, assumptions, horizon, and trust labels.
            </p>
          </div>

          <ol className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-5">
            {JOURNEY.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="bg-white p-4">
                  <Link href={item.href} className="block h-full">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-[#2563eb]" />
                      <span className="text-xs font-bold text-slate-400">0{index + 1}</span>
                    </div>
                    <div className="mt-8 font-black text-slate-950">{item.label}</div>
                    <div className="mt-2 text-xs leading-6 text-slate-600">{item.description}</div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16" aria-labelledby="primer-title">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#6d28d9]">
                <BrainCircuit className="h-4 w-4" />
                Primer
              </div>
              <h2 id="primer-title" className="mt-3 text-3xl font-black text-slate-950">
                Core quantum concepts
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Enough technical footing to understand what a simulator result says, what it does
                not say, and why today-versus-future maturity belongs in every recommendation.
              </p>
            </div>
            <div className="border-l-2 border-[#f59e0b] pl-4 text-sm leading-7 text-slate-600">
              Grover&apos;s algorithm can reduce the number of oracle checks needed for an unstructured
              search from roughly N to roughly sqrt(N). A suitable reversible oracle must exist,
              and the cost of building the oracle and loading the data still matters.
            </div>
          </div>

          <div className="mt-8 grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-3">
            {CONCEPTS.map((concept) => {
              const Icon = concept.icon;
              return (
                <article key={concept.title} className="bg-[#fbfdff] p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">{concept.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{concept.summary}</p>
                  <details className="mt-4 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-600">
                    <summary className="cursor-pointer font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">
                      Deeper detail
                    </summary>
                    <p className="pt-3">{concept.detail}</p>
                  </details>
                  <Link href={concept.href} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                    Open lesson
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              );
            })}

            <article className="bg-[#0b1220] p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center border border-slate-600 text-[#6ee7b7]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black">Try Tutorial mode</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Coin flip, Bell pair, and Grover toy search run without an assessment. Every result
                stays labeled Tutorial or Toy simulation and is not a business recommendation.
              </p>
              <Link href="/build?mode=tutorial&starter=coin_flip" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#93c5fd]">
                Open Tutorial mode
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6" aria-labelledby="companion-title">
        <div className="grid gap-8 border border-slate-200 bg-[#0b1220] p-6 text-white md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#6ee7b7]">
              <GitBranch className="h-4 w-4" />
              Companion lab
            </div>
            <h2 id="companion-title" className="mt-3 text-3xl font-black">
              Beyond the Quantum Processor
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              The article series follows the systems around a processor: problem formulation,
              classical baselines, orchestration, simulation, controls, evidence, and the decisions
              that determine whether an experiment should exist at all.
            </p>
            <Link href="/series" className="mt-6 inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-bold text-white">
              Explore the series
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {[
              "Curiosity-first at the public front door",
              "Contract-first before serious Build artifacts",
              "Hybrid, simulation-first, and trust-first by default",
              "AI-assisted explanation; deterministic decisions",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 border border-slate-700 bg-slate-950/50 p-3 text-sm leading-6 text-slate-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

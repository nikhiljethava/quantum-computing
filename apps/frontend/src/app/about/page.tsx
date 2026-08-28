import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HardwareAccessNote } from "@/components/HardwareAccessNote";

export const metadata: Metadata = {
  title: "About",
  description:
    "Quantum Foundry is an independent personal project for learning quantum concepts, simulating Cirq-based circuits, exploring use cases, and mapping hybrid workflows to Google Cloud architecture patterns.",
  openGraph: {
    title: "About | Quantum Foundry",
    description:
      "Quantum Foundry is an independent personal project for learning quantum concepts, simulating Cirq-based circuits, exploring use cases, and mapping hybrid workflows to Google Cloud architecture patterns.",
  },
  alternates: {
    canonical: "/about",
  },
};

const sections = [
  {
    title: "What the app helps you do",
    items: [
      "Learn quantum concepts",
      "Explore industry use cases",
      "Assess readiness with transparent heuristics",
      "Build and simulate Cirq-based circuits",
      "Map hybrid workflows to Google Cloud architecture patterns",
      "Save or export educational artifacts",
    ],
  },
  {
    title: "What this app is not",
    items: [
      "Not an official Google product",
      "Not sponsored, endorsed, reviewed, or maintained by Google",
      "Not public access to Google quantum hardware",
      "Not a production quantum-computing service",
      "Not a claim of quantum advantage",
      "Not legal, financial, security, or scientific advice",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
          About
        </div>
        <h1 className="mt-3 text-[clamp(2.25rem,5vw,4rem)] font-black tracking-[-0.05em] text-slate-950">
          About Quantum Foundry
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-700">
          Quantum Foundry is an independent personal project created by Nikhil Jethava to make
          quantum computing easier to learn, explore, and prototype. It is not an official Google product
          and is not affiliated with, sponsored by, endorsed by, or maintained by Google LLC.
        </p>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_14px_36px_rgba(60,64,67,0.14)]">
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">{section.title}</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-700">
              {section.items.map((item) => (
                <li key={item} className="rounded-[18px] bg-[#f8fbff] px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_14px_36px_rgba(60,64,67,0.14)]">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">Technologies used</h2>
        <p className="mt-4 text-sm leading-8 text-slate-700">
          Quantum Foundry uses publicly available technologies and services where applicable,
          including Google Cloud, Cirq, qsim, OpenFermion, Cloud Run, Cloud SQL, Cloud Storage,
          Cloud Tasks, and Vertex AI/Gemini-related workflows if configured.
        </p>
      </section>

      <section className="mt-6">
        <HardwareAccessNote />
      </section>

      <section className="mt-6 rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_14px_36px_rgba(60,64,67,0.14)]">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Trademark and attribution
        </h2>
        <p className="mt-4 text-sm leading-8 text-slate-700">
          Google, Google Cloud, GCP, Vertex AI, Gemini, Cirq, qsim, OpenFermion, and related names
          are trademarks or products of their respective owners. References in this project are descriptive.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_14px_36px_rgba(60,64,67,0.14)]">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">Links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://github.com/nikhiljethava/quantum-computing"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-4 py-2.5 text-sm font-bold text-white"
          >
            GitHub repo
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/nikhiljethava/quantum-computing/tree/main/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-[#f8fbff] px-4 py-2.5 text-sm font-bold text-[#1967d2]"
          >
            Documentation index
          </a>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            Start learning
          </Link>
        </div>
      </section>
    </div>
  );
}

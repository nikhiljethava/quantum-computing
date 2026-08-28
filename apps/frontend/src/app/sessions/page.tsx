import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import SessionsClient from "./SessionsClient";

const description =
  "Quantum Foundry is an independent personal project for learning quantum concepts, simulating Cirq-based circuits, exploring use cases, and mapping hybrid workflows to Google Cloud architecture patterns.";

const sessionCards = [
  {
    title: "Resume learning",
    copy: "Continue a structured learning path from the Quantum Academy.",
    cta: "Open Academy",
    href: "/learn",
  },
  {
    title: "Reopen a circuit run",
    copy: "Return to Algorithm Experiment Workspace results, histograms, and generated code.",
    cta: "Open experiment workspace",
    href: "/build",
  },
  {
    title: "Review an assessment",
    copy: "Revisit readiness notes, blockers, evidence, and recommended next steps.",
    cta: "Assess a use case",
    href: "/assess",
  },
];

export const metadata: Metadata = {
  title: "Saved Sessions | Quantum Foundry",
  description,
  openGraph: {
    title: "Saved Sessions | Quantum Foundry",
    description,
  },
  alternates: {
    canonical: "/sessions",
  },
};

export default function SessionsPage() {
  return (
    <>
      <section className="mx-auto max-w-[1460px] px-4 pt-10 md:px-6">
        <div className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
              Workspace memory
            </div>
            <h1 className="mt-3 text-[clamp(2.25rem,5vw,4rem)] font-black tracking-[-0.05em] text-slate-950">
              Saved Sessions
            </h1>
            <p className="mt-4 text-xl font-semibold leading-8 text-slate-700">
              Reopen previous learning, assessment, and simulation work.
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              Saved sessions are intended to help you return to earlier learning journeys, Algorithm Experiment Workspace
              runs, readiness assessments, and architecture maps.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {sessionCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[26px] border border-[#d8e2f3] bg-white/85 p-5 shadow-[0_14px_36px_rgba(60,64,67,0.12)]"
              >
                <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.copy}</p>
                <Link
                  href={card.href}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-4 py-2.5 text-sm font-bold text-white"
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-[22px] border border-[#fce8b2] bg-[#fef7e0] px-4 py-3 text-sm leading-7 text-[#8a4b00]">
            Session persistence may vary by deployment. Sign-in or backend persistence may be
            required for cross-device history.
          </div>
        </div>
      </section>
      <SessionsClient />
    </>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Assess Quantum Readiness",
  description:
    "Use a transparent QALS-lite heuristic to turn a quantum use case into a decision-style recommendation and next 90-day plan.",
  openGraph: {
    title: "Assess Quantum Readiness | GCP Quantum Foundry",
    description:
      "Decision-style recommendations for simulation-first quantum exploration.",
  },
  alternates: {
    canonical: "/assess",
  },
};

export default function AssessLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <section className="mx-auto max-w-[1280px] px-4 pt-8 md:px-6">
        <div className="rounded-[28px] border border-[#d8e2f3] bg-white/95 p-5 shadow-[0_18px_44px_rgba(148,163,184,0.16)]">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
            Public decision context
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            What QALS-lite means
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Assess uses deterministic heuristics to recommend Classical now, Hybrid pilot now,
            Watchlist, or Research only. It is an explainable readiness aid, not a quantum
            advantage claim and not a replacement for benchmark evidence.
          </p>
        </div>
      </section>
      {children}
    </>
  );
}

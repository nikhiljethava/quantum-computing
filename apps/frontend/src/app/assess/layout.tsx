import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Readiness and Algorithm Contract",
  description:
    "Use the deterministic QALS 3.0 Algorithm Contract assessment to produce an evidence-backed verdict, horizon, and next decision.",
  openGraph: {
    title: "Readiness and Algorithm Contract | Quantum Foundry",
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
          <div className="mt-2 text-2xl font-black text-slate-950">
            Deterministic decision context
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Assess uses deterministic rules and evidence to produce a verdict, Algorithm Contract,
            confidence, time horizon, build eligibility, missing evidence, and trust labels. It is
            not an ML model, advantage predictor, probability of success, or guaranteed ROI score.
          </p>
        </div>
      </section>
      {children}
    </>
  );
}

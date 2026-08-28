import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Reference and Cloud Implementation Map",
  description:
    "Compare a vendor-neutral contract workflow with one clearly labeled Google Cloud implementation example.",
  openGraph: {
    title: "Reference and Cloud Implementation Map | Quantum Foundry",
    description:
      "Explain hybrid quantum-classical architecture with Google Cloud services and honest hardware guardrails.",
  },
  alternates: {
    canonical: "/map",
  },
};

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <section className="mx-auto max-w-[1460px] px-4 pt-8 md:px-6">
        <div className="rounded-[28px] border border-[#d8e2f3] bg-white/95 p-5 shadow-[0_18px_44px_rgba(148,163,184,0.16)]">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
            Public architecture context
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            Hybrid quantum-classical architecture
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Map follows the attached Algorithm Contract. Optimization, chemistry/materials, and
            search show their distinct classical and simulated-quantum steps. PQC shows a purely
            classical migration workflow with no circuit or QPU node. Optional hardware remains
            access-controlled and future-only where applicable.
            The reference view is vendor-neutral; the cloud view is one implementation example,
            not an official Google quantum product or universal reference architecture.
          </p>
        </div>
      </section>
      {children}
    </>
  );
}

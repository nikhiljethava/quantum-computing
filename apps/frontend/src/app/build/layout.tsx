import type { Metadata } from "next";
import type { ReactNode } from "react";

import { HardwareAccessNote } from "@/components/HardwareAccessNote";

export const metadata: Metadata = {
  title: "Algorithm Experiment Workspace",
  description:
    "Run educational Cirq tutorials or open assessment-backed Contract mode with shared result trust.",
  openGraph: {
    title: "Build | Quantum Foundry",
    description:
      "Use a simulator-first Algorithm Experiment Workspace and map results to hybrid workflows.",
  },
  alternates: {
    canonical: "/build",
  },
};

export default function BuildLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <section className="mx-auto max-w-[1460px] px-4 pt-4 md:px-6">
        <div className="grid gap-3 rounded-[24px] border border-[#d8e2f3] bg-white/95 p-4 shadow-[0_14px_34px_rgba(148,163,184,0.14)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)] lg:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
              Algorithm Experiment Workspace
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Tutorial mode runs educational Cirq examples without an assessment. Contract mode
              requires an assessment, Algorithm Contract, declared baseline, and Experiment Bundle.
              Interactive results remain simulator-first with visible trust and educational-noise labels.
            </p>
          </div>
          <HardwareAccessNote />
        </div>
      </section>
      {children}
    </>
  );
}

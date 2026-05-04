import type { Metadata } from "next";
import type { ReactNode } from "react";

import { HardwareAccessNote } from "@/components/HardwareAccessNote";

export const metadata: Metadata = {
  title: "Cirq Lab",
  description:
    "Build and run Cirq-based circuits, inspect histograms, optional qsim fallback, educational noise, and Colab exports.",
  openGraph: {
    title: "Cirq Lab | Quantum Foundry",
    description:
      "Run simulator-first Cirq labs and map the results to Google Cloud hybrid workflows.",
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
              What the Cirq Lab does
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Run Cirq templates, inspect histograms and metrics, compare educational
              noise, try optional qsim fallback, and export a runnable Google Colab notebook.
            </p>
          </div>
          <HardwareAccessNote />
        </div>
      </section>
      {children}
    </>
  );
}

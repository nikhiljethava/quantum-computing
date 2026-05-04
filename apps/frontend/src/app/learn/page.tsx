import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";

import { GCard } from "@/components/ui/GCard";
import { GChip } from "@/components/ui/GChip";
import { GSectionHeader } from "@/components/ui/GSectionHeader";
import { LESSON_PATHS, getLessonsByPath } from "@/content/lessons";

export const metadata: Metadata = {
  title: "Quantum Academy",
  description:
    "Learn quantum concepts with Cirq, qsim, OpenFermion, Google Colab, and Google Cloud learning paths.",
  openGraph: {
    title: "Quantum Academy | Quantum Foundry",
    description:
      "Structured quantum learning paths connected to runnable Cirq-based labs.",
  },
  alternates: {
    canonical: "/learn",
  },
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <GSectionHeader eyebrow="Learn" title="Quantum Academy">
            Learn quantum concepts, build Cirq circuits, simulate with publicly available tools,
            and map workloads to Google Cloud. The path is intentionally practical:
            understand the idea, run a small lab, then decide what belongs in a pilot.
          </GSectionHeader>
          <GCard className="bg-white/85">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1967d2]">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Suggested first step</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Start with qubits, then run your first Cirq circuit in Build.
                </p>
              </div>
            </div>
            <Link
              href="/learn/beginner/what-is-a-qubit"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-4 py-2.5 text-sm font-bold text-white"
            >
              Start beginner path
              <ArrowRight className="h-4 w-4" />
            </Link>
          </GCard>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {LESSON_PATHS.map((path) => {
          const lessons = getLessonsByPath(path.path);
          const totalMinutes = lessons.reduce((total, item) => total + item.estimatedMinutes, 0);

          return (
            <GCard key={path.path} className="flex min-h-[290px] flex-col justify-between">
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <GChip tone={path.level === "beginner" ? "green" : "blue"}>{path.level}</GChip>
                  <GChip tone="neutral">{lessons.length} lessons</GChip>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                    {path.title}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#1967d2]">{path.subtitle}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{path.description}</p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  About {totalMinutes} minutes
                </div>
              </div>
              <Link
                href={`/learn/${path.path}`}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-[#f8fbff] px-4 py-2.5 text-sm font-bold text-[#1967d2]"
              >
                Start path
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GCard>
          );
        })}
      </section>
    </div>
  );
}

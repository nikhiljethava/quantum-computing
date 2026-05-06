import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ProjectsClient from "./ProjectsClient";

const description =
  "Quantum Foundry is an independent personal project for learning quantum concepts, simulating Cirq-based circuits, exploring use cases, and mapping hybrid workflows to Google Cloud architecture patterns.";

const projectCards = [
  {
    title: "Use-case workspace",
    copy: "Group an industry use case, readiness assessment, related Cirq runs, and architecture notes.",
    cta: "Explore use cases",
    href: "/explore",
  },
  {
    title: "Circuit lab project",
    copy: "Save circuit templates, simulation outputs, histograms, and Colab exports.",
    cta: "Open Cirq Lab",
    href: "/build",
  },
  {
    title: "Architecture project",
    copy: "Map hybrid quantum-classical experiments to Google Cloud architecture patterns.",
    cta: "Map architecture",
    href: "/map",
  },
];

export const metadata: Metadata = {
  title: "Projects | Quantum Foundry",
  description,
  openGraph: {
    title: "Projects | Quantum Foundry",
    description,
  },
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsPage() {
  return (
    <>
      <section className="mx-auto max-w-[1460px] px-4 pt-10 md:px-6">
        <div className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1967d2]">
              Workspace library
            </div>
            <h1 className="mt-3 text-[clamp(2.25rem,5vw,4rem)] font-black tracking-[-0.05em] text-slate-950">
              Projects
            </h1>
            <p className="mt-4 text-xl font-semibold leading-8 text-slate-700">
              Organize quantum learning work into reusable project spaces.
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              Projects are intended to collect related assessments, circuit runs, architecture maps,
              and exported artifacts into one workspace. Use them to keep track of a learning path,
              a use-case exploration, or a prototype workflow.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {projectCards.map((card) => (
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
            Project persistence may depend on the current deployment configuration. Anonymous
            sessions may be local or temporary.
          </div>
        </div>
      </section>
      <ProjectsClient />
    </>
  );
}

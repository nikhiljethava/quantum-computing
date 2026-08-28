import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, GitBranch, ShieldCheck } from "lucide-react";

import { AnalyticsEvent } from "@/components/analytics/AnalyticsEvent";
import { SERIES_ARTICLES } from "@/content/series";

export const metadata: Metadata = {
  title: "Beyond the Quantum Processor Series",
  description:
    "Interactive companions about the software, hybrid runtime, evidence, and decisions around quantum processors.",
  alternates: { canonical: "/series" },
};

export default function SeriesPage() {
  return (
    <div className="bg-[#f7f9fc] text-slate-950">
      <AnalyticsEvent event="series_hub_viewed" context="series" />

      <header className="border-b border-slate-800 bg-[#070b16] px-4 py-14 text-white md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 border border-slate-700 px-3 py-2 text-xs font-black text-slate-200">
            <BookOpen className="h-4 w-4 text-[#93c5fd]" />
            Beyond the Quantum Processor
          </div>
          <div className="mt-8 max-w-5xl">
            <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.94]">Explore the ideas around the processor</h1>
            <p className="mt-7 max-w-3xl text-xl leading-9 text-slate-200">
              Read a one-minute summary, inspect an interactive system, try a guided simulator example, and carry the idea into an evidence-backed assessment.
            </p>
          </div>
          <p className="mt-8 max-w-3xl border-l-2 border-[#34d399] pl-4 text-sm leading-7 text-slate-300">
            Independent personal project. Not an official Google product. Simulator-first. No public quantum-hardware access.
          </p>
        </div>
      </header>

      <div>
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6" aria-labelledby="series-list-title">
          <div className="grid gap-6 lg:grid-cols-[0.6fr_1.4fr] lg:items-start">
            <div>
              <div className="text-xs font-black uppercase text-[#2563eb]">Available companions</div>
              <h2 id="series-list-title" className="mt-3 text-3xl font-black text-slate-950">Start with Articles 1 and 2</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Each companion remains understandable without interaction and clearly separates tutorials, estimates, and hardware-gated ideas.
              </p>
            </div>

            <div className="grid gap-4">
              {SERIES_ARTICLES.map((article) => (
                <article key={article.slug} className="grid gap-5 border border-slate-200 bg-white p-6 md:grid-cols-[84px_1fr_auto] md:items-center">
                  <div className="grid h-20 w-20 place-items-center border border-[#bfdbfe] bg-[#eff6ff] text-3xl font-black text-[#1d4ed8]">
                    {String(article.sequence).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-[#0f766e]">Interactive companion</div>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">{article.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{article.summary}</p>
                  </div>
                  <Link
                    href={`/series/${article.slug}`}
                    className="inline-flex w-fit items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]"
                  >
                    Open companion <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-12" aria-labelledby="series-journey-title">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="max-w-3xl">
              <div className="text-xs font-black uppercase text-[#7c3aed]">One connected journey</div>
              <h2 id="series-journey-title" className="mt-3 text-3xl font-black text-slate-950">
                Read, inspect, try, assess, decide
              </h2>
            </div>
            <ol className="mt-8 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Read", "Start with the article or one-minute summary", BookOpen],
                ["Understand", "Explore the platform or hybrid workflow", GitBranch],
                ["Try", "Run a tutorial or toy simulation", FlaskConical],
                ["Assess", "Create the full Algorithm Contract", ShieldCheck],
                ["Decide", "Export an evidence-backed next action", ArrowRight],
              ].map(([label, description, Icon], index) => (
                <li key={String(label)} className="bg-[#fbfdff] p-5">
                  <Icon className="h-5 w-5 text-[#2563eb]" />
                  <div className="mt-4 text-xs font-black text-slate-400">{String(index + 1).padStart(2, "0")}</div>
                  <div className="mt-1 font-black text-slate-950">{String(label)}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{String(description)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="grid gap-6 border border-slate-200 bg-[#070b16] p-7 text-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="text-xs font-black uppercase text-[#6ee7b7]">Bring your own problem</div>
              <h2 className="mt-3 text-3xl font-black">Move from an idea to a contract shape</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Quick Assessment identifies likely structure and missing evidence. Serious Build remains gated by the full deterministic QALS 3.0 contract.
              </p>
            </div>
            <Link href="/assess?level=quick&source=series-01&problemClass=UNKNOWN&goal=learning" className="inline-flex items-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-black text-white">
              Start Quick Assessment <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

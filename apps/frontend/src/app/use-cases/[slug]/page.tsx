import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FlaskConical, GitBranch, Play } from "lucide-react";

import { GoogleStackBadges } from "@/components/GoogleStackBadges";
import { GuidePanel } from "@/components/GuidePanel";
import { HardwareAccessNote } from "@/components/HardwareAccessNote";
import { GButtonLink } from "@/components/ui/GButton";
import { GCard } from "@/components/ui/GCard";
import { GChip } from "@/components/ui/GChip";
import { GMaturityBadge } from "@/components/ui/GMaturityBadge";
import { GSectionHeader } from "@/components/ui/GSectionHeader";
import { USE_CASE_PAGES, getUseCasePage } from "@/content/use-case-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return USE_CASE_PAGES.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCasePage(slug);

  return {
    title: useCase ? `${useCase.title} | Quantum Foundry` : "Use Case",
    description: useCase
      ? `Learn how ${useCase.title} maps to Cirq simulation and Google Cloud hybrid workflows.`
      : undefined,
    openGraph: {
      title: useCase ? `${useCase.title} | Quantum Foundry` : "Use Case",
      description: useCase?.valueProposition,
    },
    alternates: {
      canonical: `/use-cases/${slug}`,
    },
  };
}

export default async function UseCaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const useCase = getUseCasePage(slug);
  if (!useCase) notFound();

  const primaryLab = useCase.recommendedLabs[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="grid gap-6">
          <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <GChip tone="blue">{useCase.industry}</GChip>
              <GMaturityBadge label={useCase.maturityLabel} />
            </div>
            <GSectionHeader eyebrow="Industry Atlas" title={useCase.title}>
              {useCase.valueProposition}
            </GSectionHeader>
            <div className="mt-6 flex flex-wrap gap-3">
              {primaryLab ? (
                <GButtonLink href={`/build?starter=${primaryLab.starter}&use_case_slug=${useCase.slug}`}>
                  <Play className="h-4 w-4" />
                  Run related lab
                </GButtonLink>
              ) : null}
              <GButtonLink
                tone="secondary"
                href={`/assess?use_case_slug=${useCase.slug}${primaryLab ? `&starter=${primaryLab.starter}` : ""}`}
              >
                <FlaskConical className="h-4 w-4" />
                Assess this use case
              </GButtonLink>
              <GButtonLink tone="ghost" href={`/map${primaryLab ? `?starter=${primaryLab.starter}` : ""}`}>
                <GitBranch className="h-4 w-4" />
                Map to Google Cloud
              </GButtonLink>
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <GCard>
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                Business problem
              </h2>
              <p className="mt-3 text-sm leading-8 text-slate-700">{useCase.businessProblem}</p>
            </GCard>
            <GCard>
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                Classical baseline
              </h2>
              <p className="mt-3 text-sm leading-8 text-slate-700">{useCase.classicalBaseline}</p>
            </GCard>
          </div>

          <GCard>
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
              Quantum approach
            </h2>
            <p className="mt-3 text-sm leading-8 text-slate-700">{useCase.quantumApproach}</p>
            <div className="mt-5">
              <GoogleStackBadges items={useCase.googleStack} />
            </div>
          </GCard>

          <div className="grid gap-5 md:grid-cols-2">
            <GCard>
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                What you can simulate today
              </h2>
              <ul className="mt-4 grid gap-3">
                {useCase.simulateToday.map((item) => (
                  <li key={item} className="rounded-[18px] bg-[#e6f4ea] px-4 py-3 text-sm leading-7 text-[#137333]">
                    {item}
                  </li>
                ))}
              </ul>
            </GCard>
            <GCard>
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                What needs future hardware or approved access
              </h2>
              <ul className="mt-4 grid gap-3">
                {useCase.futureHardwarePath.map((item) => (
                  <li key={item} className="rounded-[18px] bg-[#fef7e0] px-4 py-3 text-sm leading-7 text-[#8a4b00]">
                    {item}
                  </li>
                ))}
              </ul>
            </GCard>
          </div>

          <GCard>
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">Evidence</h2>
            <div className="mt-4 grid gap-4">
              {useCase.evidence.map((item) => (
                <a
                  key={item.title}
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[22px] border border-[#d8e2f3] bg-[#f8fbff] p-4 transition hover:border-[#1967d2]"
                >
                  <div className="text-sm font-black text-slate-950">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.claim}</p>
                  <div className="mt-2 text-xs font-semibold text-slate-500">
                    {item.publisher} - {item.publishedAt}
                  </div>
                </a>
              ))}
            </div>
          </GCard>
        </main>

        <aside className="grid content-start gap-5">
          <HardwareAccessNote />
          <GuidePanel
            pageContext="explore"
            starterQuestion={`Reality-check ${useCase.title} for a simulation-first pilot.`}
          />
          <GCard>
            <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
              Recommended lessons
            </h2>
            <div className="mt-4 grid gap-2">
              {useCase.recommendedLessons.map((lesson) => (
                <Link
                  key={lesson.slug}
                  href={`/learn/${lesson.path}/${lesson.slug}`}
                  className="inline-flex items-center justify-between gap-3 rounded-[16px] border border-[#d8e2f3] bg-[#f8fbff] px-3 py-2 text-sm font-bold text-[#1967d2]"
                >
                  {lesson.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </GCard>
          <GCard>
            <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
              Google Cloud architecture path
            </h2>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-700">
              {useCase.architectureNotes.map((note) => (
                <li key={note} className="rounded-[18px] bg-[#f8fbff] px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
          </GCard>
        </aside>
      </div>
    </div>
  );
}

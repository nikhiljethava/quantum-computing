import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, Play } from "lucide-react";

import { GuidePanel } from "@/components/GuidePanel";
import { LessonExperience } from "@/components/learn/LessonExperience";
import { GButtonLink } from "@/components/ui/GButton";
import { GCard } from "@/components/ui/GCard";
import { GChip } from "@/components/ui/GChip";
import { GCodeBlock } from "@/components/ui/GCodeBlock";
import { GSectionHeader } from "@/components/ui/GSectionHeader";
import {
  LESSONS,
  getLesson,
  getNextLesson,
  isLessonPath,
} from "@/content/lessons";

type PageProps = {
  params: Promise<{ path: string; slug: string }>;
};

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ path: lesson.path, slug: lesson.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { path, slug } = await params;
  if (!isLessonPath(path)) return {};
  const lesson = getLesson(path, slug);

  return {
    title: lesson?.title ?? "Lesson",
    description: lesson?.subtitle,
    openGraph: {
      title: `${lesson?.title ?? "Lesson"} | Google Quantum Academy`,
      description: lesson?.subtitle,
    },
    alternates: {
      canonical: `/learn/${path}/${slug}`,
    },
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { path, slug } = await params;
  if (!isLessonPath(path)) notFound();

  const lesson = getLesson(path, slug);
  if (!lesson) notFound();

  const nextLesson = getNextLesson(lesson);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-5">
        <Link href={`/learn/${lesson.path}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#1967d2]">
          <ArrowLeft className="h-4 w-4" />
          Back to path
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="grid gap-6">
          <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <GChip tone="blue">{lesson.path}</GChip>
              <GChip tone={lesson.level === "beginner" ? "green" : "yellow"}>{lesson.level}</GChip>
              <GChip tone="neutral">
                <Clock3 className="h-3.5 w-3.5" />
                {lesson.estimatedMinutes} min
              </GChip>
            </div>
            <GSectionHeader eyebrow="Google Quantum Academy" title={lesson.title}>
              {lesson.subtitle}
            </GSectionHeader>

            {lesson.buildTemplateKey ? (
              <GButtonLink
                href={`/build?starter=${lesson.buildTemplateKey}&lesson=${lesson.slug}`}
                className="mt-6"
              >
                <Play className="h-4 w-4" />
                Run in Build
              </GButtonLink>
            ) : null}
          </section>

          <GCard>
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
              Learning objectives
            </h2>
            <ul className="mt-4 grid gap-3">
              {lesson.learningObjectives.map((item) => (
                <li key={item} className="rounded-[18px] bg-[#f8fbff] px-4 py-3 text-sm leading-7 text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </GCard>

          <GCard>
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
              Explanation
            </h2>
            <div className="mt-4 grid gap-4 text-sm leading-8 text-slate-700">
              {lesson.explanationMarkdown.split("\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </GCard>

          {lesson.cirqCode ? (
            <GCard>
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                Cirq code
              </h2>
              <div className="mt-4">
                <GCodeBlock code={lesson.cirqCode} />
              </div>
            </GCard>
          ) : null}

          <LessonExperience lesson={lesson} />
        </main>

        <aside className="grid content-start gap-5">
          <GuidePanel
            pageContext="learn"
            lessonSlug={lesson.slug}
            starterQuestion={`Explain ${lesson.title} in plain English.`}
          />

          <GCard>
            <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
              Related Google-native sources
            </h2>
            <div className="mt-4 grid gap-2">
              {lesson.googleSourceLinks.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[16px] border border-[#d8e2f3] bg-[#f8fbff] px-3 py-2 text-sm font-semibold text-[#1967d2]"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </GCard>

          {nextLesson ? (
            <GCard>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Next lesson
              </div>
              <h2 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">
                {nextLesson.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{nextLesson.subtitle}</p>
              <Link
                href={`/learn/${nextLesson.path}/${nextLesson.slug}`}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-4 py-2.5 text-sm font-bold text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GCard>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

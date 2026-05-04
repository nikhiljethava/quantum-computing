import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { GCard } from "@/components/ui/GCard";
import { GChip } from "@/components/ui/GChip";
import { GSectionHeader } from "@/components/ui/GSectionHeader";
import { LESSON_PATHS, getLessonsByPath, isLessonPath } from "@/content/lessons";

type PageProps = {
  params: Promise<{ path: string }>;
};

export function generateStaticParams() {
  return LESSON_PATHS.map((item) => ({ path: item.path }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { path } = await params;
  if (!isLessonPath(path)) return {};
  const meta = LESSON_PATHS.find((item) => item.path === path);

  return {
    title: meta?.title ?? "Learning Path",
    description: meta?.description,
    openGraph: {
      title: `${meta?.title ?? "Learning Path"} | Quantum Foundry`,
      description: meta?.description,
    },
    alternates: {
      canonical: `/learn/${path}`,
    },
  };
}

export default async function LearnPathPage({ params }: PageProps) {
  const { path } = await params;
  if (!isLessonPath(path)) notFound();

  const meta = LESSON_PATHS.find((item) => item.path === path);
  const lessons = getLessonsByPath(path);

  if (!meta) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#ffffff,#eef5ff)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] md:p-8">
        <GSectionHeader eyebrow="Learning path" title={meta.title}>
          {meta.description}
        </GSectionHeader>
        <div className="mt-5 flex flex-wrap gap-2">
          <GChip tone={meta.level === "beginner" ? "green" : "blue"}>{meta.level}</GChip>
          <GChip tone="neutral">{lessons.length} lessons</GChip>
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        {lessons.map((lesson, index) => (
          <GCard key={lesson.slug} className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0fe] text-lg font-black text-[#1967d2]">
              {index + 1}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                  {lesson.title}
                </h2>
                {lesson.buildTemplateKey ? (
                  <GChip tone="green">Runnable lab</GChip>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{lesson.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span>{lesson.estimatedMinutes} minutes</span>
                <span>{lesson.level}</span>
              </div>
            </div>
            <Link
              href={`/learn/${path}/${lesson.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1967d2] px-4 py-2.5 text-sm font-bold text-white"
            >
              Open lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
          </GCard>
        ))}
      </section>

      <GCard className="mt-8 bg-[#e6f4ea]">
        <div className="flex gap-3 text-[#137333]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-7">
            Progress is stored locally in this browser for now. Backend learning persistence can come later when auth is added.
          </p>
        </div>
      </GCard>
    </div>
  );
}

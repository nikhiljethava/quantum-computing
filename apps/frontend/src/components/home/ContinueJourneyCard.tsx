"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FolderOpen } from "lucide-react";

import { LESSON_BY_SLUG } from "@/content/lessons";
import { useSessions } from "@/lib/hooks";
import { getLearningProgress } from "@/lib/learning-progress";

function subscribeToLearningProgress(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getLastLessonViewed() {
  return getLearningProgress().lastLessonViewed;
}

export function ContinueJourneyCard() {
  const lastLessonViewed = useSyncExternalStore(
    subscribeToLearningProgress,
    getLastLessonViewed,
    () => null,
  );
  const { data: sessions } = useSessions({ limit: 1 });

  const lesson = useMemo(() => {
    if (!lastLessonViewed) return null;
    const lastLesson = LESSON_BY_SLUG.get(lastLessonViewed);
    if (!lastLesson) return null;
    return {
      href: `/learn/${lastLesson.path}/${lastLesson.slug}`,
      label: lastLesson.title,
    };
  }, [lastLessonViewed]);

  const latestSession = useMemo(() => sessions?.items[0] ?? null, [sessions?.items]);

  if (!latestSession && !lesson) return null;

  return (
    <aside className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Continue your Quantum Foundry work">
      <div>
        <div className="text-xs font-bold uppercase text-slate-400">Welcome back</div>
        <div className="mt-1 text-sm font-semibold text-slate-800">
          Continue where you left off.
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {latestSession ? (
          <Link
            href={`/sessions?session_id=${latestSession.id}`}
            className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            <FolderOpen className="h-4 w-4" />
            Continue project
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
        {lesson ? (
          <Link
            href={lesson.href}
            className="inline-flex items-center gap-2 border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2.5 text-sm font-bold text-[#1d4ed8]"
          >
            <BookOpen className="h-4 w-4" />
            Resume {lesson.label}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

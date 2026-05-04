"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import type { Lesson } from "@/content/lessons";
import { getLearningProgress, markLessonComplete, setLastLessonViewed } from "@/lib/learning-progress";

function readSavedLessonState(slug: string) {
  const progress = getLearningProgress();
  return {
    completedAt: progress.completedLessons[slug] ?? null,
    savedScore: progress.quizScores[slug] ?? null,
  };
}

export function LessonExperience({ lesson }: { lesson: Lesson }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [completedAt, setCompletedAt] = useState<string | null>(
    () => readSavedLessonState(lesson.slug).completedAt,
  );
  const [savedScore, setSavedScore] = useState<number | null>(
    () => readSavedLessonState(lesson.slug).savedScore,
  );

  useEffect(() => {
    setLastLessonViewed(lesson.slug);
  }, [lesson.slug]);

  const score = useMemo(() => {
    if (!lesson.quiz.length) return 100;
    const correct = lesson.quiz.filter(
      (item, index) => selectedAnswers[index] === item.correctOptionIndex,
    ).length;
    return Math.round((correct / lesson.quiz.length) * 100);
  }, [lesson.quiz, selectedAnswers]);

  const answeredAll = lesson.quiz.every((_, index) => selectedAnswers[index] !== undefined);

  function completeLesson() {
    const nextProgress = markLessonComplete(lesson.slug, score);
    setCompletedAt(nextProgress.completedLessons[lesson.slug] ?? new Date().toISOString());
    setSavedScore(score);
  }

  return (
    <section className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_44px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#1967d2]">
            Lesson check
          </div>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
            Quick quiz
          </h2>
        </div>
        {completedAt ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f4ea] px-3 py-2 text-xs font-bold text-[#137333]">
            <CheckCircle2 className="h-4 w-4" />
            Complete {savedScore !== null ? `${savedScore}%` : ""}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4">
        {lesson.quiz.map((item, index) => {
          const selected = selectedAnswers[index];
          const isAnswered = selected !== undefined;
          const isCorrect = selected === item.correctOptionIndex;

          return (
            <div key={item.question} className="rounded-[22px] border border-[#d8e2f3] bg-[#f8fbff] p-4">
              <div className="text-sm font-bold text-slate-900">{item.question}</div>
              <div className="mt-3 grid gap-2">
                {item.options.map((option, optionIndex) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setSelectedAnswers((current) => ({ ...current, [index]: optionIndex }))
                    }
                    className={`rounded-[16px] border px-3 py-2 text-left text-sm transition ${
                      selected === optionIndex
                        ? "border-[#1967d2] bg-[#e8f0fe] text-[#174ea6]"
                        : "border-[#d8e2f3] bg-white text-slate-600 hover:border-[#1967d2]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {isAnswered ? (
                <div
                  className={`mt-3 rounded-[16px] px-3 py-2 text-xs leading-6 ${
                    isCorrect ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#fef7e0] text-[#8a4b00]"
                  }`}
                >
                  {item.explanation}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!answeredAll}
        onClick={completeLesson}
        className="mt-5 w-full rounded-full bg-[#1967d2] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {answeredAll ? `Mark complete (${score}%)` : "Answer the quiz to complete"}
      </button>
    </section>
  );
}

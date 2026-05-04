const STORAGE_KEY = "gcp_quantum_foundry_learning_progress";

export type LearningProgress = {
  completedLessons: Record<string, string>;
  quizScores: Record<string, number>;
  lastLessonViewed: string | null;
};

const EMPTY_PROGRESS: LearningProgress = {
  completedLessons: {},
  quizScores: {},
  lastLessonViewed: null,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getLearningProgress(): LearningProgress {
  if (!canUseStorage()) return EMPTY_PROGRESS;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_PROGRESS;

  try {
    return { ...EMPTY_PROGRESS, ...JSON.parse(raw) } as LearningProgress;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveLearningProgress(progress: LearningProgress): LearningProgress {
  if (!canUseStorage()) return progress;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function setLastLessonViewed(slug: string): LearningProgress {
  const progress = getLearningProgress();
  return saveLearningProgress({ ...progress, lastLessonViewed: slug });
}

export function markLessonComplete(slug: string, quizScore: number): LearningProgress {
  const progress = getLearningProgress();
  return saveLearningProgress({
    ...progress,
    completedLessons: {
      ...progress.completedLessons,
      [slug]: new Date().toISOString(),
    },
    quizScores: {
      ...progress.quizScores,
      [slug]: quizScore,
    },
    lastLessonViewed: slug,
  });
}

export function isLessonCompleted(slug: string): boolean {
  return Boolean(getLearningProgress().completedLessons[slug]);
}

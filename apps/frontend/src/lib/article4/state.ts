export const LESSON_IDS = [
  "sampling", "scheduling", "transmon", "ions", "routing", "blockade",
  "photonics", "loss", "phase", "entanglement",
] as const;
export type LessonId = typeof LESSON_IDS[number];
export type Level = 100 | 400;
export const ARTICLE4_PATH = "/series/04-qubit-technologies";

export interface Article4Query { lessonId: LessonId; level: Level; usedDefaults: boolean }

export function isLessonId(value: unknown): value is LessonId {
  return typeof value === "string" && (LESSON_IDS as readonly string[]).includes(value);
}

/** Duplicate values fail closed, including two identical occurrences. */
export function parseArticle4Query(params: Pick<URLSearchParams, "getAll">): Article4Query {
  const lessons = params.getAll("lesson");
  const levels = params.getAll("level");
  const validLesson = lessons.length === 1 && isLessonId(lessons[0]);
  const validLevel = levels.length === 1 && (levels[0] === "100" || levels[0] === "400");
  return {
    lessonId: validLesson ? lessons[0] as LessonId : "sampling",
    level: validLevel && levels[0] === "400" ? 400 : 100,
    usedDefaults: !validLesson || !validLevel,
  };
}

/** Share lesson/level only: this does not encode saved observations or inputs. */
export function article4LessonPath(lessonId: LessonId, level: Level): string {
  const safeLesson = isLessonId(lessonId) ? lessonId : "sampling";
  const safeLevel = level === 400 ? 400 : 100;
  return `${ARTICLE4_PATH}?lesson=${safeLesson}&level=${safeLevel}`;
}

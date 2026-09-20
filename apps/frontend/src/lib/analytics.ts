import { recordUsage } from "@/lib/api";

export type Article4Event =
  | "article4_lesson_open"
  | "article4_mode_change"
  | "article4_note_export";

export type Article4LessonId =
  | "sampling"
  | "scheduling"
  | "transmon"
  | "ions"
  | "routing"
  | "blockade"
  | "photonics"
  | "loss"
  | "phase"
  | "entanglement";

export interface Article4EventContext {
  lesson?: Article4LessonId;
  mode?: "watch" | "steps" | "explore";
  level?: 100 | 400;
  format?: "json" | "markdown";
}

export type ProductEvent =
  | "series_hub_viewed"
  | "article_companion_viewed"
  | "companion_layer_opened"
  | "guided_example_started"
  | "guided_example_completed"
  | "quick_assessment_started"
  | "quick_assessment_completed"
  | "full_contract_started"
  | "contract_created"
  | "experiment_started"
  | "experiment_completed"
  | "decision_brief_exported"
  | "return_to_article_clicked"
  | Article4Event;

const VISITOR_STORAGE_KEY = "qf_visitor_id";
const EVENT_PATH_PREFIX = "/__events__/";

function getOrCreateVisitorId(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;

  const visitorId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  return visitorId;
}

function safeContext(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function trackProductEvent(event: ProductEvent, context?: string): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;
    const normalizedContext = safeContext(context);
    const pagePath = `${EVENT_PATH_PREFIX}${event}${normalizedContext ? `/${normalizedContext}` : ""}`;
    await recordUsage({ page_path: pagePath, visitor_id: visitorId });
  } catch {
    // Storage access and network failures must never block any user workflow.
  }
}

const ARTICLE4_EVENTS: ReadonlySet<string> = new Set([
  "article4_lesson_open", "article4_mode_change", "article4_note_export",
]);
const ARTICLE4_LESSONS: ReadonlySet<string> = new Set([
  "sampling", "scheduling", "transmon", "ions", "routing", "blockade",
  "photonics", "loss", "phase", "entanglement",
]);
const ARTICLE4_MODES: ReadonlySet<string> = new Set(["watch", "steps", "explore"]);
const ARTICLE4_FORMATS: ReadonlySet<string> = new Set(["json", "markdown"]);

/** Only known lesson metadata is sent; inputs, records, and URLs are excluded. */
export async function trackArticle4Event(
  event: Article4Event,
  context: Article4EventContext = {},
): Promise<void> {
  if (!ARTICLE4_EVENTS.has(event)) return;
  const parts = ["article4-v9"];
  if (context.lesson && ARTICLE4_LESSONS.has(context.lesson)) parts.push(`lesson-${context.lesson}`);
  if (context.level === 100 || context.level === 400) parts.push(`level-${context.level}`);
  if (context.mode && ARTICLE4_MODES.has(context.mode)) parts.push(`mode-${context.mode}`);
  if (context.format && ARTICLE4_FORMATS.has(context.format)) parts.push(`format-${context.format}`);
  await trackProductEvent(event, parts.join("__"));
}

export function isAnalyticsEventPath(path: string): boolean {
  return path.startsWith(EVENT_PATH_PREFIX);
}

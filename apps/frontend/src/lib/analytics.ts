import { recordUsage } from "@/lib/api";

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
  | "return_to_article_clicked";

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
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return;
  const normalizedContext = safeContext(context);
  const pagePath = `${EVENT_PATH_PREFIX}${event}${normalizedContext ? `/${normalizedContext}` : ""}`;

  try {
    await recordUsage({ page_path: pagePath, visitor_id: visitorId });
  } catch {
    // Analytics must never block the learning, assessment, or experiment workflow.
  }
}

export function isAnalyticsEventPath(path: string): boolean {
  return path.startsWith(EVENT_PATH_PREFIX);
}

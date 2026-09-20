import type { ModelObservation } from "./models";
import type { LessonId } from "./state";

export const LEARNING_RECORD_NOTICE = "This learning record contains browser educational models. It is not a hardware benchmark or an approved Algorithm Contract. Watching a video does not create a measured result.";
export const LEARNING_RECORD_SESSION_NOTICE = "Saved examples remain in browser memory for this visit. Refreshing clears the record.";
export type SavedObservation = ModelObservation & {
  id: string;
  capturedAt: string;
  lessonId: LessonId;
  executionKind: "browser educational model";
};
export interface LearningRecord {
  schemaVersion: "1.0.0";
  articleId: "series-04";
  articleRevision: "article4-v9";
  companionVersion: "1.0.0";
  createdAt: string;
  notice: string;
  observations: readonly SavedObservation[];
}

function freezeSnapshot<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freezeSnapshot(child);
    Object.freeze(value);
  }
  return value;
}

function timestamp(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("A valid observation timestamp is required.");
  return date.toISOString();
}

export function createLearningRecord(createdAt = new Date().toISOString()): LearningRecord {
  return freezeSnapshot({ schemaVersion: "1.0.0", articleId: "series-04", articleRevision: "article4-v9", companionVersion: "1.0.0", createdAt: timestamp(createdAt), notice: LEARNING_RECORD_NOTICE, observations: [] });
}

const MODEL_LESSON: Record<ModelObservation["modelId"], LessonId> = {
  sampling: "sampling", scheduling: "scheduling", routing: "routing",
  "optics-phase": "photonics", "optics-loss": "loss",
};

export function saveObservation(record: LearningRecord, lessonId: LessonId, value: ModelObservation, capturedAt = new Date().toISOString()): LearningRecord {
  if (MODEL_LESSON[value.modelId] !== lessonId) throw new Error("This live model does not belong to the selected lesson.");
  const nextNumber = 1 + Math.max(0, ...record.observations.map((observation) => Number(observation.id.split("-").at(-1))));
  // Explicit fields prevent unrelated UI/application state from entering exports.
  const snapshot = structuredClone({
    id: `observation-${nextNumber}`, capturedAt: timestamp(capturedAt), lessonId,
    modelId: value.modelId, modelVersion: value.modelVersion,
    inputs: value.inputs, outputs: value.outputs,
    inputUnits: value.inputUnits, outputUnits: value.outputUnits,
    assumptions: value.assumptions, omittedFactors: value.omittedFactors,
    sourceIds: value.sourceIds, executionKind: "browser educational model" as const,
  }) as SavedObservation;
  return freezeSnapshot({ ...record, observations: [...record.observations, snapshot] });
}

export function removeObservation(record: LearningRecord, observationId: string): LearningRecord {
  return freezeSnapshot({ ...record, observations: record.observations.filter((item) => item.id !== observationId) });
}

export function clearObservations(record: LearningRecord): LearningRecord {
  return freezeSnapshot({ ...record, observations: [] });
}

export function learningRecordJson(record: LearningRecord): string | null {
  return record.observations.length ? `${JSON.stringify(record, null, 2)}\n` : null;
}

function table(values: object, units: object): string {
  const unitMap = units as Record<string, string>;
  return ["| Field | Value | Unit |", "| --- | --- | --- |", ...Object.entries(values).map(([key, value]) =>
    `| ${key} | ${JSON.stringify(value)} | ${unitMap[key] ?? ""} |`,
  )].join("\n");
}

export function learningRecordMarkdown(record: LearningRecord): string | null {
  if (!record.observations.length) return null;
  const intro = [
    "# Quantum Foundry — Article 4 learning record", "", record.notice, "",
    `Schema version: ${record.schemaVersion}  `,
    `Article: ${record.articleId}  `,
    `Article revision: ${record.articleRevision}  `,
    `Companion version: ${record.companionVersion}  `,
    `Record created: ${record.createdAt}`, "",
  ];
  const observations = record.observations.map((item) => [
    `## ${item.id}: ${item.lessonId}`, "",
    `Captured: ${item.capturedAt}  `,
    `Lesson: ${item.lessonId}  `,
    `Model: ${item.modelId} (${item.modelVersion})  `,
    `Execution: ${item.executionKind}`, "",
    "### Inputs", "", table(item.inputs, item.inputUnits), "",
    "### Calculated outputs", "", table(item.outputs, item.outputUnits), "",
    "### Assumptions", "", ...item.assumptions.map((text) => `- ${text}`), "",
    "### Omitted factors", "", ...item.omittedFactors.map((text) => `- ${text}`), "",
    "Source references in Article 4 V9: " + item.sourceIds.join(", "), "",
  ].join("\n"));
  return [...intro, ...observations].join("\n");
}

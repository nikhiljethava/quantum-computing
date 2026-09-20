import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/analytics.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadAnalytics({ storage, browser = true, failNetwork = false } = {}) {
  const calls = [];
  const exports = {};
  const context = {
    exports,
    require: (name) => {
      assert.equal(name, "@/lib/api");
      return {
        recordUsage: async (payload) => {
          calls.push(payload);
          if (failNetwork) throw new Error("Analytics unavailable");
        },
      };
    },
  };
  if (browser) {
    context.window = {
      get localStorage() {
        if (storage instanceof Error) throw storage;
        return storage ?? { getItem: () => "anonymous-test-visitor", setItem: () => {} };
      },
    };
  }
  vm.runInNewContext(compiled, context, { filename: "analytics.ts" });
  return { api: exports, calls };
}

test("Article 4 sends only allowlisted lesson metadata through the existing event path", async () => {
  const { api, calls } = loadAnalytics();
  await api.trackArticle4Event("article4_mode_change", {
    lesson: "entanglement", level: 400, mode: "explore", format: "markdown",
    inputs: { samples: 12345 }, record: "private record", url: "https://untrusted.example/",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].page_path,
    "/__events__/article4_mode_change/article4-v9__lesson-entanglement__level-400__mode-explore__format-markdown");
  assert.deepEqual(Object.keys(calls[0]).sort(), ["page_path", "visitor_id"]);
});

test("Invalid event names are rejected and invalid metadata never enters telemetry", async () => {
  const { api, calls } = loadAnalytics();
  await api.trackArticle4Event("untrusted_event", { lesson: "sampling" });
  assert.equal(calls.length, 0);
  await api.trackArticle4Event("article4_lesson_open", {
    lesson: "unknown?secret=hello", level: 999, mode: "arbitrary", format: "private data",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].page_path, "/__events__/article4_lesson_open/article4-v9");
});

test("Every allowlisted lesson, display mode, level, and export format is accepted", async () => {
  const { api, calls } = loadAnalytics();
  for (const lesson of ["sampling", "scheduling", "transmon", "ions", "routing", "blockade", "photonics", "loss", "phase", "entanglement"]) {
    await api.trackArticle4Event("article4_lesson_open", { lesson, level: 100 });
    assert.match(calls.at(-1).page_path, new RegExp(`lesson-${lesson}__level-100$`));
  }
  for (const mode of ["watch", "steps", "explore"]) {
    await api.trackArticle4Event("article4_mode_change", { mode, level: 400 });
    assert.match(calls.at(-1).page_path, new RegExp(`level-400__mode-${mode}$`));
  }
  for (const format of ["json", "markdown"]) {
    await api.trackArticle4Event("article4_note_export", { format });
    assert.match(calls.at(-1).page_path, new RegExp(`format-${format}$`));
  }
});

test("Denied browser storage, reads, and writes do not reject the caller", async () => {
  const failures = [
    new Error("Storage access denied"),
    { getItem: () => { throw new Error("Storage read denied"); } },
    { getItem: () => null, setItem: () => { throw new Error("Storage write denied"); } },
  ];
  for (const storage of failures) {
    const { api, calls } = loadAnalytics({ storage });
    await assert.doesNotReject(api.trackArticle4Event("article4_lesson_open", { lesson: "sampling" }));
    assert.equal(calls.length, 0);
  }
});

test("Analytics network failure is contained for Article 4 and existing product events", async () => {
  const { api, calls } = loadAnalytics({ failNetwork: true });
  await assert.doesNotReject(api.trackArticle4Event("article4_note_export", { format: "json" }));
  await assert.doesNotReject(api.trackProductEvent("article_companion_viewed", "series-01"));
  assert.equal(calls.length, 2);
});

test("Server rendering performs no analytics request and event namespace remains recognized", async () => {
  const { api, calls } = loadAnalytics({ browser: false });
  await api.trackArticle4Event("article4_lesson_open", { lesson: "sampling" });
  assert.equal(calls.length, 0);
  assert.equal(api.isAnalyticsEventPath("/__events__/article4_lesson_open"), true);
  assert.equal(api.isAnalyticsEventPath("/series/04-qubit-technologies"), false);
});

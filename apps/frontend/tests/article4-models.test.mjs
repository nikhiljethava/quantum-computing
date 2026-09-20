/**
 * Locally authored regression expectations from the implementation request and
 * V9 DOCX. These are NOT the missing independent ACCEPTANCE_CASES/golden files.
 * Uses the existing TypeScript compiler and Node's test runner on Node 22+.
 */
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const compiledDirectory = mkdtempSync(join(tmpdir(), "qf-article4-models-"));
const require = createRequire(import.meta.url);
function loadTypeScript(name) {
  const source = readFileSync(new URL(`../src/lib/article4/${name}.ts`, import.meta.url), "utf8");
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: `${name}.ts`, reportDiagnostics: true,
  });
  assert.equal(diagnostics?.length ?? 0, 0, `Transpilation diagnostics in ${name}`);
  const target = join(compiledDirectory, `${name}.cjs`);
  writeFileSync(target, outputText);
  return require(target);
}
after(() => rmSync(compiledDirectory, { recursive: true, force: true }));
const models = loadTypeScript("models");
const state = loadTypeScript("state");
const records = loadTypeScript("export");
const { DEFAULTS, evaluateSampling, evaluateScheduling, enumerateScheduling, evaluateRouting, evaluatePhase, evaluateLoss, JOBS, CONFLICT_EDGES } = models;

function value(result) {
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}
function close(actual, expected, epsilon = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= epsilon * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}
function invalid(result, key) {
  assert.equal(result.ok, false);
  assert.ok(result.errors[key], `Missing error for ${key}: ${JSON.stringify(result)}`);
  assert.equal("value" in result, false, "Invalid input must not expose a saveable result");
}

test("sampling matches both specified N examples and keeps its expected center", () => {
  const small = value(evaluateSampling(DEFAULTS.sampling));
  const large = value(evaluateSampling({ ...DEFAULTS.sampling, N: 10_000 }));
  close(small.outputs.expectedEstimate, 0.2);
  close(small.outputs.standardError, 0.1);
  close(small.outputs.meanSquaredError, 0.05);
  close(large.outputs.expectedEstimate, 0.2);
  close(large.outputs.standardError, 0.01);
  close(large.outputs.meanSquaredError, 0.0401);
  close(small.outputs.standardError / large.outputs.standardError, 10);
  assert.equal(small.outputs.offsetDirection, "above");
});

test("sampling supports negative and zero offsets, nonzero references and zero variance", () => {
  const zero = value(evaluateSampling({ N: 100, b: 0, variance: 0, reference: -7 }));
  assert.deepEqual(zero.outputs, { expectedEstimate: -7, standardError: 0, meanSquaredError: 0, lowerOneSE: -7, upperOneSE: -7, offsetDirection: "equal" });
  const below = value(evaluateSampling({ N: 100, b: -0.2, variance: 1, reference: 4 }));
  close(below.outputs.expectedEstimate, 3.8);
  assert.equal(below.outputs.offsetDirection, "below");
  close(below.outputs.upperOneSE - below.outputs.lowerOneSE, 2 * below.outputs.standardError);
});

test("numeric parsing rejects blanks, nonfinite values, coercible objects and nondecimal text", () => {
  for (const input of ["", "  ", NaN, Infinity, -Infinity, "NaN", "Infinity", "1e400", "5samples", "0x10", null, undefined, false, true, [], {}, { valueOf: () => 100 }]) {
    invalid(evaluateSampling({ ...DEFAULTS.sampling, N: input }), "N");
  }
  const parsed = value(evaluateSampling({ N: "1e2", b: " -.2 ", variance: "1.0", reference: ".5" }));
  assert.deepEqual(parsed.inputs, { N: 100, b: -0.2, variance: 1, reference: 0.5 });
});

test("sampling validates integer samples and chosen local bounds without clamping", () => {
  for (const N of [0, -1, 2.1, 10_000_001]) invalid(evaluateSampling({ ...DEFAULTS.sampling, N }), "N");
  for (const [key, outOfBounds] of [["b", [-1001, 1001]], ["variance", [-0.1, 1_000_001]], ["reference", [-1001, 1001]]]) {
    for (const input of outOfBounds) invalid(evaluateSampling({ ...DEFAULTS.sampling, [key]: input }), key);
  }
  assert.equal(value(evaluateSampling({ N: 10_000_000, b: -1000, variance: 1_000_000, reference: 1000 })).inputs.N, 10_000_000);
});

test("sampling preserves calculation precision instead of rounding stored outputs", () => {
  const result = value(evaluateSampling({ N: 3, b: 0.23456789, variance: 0.7654321, reference: 0.12345678 }));
  assert.equal(result.outputs.expectedEstimate, 0.12345678 + 0.23456789);
  assert.equal(result.outputs.standardError, Math.sqrt(0.7654321 / 3));
  assert.equal(result.outputs.meanSquaredError, 0.23456789 ** 2 + 0.7654321 / 3);
});

test("scheduling dataset derives exactly the five shared-equipment edges", () => {
  assert.deepEqual(JOBS.map((job) => [job.id, [...job.equipment]]), [["A", ["press", "inspection"]], ["B", ["press", "drill"]], ["C", ["drill", "mill"]], ["D", ["mill", "oven"]], ["E", ["oven", "inspection"]]]);
  assert.deepEqual(CONFLICT_EDGES.map((edge) => edge.jobs.join("")).sort(), ["AB", "AE", "BC", "CD", "DE"]);
  for (const edge of CONFLICT_EDGES) {
    const [a, b] = edge.jobs.map((id) => JOBS.find((job) => job.id === id));
    assert.deepEqual(edge.equipment, a.equipment.filter((item) => b.equipment.includes(item)));
  }
});

test("all 32 scheduling subsets agree with independently counted equipment conflicts", () => {
  const choices = enumerateScheduling();
  assert.equal(choices.length, 32);
  assert.equal(new Set(choices.map((choice) => choice.selected.join(""))).size, 32);
  assert.equal(choices.filter((choice) => choice.valid).length, 11);
  assert.deepEqual(choices.filter((choice) => choice.maximum).map((choice) => choice.selected.join("")).sort(), ["AC", "AD", "BD", "BE", "CE"]);
  assert.equal(Math.min(...choices.map((choice) => choice.cost)), -2);
  for (const choice of choices) {
    const allEquipment = choice.selected.flatMap((id) => JOBS.find((job) => job.id === id).equipment);
    const repeatedEquipment = [...new Set(allEquipment.filter((item, index) => allEquipment.indexOf(item) !== index))];
    const result = value(evaluateScheduling(choice.selected));
    assert.equal(result.outputs.valid, repeatedEquipment.length === 0);
    assert.equal(result.outputs.conflicts.length, repeatedEquipment.length);
    assert.equal(result.outputs.cost, -choice.selected.length + 2 * repeatedEquipment.length);
    assert.equal(result.outputs.maximum, choice.valid && choice.selected.length === 2);
    assert.equal(result.outputs.maximumSize, 2);
    assert.deepEqual(result.outputs.equipment, [...new Set(allEquipment)]);
    assert.equal(result.outputs.cost === -2, choice.maximum);
    if (choice.selected.length >= 3) assert.equal(result.outputs.valid, false);
  }
});

test("scheduling distinguishes validity, maximum and the empty set", () => {
  const ab = value(evaluateScheduling(["A", "B"]));
  assert.equal(ab.outputs.valid, false);
  assert.equal(ab.outputs.maximum, false);
  assert.deepEqual(ab.outputs.conflicts, [{ jobs: ["A", "B"], equipment: ["press"] }]);
  assert.equal(value(evaluateScheduling(["A", "C"])).outputs.maximum, true);
  assert.equal(value(evaluateScheduling(["A"])).outputs.valid, true);
  assert.equal(value(evaluateScheduling(["A"])).outputs.maximum, false);
  const empty = value(evaluateScheduling([]));
  assert.equal(empty.outputs.valid, true);
  assert.equal(empty.outputs.selectedCount, 0);
  assert.equal(empty.outputs.maximum, false);
});

test("scheduling rejects unknown or repeated IDs and orders valid selections predictably", () => {
  for (const selection of [["F"], ["a"], ["A", "A"], [null], ["A", 3]]) invalid(evaluateScheduling(selection), "selected");
  assert.deepEqual(value(evaluateScheduling(["C", "A"])).inputs.selected, ["A", "C"]);
});

test("routing matches k=0,1,2 accounting and the one-SWAP state exchange", () => {
  for (const [k, gates, duration] of [[0, 1, 0.2], [1, 4, 0.8], [2, 7, 1.4]]) {
    const result = value(evaluateRouting({ ...DEFAULTS.routing, k }));
    assert.equal(result.outputs.gateCount, gates);
    close(result.outputs.localDuration, duration);
    assert.equal(result.outputs.directDuration, 1);
  }
  assert.deepEqual(value(evaluateRouting(DEFAULTS.routing)).outputs.arrangements, [["A", "X", "B"], ["X", "A", "B"]]);
  assert.deepEqual(value(evaluateRouting({ ...DEFAULTS.routing, k: 0 })).outputs.arrangements, [["A", "B"]]);
});

test("routing diagrams contain k intermediate positions and k actual adjacent exchanges", () => {
  for (let k = 0; k <= 5; k++) {
    const { outputs } = value(evaluateRouting({ ...DEFAULTS.routing, k }));
    assert.equal(outputs.sites.length, k + 2);
    assert.equal(outputs.arrangements.length, k + 1);
    for (const arrangement of outputs.arrangements) assert.equal(arrangement.length, outputs.sites.length);
    for (let step = 1; step <= k; step++) {
      const previous = outputs.arrangements[step - 1];
      const current = outputs.arrangements[step];
      assert.equal(current.indexOf("A"), step);
      assert.equal(current.filter((label, i) => label !== previous[i]).length, 2);
      assert.deepEqual([...current].sort(), [...previous].sort());
    }
    assert.deepEqual(outputs.arrangements.at(-1).slice(-2), ["A", "B"]);
  }
});

test("routing handles faster, slower, exact and floating-point-equivalent ties", () => {
  assert.equal(value(evaluateRouting(DEFAULTS.routing)).outputs.comparison, "local-faster");
  assert.equal(value(evaluateRouting({ ...DEFAULTS.routing, k: 2 })).outputs.comparison, "direct-faster");
  assert.equal(value(evaluateRouting({ k: 1, localTime: 0.25, directTime: 1 })).outputs.comparison, "tie");
  assert.equal(value(evaluateRouting({ k: 2, localTime: 0.2, directTime: 1.4 })).outputs.comparison, "tie");
  assert.equal(value(evaluateRouting({ k: 5, localTime: 0, directTime: 0 })).outputs.comparison, "tie");
  assert.equal(value(evaluateRouting({ k: 0, localTime: 1e-20, directTime: 2e-20 })).outputs.comparison, "local-faster");
  assert.equal(value(evaluateRouting({ k: 0, localTime: 2e-20, directTime: 1e-20 })).outputs.comparison, "direct-faster");
});

test("routing rejects invalid k and operation times", () => {
  for (const k of [-1, 1.5, 6, "", Infinity]) invalid(evaluateRouting({ ...DEFAULTS.routing, k }), "k");
  for (const key of ["localTime", "directTime"]) {
    for (const input of [-0.01, 1_000_001, "", NaN]) invalid(evaluateRouting({ ...DEFAULTS.routing, [key]: input }), key);
  }
});

test("optical phase matches all three ideal presets", () => {
  assert.deepEqual(value(evaluatePhase({ phi: 0 })).outputs, { pD0: 1, pD1: 0 });
  assert.deepEqual(value(evaluatePhase({ phi: Math.PI / 2 })).outputs, { pD0: 0.5, pD1: 0.5 });
  assert.deepEqual(value(evaluatePhase({ phi: Math.PI })).outputs, { pD0: 0, pD1: 1 });
});

test("phase probabilities are bounded, normalized and retain full precision across the domain", () => {
  for (let index = 0; index <= 1000; index++) {
    const phi = Math.PI * index / 1000;
    const { outputs } = value(evaluatePhase({ phi }));
    assert.ok(outputs.pD0 >= 0 && outputs.pD0 <= 1 && outputs.pD1 >= 0 && outputs.pD1 <= 1);
    close(outputs.pD0 + outputs.pD1, 1);
    close(outputs.pD0, Math.cos(phi / 2) ** 2);
    close(outputs.pD1, Math.sin(phi / 2) ** 2);
  }
  for (const phi of [-0.01, Math.PI + 0.001, "", Infinity]) invalid(evaluatePhase({ phi }), "phi");
});

test("optical loss calculates cumulative conditional delivery and expected per-stage counts", () => {
  const { outputs } = value(evaluateLoss(DEFAULTS.loss));
  close(outputs.pathEfficiency, 0.6561);
  close(outputs.expectedDetections, 65.61);
  for (const [i, expected] of [100, 90, 81, 72.9, 65.61].entries()) close(outputs.stageCounts[i], expected);
  for (let i = 0; i < 4; i++) close(outputs.stageLosses[i], outputs.stageCounts[i] - outputs.stageCounts[i + 1]);
  close(outputs.stageLosses.reduce((sum, loss) => sum + loss, 0) + outputs.expectedDetections, 100);
});

test("loss supports all-one efficiencies, each possible zero stage and zero launches", () => {
  assert.deepEqual(value(evaluateLoss({ efficiencies: [1, 1, 1, 1], launches: 100 })).outputs, { pathEfficiency: 1, expectedDetections: 100, stageCounts: [100, 100, 100, 100, 100], stageLosses: [0, 0, 0, 0] });
  for (let stage = 0; stage < 4; stage++) {
    const efficiencies = [0.9, 0.9, 0.9, 0.9]; efficiencies[stage] = 0;
    const { outputs } = value(evaluateLoss({ efficiencies, launches: 100 }));
    assert.equal(outputs.pathEfficiency, 0);
    assert.equal(outputs.expectedDetections, 0);
    assert.ok(outputs.stageCounts.slice(stage + 1).every((count) => count === 0));
  }
  const zero = value(evaluateLoss({ ...DEFAULTS.loss, launches: 0 }));
  assert.ok(zero.outputs.stageCounts.every((count) => count === 0));
  close(zero.outputs.pathEfficiency, 0.6561);
});

test("loss requires four finite bounded efficiencies and integer bounded launches", () => {
  for (const efficiencies of [[], [1], [1, 1, 1, 1, 1]]) invalid(evaluateLoss({ efficiencies, launches: 100 }), "efficiencies");
  for (let stage = 0; stage < 4; stage++) {
    for (const bad of [-0.01, 1.01, NaN, Infinity, "", undefined, null]) {
      const efficiencies = [0.9, 0.9, 0.9, 0.9]; efficiencies[stage] = bad;
      invalid(evaluateLoss({ efficiencies, launches: 100 }), `efficiency${stage}`);
    }
  }
  invalid(evaluateLoss({ efficiencies: Array(4), launches: 100 }), "efficiency0");
  for (const launches of [-1, 0.5, 1_000_000_001, "", Infinity]) invalid(evaluateLoss({ ...DEFAULTS.loss, launches }), "launches");
});

test("all models supply reproducible units, assumptions, omissions and original source IDs", () => {
  const results = [evaluateSampling(DEFAULTS.sampling), evaluateScheduling(DEFAULTS.scheduling), evaluateRouting(DEFAULTS.routing), evaluatePhase(DEFAULTS.phase), evaluateLoss(DEFAULTS.loss)].map(value);
  for (const result of results) {
    assert.deepEqual(Object.keys(result.inputUnits).sort(), Object.keys(result.inputs).sort());
    assert.deepEqual(Object.keys(result.outputUnits).sort(), Object.keys(result.outputs).sort());
    assert.ok(result.assumptions.length && result.omittedFactors.length && result.sourceIds.length);
    assert.ok(result.sourceIds.every((id) => /^\[(?:[1-9]|[1-3][0-9]|4[01])\]$/.test(id)));
    assert.equal(result.modelVersion, "1.0.0");
  }
});

test("query parser allowlists exactly ten lessons and two levels", () => {
  assert.deepEqual(state.LESSON_IDS, ["sampling", "scheduling", "transmon", "ions", "routing", "blockade", "photonics", "loss", "phase", "entanglement"]);
  for (const lessonId of state.LESSON_IDS) {
    for (const level of [100, 400]) assert.deepEqual(state.parseArticle4Query(new URLSearchParams({ lesson: lessonId, level: String(level) })), { lessonId, level, usedDefaults: false });
  }
});

test("missing, invalid and duplicated query values use deterministic independent defaults", () => {
  for (const query of ["", "lesson=missing", "lesson=", "lesson=ROUTING", "lesson=scheduling&lesson=scheduling", "lesson=scheduling&lesson=loss", "lesson=https://untrusted.invalid"]) {
    assert.equal(state.parseArticle4Query(new URLSearchParams(query)).lessonId, "sampling");
    assert.equal(state.parseArticle4Query(new URLSearchParams(query)).usedDefaults, true);
  }
  for (const query of ["level=200", "level=400&level=400", "level=400&level=100", "level=0400", "level="]) {
    assert.equal(state.parseArticle4Query(new URLSearchParams(`lesson=routing&${query}`)).level, 100);
    assert.equal(state.parseArticle4Query(new URLSearchParams(`lesson=routing&${query}`)).lessonId, "routing");
  }
  assert.deepEqual(state.parseArticle4Query(new URLSearchParams("lesson=no&level=400")), { lessonId: "sampling", level: 400, usedDefaults: true });
});

test("lesson links contain only the safe route, lesson and level; no input or return destination", () => {
  const malicious = new URLSearchParams("lesson=loss&level=100&returnTo=https://untrusted.invalid&launches=500&token=secret");
  const parsed = state.parseArticle4Query(malicious);
  assert.equal(state.article4LessonPath(parsed.lessonId, parsed.level), "/series/04-qubit-technologies?lesson=loss&level=100");
  assert.equal(state.article4LessonPath("https://untrusted.invalid", 999), "/series/04-qubit-technologies?lesson=sampling&level=100");
});

test("empty record has explicit revision and notice but cannot be exported", () => {
  const record = records.createLearningRecord("2026-01-01T00:00:00.000Z");
  assert.equal(record.articleRevision, "article4-v9");
  assert.equal(record.schemaVersion, "1.0.0");
  assert.match(record.notice, /not a hardware benchmark or an approved Algorithm Contract/);
  assert.equal(records.learningRecordJson(record), null);
  assert.equal(records.learningRecordMarkdown(record), null);
});

test("saved observations are immutable snapshots even when later model inputs and nested outputs change", () => {
  const base = records.createLearningRecord("2026-01-01T00:00:00.000Z");
  const raw = { efficiencies: [0.9, 0.9, 0.9, 0.9], launches: 100 };
  const observation = value(evaluateLoss(raw));
  const record = records.saveObservation(base, "loss", observation, "2026-01-01T00:00:01.000Z");
  const jsonBefore = records.learningRecordJson(record);
  raw.efficiencies[0] = 0;
  observation.inputs.efficiencies[1] = 0;
  observation.outputs.stageCounts[1] = 123;
  observation.assumptions.push("later mutation");
  assert.equal(records.learningRecordJson(record), jsonBefore);
  assert.equal(base.observations.length, 0);
  assert.ok(Object.isFrozen(record.observations[0].inputs.efficiencies));
  assert.throws(() => { record.observations[0].outputs.stageCounts[0] = 999; }, TypeError);
});

test("JSON and Markdown serialize the same saved numbers, metadata and both optics panels", () => {
  const observations = [
    ["sampling", evaluateSampling({ ...DEFAULTS.sampling, N: 3 })],
    ["scheduling", evaluateScheduling(["A", "B"])],
    ["routing", evaluateRouting({ ...DEFAULTS.routing, k: 2 })],
    ["photonics", evaluatePhase({ phi: 0 })],
    ["loss", evaluateLoss({ ...DEFAULTS.loss, launches: 0 })],
  ];
  let record = records.createLearningRecord("2026-01-01T00:00:00.000Z");
  for (const [lessonId, result] of observations) record = records.saveObservation(record, lessonId, value(result), "2026-01-01T00:00:01.000Z");
  const json = JSON.parse(records.learningRecordJson(record));
  const markdown = records.learningRecordMarkdown(record);
  assert.deepEqual(json, record);
  assert.equal(json.observations.length, 5);
  assert.ok(markdown.includes(json.createdAt) && markdown.includes(json.articleRevision));
  for (const item of json.observations) {
    assert.equal(item.executionKind, "browser educational model");
    for (const [key, entry] of Object.entries(item.inputs)) assert.ok(markdown.includes(`| ${key} | ${JSON.stringify(entry)} | ${item.inputUnits[key]} |`));
    for (const [key, entry] of Object.entries(item.outputs)) assert.ok(markdown.includes(`| ${key} | ${JSON.stringify(entry)} | ${item.outputUnits[key]} |`));
    for (const text of [...item.assumptions, ...item.omittedFactors, ...item.sourceIds, item.modelId, item.modelVersion, item.capturedAt]) assert.ok(markdown.includes(text));
  }
  assert.match(markdown, /\| expectedDetections \| 0 \|/);
  assert.match(markdown, /\| pD1 \| 0 \|/);
});

test("removing and clearing saved examples preserve prior records and record creation time", () => {
  const base = records.createLearningRecord("2026-01-01T00:00:00.000Z");
  const one = records.saveObservation(base, "sampling", value(evaluateSampling(DEFAULTS.sampling)));
  const two = records.saveObservation(one, "routing", value(evaluateRouting(DEFAULTS.routing)));
  const removed = records.removeObservation(two, one.observations[0].id);
  assert.equal(removed.observations.length, 1);
  assert.equal(removed.observations[0].lessonId, "routing");
  assert.equal(two.observations.length, 2);
  const cleared = records.clearObservations(removed);
  assert.equal(cleared.observations.length, 0);
  assert.equal(cleared.createdAt, base.createdAt);
  assert.equal(records.learningRecordMarkdown(cleared), null);
});

test("saved records reject mismatched lesson/model and invalid timestamps and exclude unrelated fields", () => {
  const base = records.createLearningRecord("2026-01-01T00:00:00.000Z");
  const sample = value(evaluateSampling(DEFAULTS.sampling));
  assert.throws(() => records.saveObservation(base, "entanglement", sample));
  assert.throws(() => records.createLearningRecord("not a date"));
  assert.throws(() => records.saveObservation(base, "sampling", sample, "not a date"));
  sample.credentials = "secret";
  sample.assessmentId = "invented-id";
  sample.returnTo = "https://untrusted.invalid";
  const serialized = records.learningRecordJson(records.saveObservation(base, "sampling", sample));
  for (const secret of ["secret", "credentials", "assessmentId", "invented-id", "returnTo", "untrusted.invalid"]) assert.equal(serialized.includes(secret), false);
});

test("model and export modules have no backend, job, identity, persistence or analytics dependency", () => {
  for (const name of ["models", "state", "export"]) {
    const source = readFileSync(new URL(`../src/lib/article4/${name}.ts`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|\brecordUsage\b|\bdocument\.cookie\b|@\/lib\/api/);
  }
});

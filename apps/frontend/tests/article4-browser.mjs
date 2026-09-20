import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

// Run against an already-built local frontend. All API calls are aborted on
// purpose; these lessons and exports must work without backend or analytics.
const baseUrl = process.env.ARTICLE4_BASE_URL ?? "http://127.0.0.1:3000";
const route = "/series/04-qubit-technologies";
const outputDirectory = fileURLToPath(new URL("../../../docs/screenshots/", import.meta.url));
const suppliedMediaDirectory = fileURLToPath(new URL("../public/articles/04-qubit-technologies/v9/", import.meta.url));
const lessons = [
  ["sampling", "Sampling versus bias"], ["scheduling", "Five jobs, shared equipment"],
  ["transmon", "A circuit stores a qubit"], ["ions", "Shared motion, internal states"],
  ["routing", "The cost of reaching a partner"], ["blockade", "A neighbor shifts the transition"],
  ["photonics", "One photon, two path amplitudes"], ["loss", "How much arrives?"],
  ["phase", "A phase becomes visible"], ["entanglement", "Matching bits are not enough"],
];
let browser;
const measurements = { baseUrl, measuredAt: new Date().toISOString(), backend: "All API requests deliberately blocked", initialRequests: [], screenshots: [], limitations: ["Reviewed MP4/GIF/numbered-step/print package absent; moving-media lifecycle cannot be release-verified."] };

before(async () => {
  await mkdir(outputDirectory, { recursive: true });
  const chrome = process.env.ARTICLE4_CHROME_PATH;
  const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const executablePath = chrome ?? (existsSync(chromium.executablePath()) ? undefined : existsSync(systemChrome) ? systemChrome : undefined);
  browser = await chromium.launch({ headless: true, executablePath });
});
after(async () => {
  await browser?.close();
  await writeFile(path.join(outputDirectory, "article4-browser-measurements.json"), `${JSON.stringify(measurements, null, 2)}\n`);
});

async function withPage(run, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, ...options });
  const requests = [];
  context.on("request", request => requests.push({ url: request.url(), method: request.method(), resourceType: request.resourceType() }));
  await context.route(/\/api\//, request => request.abort("connectionfailed"));
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await run(page, requests, context);
    assert.deepEqual(errors, [], "No uncaught browser errors");
    const writes = requests.filter(request => request.method !== "GET" && /\/api\/v1\/(?:jobs|circuits\/run|assessments|artifacts|projects|sessions)(?:\/|$|\?)/.test(request.url));
    assert.deepEqual(writes, [], "Reading and local export must never submit assessments or create jobs");
  } finally {
    await context.close();
  }
}

async function openLesson(page, lesson = "sampling", level = 100, extra = "") {
  const response = await page.goto(`${baseUrl}${route}?lesson=${lesson}&level=${level}${extra}`, { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  await page.locator(`[data-testid="teaching-media"][data-lesson="${lesson}"]`).waitFor({ state: "visible" });
  assert.equal(await page.getByTestId("teaching-media").getAttribute("data-lesson"), lesson);
}
async function explore(page, lesson = "sampling") {
  await openLesson(page, lesson);
  await page.getByRole("button", { name: "Explore", exact: true }).click();
}
function tool(page, label) { return page.locator(`section[aria-label="${label}"]:visible`); }
async function result(panel, name) {
  const label = panel.locator("dt").filter({ hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) });
  return (await label.locator("..").locator("dd").textContent()).trim();
}
async function assertResult(panel, name, expected) {
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await panel.locator("dt").filter({ hasText: new RegExp(`^${escape(name)}$`) }).locator("..").locator("dd").filter({ hasText: new RegExp(`^${escape(expected)}$`) }).waitFor();
  assert.equal(await result(panel, name), expected);
}
async function downloadText(page, name) {
  const [download] = await Promise.all([
    page.waitForEvent("download"), page.getByRole("button", { name, exact: true }).click(),
  ]);
  assert.equal(await download.failure(), null);
  return readFile(await download.path(), "utf8");
}
async function shot(page, name) {
  const filename = `article4-${name}.png`;
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: path.join(outputDirectory, filename), fullPage: true });
  measurements.screenshots.push(filename);
}

test("Ten V9 lessons, stills, references and manual text steps load without backend or unsolicited moving media", { timeout: 60000 }, async () => withPage(async (page, requests) => {
  await openLesson(page);
  const nav = page.getByRole("navigation", { name: "Article 4 lessons" });
  assert.equal(await nav.getByRole("link").count(), 10);
  for (const [id, title] of lessons) {
    await nav.getByRole("link").filter({ hasText: title }).click();
    await page.waitForURL(url => url.searchParams.get("lesson") === id);
    const media = page.getByTestId("teaching-media");
    assert.equal(await media.getAttribute("data-lesson"), id);
    const img = media.locator("img");
    await img.waitFor();
    await page.waitForFunction(lesson => {
      const image = document.querySelector(`[data-testid="teaching-media"][data-lesson="${lesson}"] img`);
      return image?.complete && image.naturalWidth > 0;
    }, id);
    assert.match(await img.getAttribute("src"), new RegExp(`/${id}\\.png$`));
    assert.ok((await img.getAttribute("alt")).length > 20);
    const sourceDisclosure = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: /^Sources and model provenance/ }) });
    if (await sourceDisclosure.getAttribute("open") === null) await sourceDisclosure.locator("summary").click();
    assert.ok(await sourceDisclosure.locator("li[id^='article4-source-']").count() > 0);
    for (const url of await sourceDisclosure.locator("li a").evaluateAll(links => links.map(link => link.href))) assert.equal(new URL(url).protocol, "https:");
    await sourceDisclosure.locator("summary").click();
    assert.match(await media.getByTestId("missing-moving-media").textContent(), /not been supplied/);
    assert.equal(await page.getByRole("button", { name: "Explore", exact: true }).count(), ["sampling", "scheduling", "routing", "photonics", "loss"].includes(id) ? 1 : 0);
    await page.getByRole("button", { name: "Step through", exact: true }).click();
    await page.locator('[data-testid="teaching-media"][data-mode="steps"]').waitFor({ state: "visible" });
    assert.equal(await media.getAttribute("data-mode"), "steps");
    assert.match(await media.getByTestId("missing-step-images").textContent(), /not been supplied/);
    const stepTexts = [];
    for (let step = 1; step <= 4; step++) {
      await media.getByRole("button", { name: `Step ${step}`, exact: true }).click();
      const text = await page.locator(`#${id}-step-text`).textContent();
      assert.match(text, new RegExp(`Step ${step} of 4`));
      stepTexts.push(text);
    }
    assert.equal(new Set(stepTexts).size, 4);
    await page.getByRole("button", { name: "Watch", exact: true }).click();
  }
  const moving = requests.filter(request => /\.(mp4|gif)(?:\?|$)/.test(request.url));
  assert.deepEqual(moving, []);
  measurements.initialRequests = requests.filter(request => /\/articles\/04-qubit-technologies\//.test(request.url));
  measurements.unrequestedMovingMediaCount = moving.length;
  measurements.loadedStillCount = new Set(measurements.initialRequests.map(request => request.url)).size;
  measurements.mediaResources = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter(entry => entry.name.includes("/articles/04-qubit-technologies/"))
    .map(entry => ({ url: entry.name, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, durationMs: entry.duration })));
  // No external Article 4 publication URL has been configured for this build.
  assert.equal(await page.getByRole("link", { name: /Read the full Article 4/i }).count(), 0);
}));

test("Safe deep links, reload, Back/Forward and keyboard navigation preserve lesson and level", { timeout: 45000 }, async () => withPage(async (page) => {
  await openLesson(page, "photonics", 400);
  const summary = page.locator("summary").filter({ hasText: "Level 400" });
  assert.equal(await summary.locator("..").getAttribute("open"), "");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="teaching-media"][data-lesson="photonics"]').waitFor();
  assert.equal(await page.getByTestId("teaching-media").getAttribute("data-lesson"), "photonics");
  const nav = page.getByRole("navigation", { name: "Article 4 lessons" });
  const routing = nav.getByRole("link").filter({ hasText: "The cost of reaching a partner" });
  await routing.focus();
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const focused = document.activeElement;
    const style = getComputedStyle(focused);
    return { tag: focused.tagName, outline: style.outlineStyle, width: style.outlineWidth, boxShadow: style.boxShadow };
  });
  assert.equal(focus.tag, "A");
  assert.ok((focus.outline !== "none" && focus.width !== "0px") || focus.boxShadow !== "none", "Keyboard focus should have a visible indicator");
  await routing.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(url => url.searchParams.get("lesson") === "routing");
  await page.goBack();
  assert.equal(new URL(page.url()).searchParams.get("lesson"), "photonics");
  await page.locator('[data-testid="teaching-media"][data-lesson="photonics"]').waitFor();
  await page.goForward();
  assert.equal(new URL(page.url()).searchParams.get("lesson"), "routing");
  await page.locator('[data-testid="teaching-media"][data-lesson="routing"]').waitFor();
  for (const query of ["lesson=unknown&level=999", "lesson=loss&lesson=routing&level=100", "lesson=sampling&level=400&level=400", "returnTo=https%3A%2F%2Funtrusted.example"]) {
    await page.goto(`${baseUrl}${route}?${query}`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("teaching-media").waitFor();
    assert.equal(await page.getByTestId("teaching-media").getAttribute("data-lesson"), "sampling");
    assert.equal(await page.locator("summary").filter({ hasText: "Level 400" }).locator("..").getAttribute("open"), null);
    assert.equal(new URL(page.url()).origin, new URL(baseUrl).origin);
  }
}));

test("Sampling validates input, preserves live inputs across modes, and exports immutable JSON/Markdown snapshots", { timeout: 45000 }, async () => withPage(async (page) => {
  await explore(page);
  const sampling = tool(page, "Sampling tool");
  await assertResult(sampling, "Expected estimate", "0.2");
  await assertResult(sampling, "Standard error", "0.1");
  await assertResult(sampling, "Mean squared error", "0.05");
  for (const invalid of ["", "0", "1.5", "Infinity", "10000001"]) {
    await page.locator("#sampling-N").fill(invalid);
    assert.equal(await sampling.getByRole("button", { name: "Save this example" }).isDisabled(), true);
    assert.equal(await page.locator("#sampling-N").getAttribute("aria-invalid"), "true");
    assert.equal(await sampling.locator(".a4-results").count(), 0);
  }
  await page.locator("#sampling-N").fill("100");
  await sampling.getByRole("button", { name: "Save this example" }).click();
  await page.locator("#sampling-N").fill("10000");
  await assertResult(sampling, "Standard error", "0.01");
  await assertResult(sampling, "Mean squared error", "0.0401");
  await page.getByRole("button", { name: "Watch", exact: true }).click();
  await page.getByText("Watch the preset example", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  assert.equal(await page.locator("#sampling-N").inputValue(), "10000");
  await sampling.getByRole("button", { name: "Save this example" }).click();
  const json = JSON.parse(await downloadText(page, "Export JSON"));
  assert.equal(json.articleRevision, "article4-v9");
  assert.equal(json.schemaVersion, "1.0.0");
  assert.equal(json.observations.length, 2);
  assert.equal(json.observations[0].inputs.N, 100);
  assert.equal(json.observations[0].outputs.standardError, 0.1);
  assert.equal(json.observations[1].inputs.N, 10000);
  assert.equal(json.observations[1].outputs.standardError, 0.01);
  const markdown = await downloadText(page, "Export Markdown");
  for (const observation of json.observations) {
    assert.ok(markdown.includes(observation.capturedAt));
    assert.ok(markdown.includes(`| N | ${observation.inputs.N} |`));
    assert.ok(markdown.includes(`| standardError | ${observation.outputs.standardError} |`));
    assert.equal(observation.executionKind, "browser educational model");
    assert.ok(observation.sourceIds.length > 0);
    assert.ok(observation.assumptions.length > 0 && observation.omittedFactors.length > 0);
  }
  assert.match(markdown, /not a hardware benchmark or an approved Algorithm Contract/);
  await sampling.locator("summary").filter({ hasText: "Advanced sampling controls" }).click();
  await page.locator("#sampling-b").fill("-0.2");
  assert.match(await sampling.locator(".a4-result-sentence").textContent(), /below/);
  await page.locator("#sampling-variance").fill("0");
  await assertResult(sampling, "Standard error", "0");
  assert.match(await sampling.locator(".a4-result-sentence").textContent(), /no sampling spread/);
  assert.match(await sampling.locator("figcaption").textContent(), /shown as points/);
  assert.equal(await sampling.locator("svg path[d*='NaN']").count(), 0);
  await shot(page, "sampling-desktop");
  await page.getByRole("button", { name: "Remove observation-1", exact: true }).click();
  const afterRemoval = JSON.parse(await downloadText(page, "Export JSON"));
  assert.equal(afterRemoval.observations.length, 1);
  assert.equal(afterRemoval.observations[0].inputs.N, 10000);
  await page.getByRole("button", { name: "Clear record", exact: true }).click();
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  assert.match(await page.locator("#learning-record").textContent(), /Save an example from Explore before exporting/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#learning-record").waitFor();
  assert.match(await page.locator("#learning-record").textContent(), /save.*example/i);
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  assert.match(await page.locator("#learning-record").textContent(), /Save an example from Explore before exporting/);
}));

test("Copy lesson link includes only lesson and level, even when unrelated query inputs are present", { timeout: 20000 }, async () => withPage(async (page) => {
  // Capture clipboard output without changing the user's system clipboard.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async value => { window.article4CopiedLink = value; } }, configurable: true });
  });
  await openLesson(page, "routing", 400, "&k=5&returnTo=https%3A%2F%2Funtrusted.example&private=hello");
  await page.getByRole("button", { name: "Copy lesson link", exact: true }).click();
  const copied = new URL(await page.evaluate(() => window.article4CopiedLink));
  assert.equal(copied.origin, new URL(baseUrl).origin);
  assert.equal(copied.pathname, route);
  assert.deepEqual([...copied.searchParams], [["lesson", "routing"], ["level", "400"]]);
  assert.match(await page.locator(".a4-share").textContent(), /Live inputs are not included/);
}));

test("Denied clipboard fallback never shows another lesson's link after Back navigation", { timeout: 20000 }, async () => withPage(async (page) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { throw new Error("Clipboard denied"); } }, configurable: true });
  });
  await openLesson(page, "routing");
  await page.getByRole("button", { name: "Copy lesson link", exact: true }).click();
  assert.equal(new URL(await page.getByRole("textbox", { name: "Lesson link to copy" }).inputValue()).searchParams.get("lesson"), "routing");
  await page.getByRole("navigation", { name: "Article 4 lessons" }).getByRole("link").filter({ hasText: "How much arrives?" }).click();
  await page.waitForURL(url => url.searchParams.get("lesson") === "loss");
  await page.getByRole("button", { name: "Copy lesson link", exact: true }).click();
  assert.equal(new URL(await page.getByRole("textbox", { name: "Lesson link to copy" }).inputValue()).searchParams.get("lesson"), "loss");
  await page.goBack();
  await page.locator('[data-testid="teaching-media"][data-lesson="routing"]').waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Lesson link to copy" }).count(), 0);
  assert.match(await page.locator(".a4-share").textContent(), /Shares the lesson and level/);
}));

test("Every scheduling selection agrees across equipment, graph, result table and saved output", { timeout: 90000 }, async () => withPage(async (page) => {
  await explore(page, "scheduling");
  const panel = tool(page, "Scheduling tool");
  await panel.getByRole("button", { name: "Check all choices", exact: true }).click();
  assert.equal(await panel.locator("table tbody tr").count(), 32);
  const jobs = ["A", "B", "C", "D", "E"];
  const equipment = [["Press", "inspection"], ["Press", "drill"], ["Drill", "mill"], ["Mill", "oven"], ["Oven", "inspection"]];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]];
  const expected = [];
  for (let mask = 0; mask < 32; mask++) {
    const selected = jobs.filter((_, index) => (mask & (1 << index)) !== 0);
    for (let index = 0; index < jobs.length; index++) await panel.getByRole("checkbox").nth(index).setChecked(selected.includes(jobs[index]));
    const conflicts = edges.filter(([a, b]) => selected.includes(jobs[a]) && selected.includes(jobs[b]));
    const valid = conflicts.length === 0;
    await assertResult(panel, "Selected jobs", String(selected.length));
    await assertResult(panel, "Conflicting pairs", String(conflicts.length));
    await assertResult(panel, "Selection", valid ? selected.length === 2 ? "Valid and maximum" : "Valid, not maximum" : "Invalid");
    assert.match(await panel.locator("svg").getAttribute("aria-label"), new RegExp(`${conflicts.length} conflicts`));
    for (const job of selected) {
      for (const item of equipment[jobs.indexOf(job)]) assert.match(await panel.locator(".a4-equipment").textContent(), new RegExp(item, "i"));
    }
    await panel.getByRole("button", { name: "Save this example" }).click();
    expected.push({ selected, conflicts: conflicts.length, cost: -selected.length + 2 * conflicts.length, valid });
  }
  const record = JSON.parse(await downloadText(page, "Export JSON"));
  assert.equal(record.observations.length, 32);
  assert.equal(expected.filter(value => value.valid).length, 11);
  assert.deepEqual(expected.filter(value => value.valid && value.selected.length === 2).map(value => value.selected.join("")).sort(), ["AC", "AD", "BD", "BE", "CE"]);
  record.observations.forEach((observation, index) => {
    assert.deepEqual(observation.inputs.selected, expected[index].selected);
    assert.equal(observation.outputs.conflicts.length, expected[index].conflicts);
    assert.equal(observation.outputs.cost, expected[index].cost);
    assert.equal(observation.outputs.valid, expected[index].valid);
  });
}));

test("Routing figure follows k, including zero and ties, while invalid bounds prevent saving", { timeout: 30000 }, async () => withPage(async (page) => {
  await explore(page, "routing");
  const panel = tool(page, "Routing tool");
  for (const [k, count, duration] of [[0, "1", "0.2"], [1, "4", "0.8"], [2, "7", "1.4"], [5, "16", "3.2"]]) {
    await page.locator("#routing-k").fill(String(k));
    await assertResult(panel, "Local two-qubit gates", count);
    await assertResult(panel, "Local gate-only duration", duration);
    assert.equal(await panel.locator("svg rect").count(), 2 * (k + 2), "Each diagram row must contain k intermediate states and endpoints");
  }
  await page.locator("#routing-k").fill("1");
  await page.locator("#routing-directTime").fill("0.8");
  assert.match(await panel.locator(".a4-result-sentence").textContent(), /durations are equal/);
  assert.match(await panel.locator("svg").getAttribute("aria-label"), /Initial states A, X, B; final states X, A, B/);
  await page.locator("#routing-k").fill("6");
  assert.equal(await panel.getByRole("button", { name: "Save this example" }).isDisabled(), true);
}));

test("One optics tool keeps phase and loss separate, including phase endpoints and zero transmission/launches", { timeout: 40000 }, async () => withPage(async (page) => {
  await explore(page, "photonics");
  let panel = tool(page, "Optics phase panel");
  for (const [preset, d0, d1] of [["0", "1", "0"], ["π/2", "0.5", "0.5"], ["π", "0", "1"]]) {
    await panel.getByRole("button", { name: preset, exact: true }).click();
    await assertResult(panel, "P(D0)", d0);
    await assertResult(panel, "P(D1)", d1);
  }
  await page.locator("#optics-phi").fill("4");
  assert.equal(await panel.getByRole("button", { name: "Save this example" }).isDisabled(), true);
  await panel.getByRole("button", { name: "π/2", exact: true }).click();
  await panel.getByRole("button", { name: "Save this example" }).click();
  await page.getByRole("button", { name: "Loss panel", exact: true }).click();
  panel = tool(page, "Optics loss panel");
  await assertResult(panel, "Path efficiency", "0.6561");
  await assertResult(panel, "Expected detections", "65.61");
  assert.deepEqual(await panel.locator("table tbody tr td:first-of-type").allTextContents(), ["100", "90", "81", "72.9", "65.61"]);
  await panel.getByRole("button", { name: "Save this example" }).click();
  await page.locator("#optics-efficiency1").fill("0");
  await assertResult(panel, "Expected detections", "0");
  assert.deepEqual(await panel.locator("table tbody tr td:first-of-type").allTextContents(), ["100", "90", "0", "0", "0"]);
  for (let stage = 0; stage < 4; stage++) await page.locator(`#optics-efficiency${stage}`).fill("1");
  await assertResult(panel, "Expected detections", "100");
  await page.locator("#optics-launches").fill("0");
  await assertResult(panel, "Expected detections", "0");
  await page.locator("#optics-efficiency0").fill("1.1");
  assert.equal(await panel.getByRole("button", { name: "Save this example" }).isDisabled(), true);
  const record = JSON.parse(await downloadText(page, "Export JSON"));
  assert.deepEqual(record.observations.map(observation => observation.modelId), ["optics-phase", "optics-loss"]);
}));

test("360px, reduced motion and 200% CSS zoom reflow preserve readable controls without page overflow", { timeout: 45000 }, async () => withPage(async (page) => {
  await explore(page, "sampling");
  assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
  assert.equal(await page.locator("video[autoplay]").count(), 0);
  for (const id of ["sampling", "scheduling", "routing", "photonics", "loss"]) {
    await explore(page, id);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id} should fit at 360px`);
  }
  await explore(page, "sampling");
  await shot(page, "sampling-mobile-360");
  await page.setViewportSize({ width: 1280, height: 1000 });
  // CSS zoom changes layout and reflows the page. Device pixel ratio alone does not.
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await page.locator("#sampling-N").fill("10000");
  await assertResult(tool(page, "Sampling tool"), "Standard error", "0.01");
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, innerWidth, zoom: getComputedStyle(document.documentElement).zoom }));
  assert.equal(dimensions.zoom, "2");
  assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1, `200% reflow should fit: ${JSON.stringify(dimensions)}`);
  measurements.zoom = { method: "CSS root zoom with reflow; not deviceScaleFactor", ...dimensions };
  await shot(page, "sampling-zoom-200");
}, { viewport: { width: 360, height: 800 }, reducedMotion: "reduce" }));

test("Existing Article 1/2, assessment, Build and Map routes still render when backend is unavailable", { timeout: 45000 }, async () => withPage(async (page) => {
  for (const destination of ["/series/01-platform-problem", "/series/02-hybrid-computing", "/assess", "/build", "/map"]) {
    const response = await page.goto(`${baseUrl}${destination}`, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200, destination);
    await page.locator("main").waitFor({ state: "visible" });
    assert.ok((await page.locator("main").textContent()).trim().length > 100, destination);
  }
}));

test("Still-image failure retains the accessible explanation", { timeout: 20000 }, async () => withPage(async (page) => {
  await page.route("**/articles/04-qubit-technologies/v9/sampling.png", request => request.abort("failed"));
  await openLesson(page);
  await page.getByText("The image could not load.", { exact: true }).waitFor();
  assert.match(await page.getByTestId("teaching-media").textContent(), /Reference-centered and offset schematic/);
}));

const hasReviewedMovingMedia = lessons.every(([id]) => ["mp4", "gif"].every(extension => existsSync(path.join(suppliedMediaDirectory, `${id}.${extension}`))));
test("Reviewed video playback, lesson-switch cleanup, GIF Stop and playback-error fallback", {
  skip: hasReviewedMovingMedia ? false : "Blocked: original reviewed MP4/GIF package was not supplied; never substitute synthetic clips for acceptance.",
}, async () => {
  // Deliberately fail if assets are later imported without implementing and
  // running this release-gate test against their actual playback behavior.
  assert.fail("Implement the real-media lifecycle test when reviewed assets are supplied.");
});

test("Reviewed numbered step images and print assets exist for all ten lessons", {
  skip: "Blocked: original numbered-step and print PNG package was not supplied; text walkthroughs do not satisfy this media acceptance.",
}, () => {});

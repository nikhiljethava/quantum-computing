/**
 * Content, original-asset integrity, canonical links, and existing route wiring.
 * These checks validate the supplied DOCX stills, not the missing reviewed
 * MP4/GIF/numbered-step/print package or its independent numerical fixtures.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const frontend = fileURLToPath(new URL("../", import.meta.url));
const repository = path.resolve(frontend, "../..");
const publicDirectory = path.join(frontend, "public");
const sourceDirectory = path.join(repository, "incoming/article4-kit/article4-v9");
const assetRoot = "/articles/04-qubit-technologies/v9";
const expectedIds = ["sampling", "scheduling", "transmon", "ions", "routing", "blockade", "photonics", "loss", "phase", "entanglement"];
// Pinned from the independently inspected DOCX ZIP members before renaming.
const originalPngHashes = {
  "cover.png": "9393cc856be681f13f9357f306d95ede57b98f2f08808d28e69ffc2a61388a95",
  "sampling.png": "759f068f811e194753b024f8c05dd3cd3b64c7448f75047ab323b16f2620ef86",
  "scheduling.png": "d08ccd5338dca05fcef67f4ad8c6bcd7a9943857a99c27d3a5ab2a5358350255",
  "transmon.png": "21cf3dff337ea903c654719005f136d688cd2fad702e5a635820693beff3e7b7",
  "ions.png": "c3f7822b2bceffe927867bec30e9bf590cf0ea2455905e9f01f1f0cd1a948d3e",
  "routing.png": "d691742d58321ee5192213d7f621bd1e41b49857eb0fc3bc80dba5a0a496c7e9",
  "blockade.png": "d58a1ea8ec67763f802a93eb917217bf2fe7c6a4a7bbe0918e238331a16bfece",
  "photonics.png": "373e0bc56565742b9f018a40bb942ed2b24c82a819f5f875054bed43279501e8",
  "loss.png": "8e45274e74e7a23033e62f1e65cce5511d31e377426843f1b2303fb1f89cd4e9",
  "phase.png": "ad1d2184e19ba2443702a21934012a86244324776735704ff1ba8667423aed40",
  "entanglement.png": "a3d092e568dbbdcd4082bb11ad474352b19d806e618fb79eaaf6484387acce7c",
};

function loadTypeScript(relativePath, imports = {}, env = {}) {
  const source = readFileSync(path.join(frontend, relativePath), "utf8");
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: relativePath,
    reportDiagnostics: true,
  });
  assert.equal(diagnostics?.length ?? 0, 0, `Transpilation diagnostics in ${relativePath}`);
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    URL,
    process: { env },
    require(name) {
      if (Object.hasOwn(imports, name)) return imports[name];
      if (name === "react/jsx-runtime") return require(name);
      throw new Error(`Unexpected dependency ${name} in ${relativePath}`);
    },
  }, { filename: relativePath });
  return exports;
}

function plain(value) { return JSON.parse(JSON.stringify(value)); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function nonempty(value, description) {
  assert.equal(typeof value, "string", description);
  assert.ok(value.trim().length > 0, description);
}

const referenceBytes = readFileSync(path.join(frontend, "src/content/article4-sources.json"));
const sources = JSON.parse(referenceBytes);
const content = loadTypeScript("src/content/article4.ts", { "./article4-sources.json": sources });
const lessons = content.ARTICLE4_LESSONS;
const manifest = JSON.parse(readFileSync(path.join(publicDirectory, assetRoot, "manifest.json"), "utf8"));
const intakeManifest = JSON.parse(readFileSync(path.join(sourceDirectory, "media-manifest.json"), "utf8"));

test("exactly ten V9 lessons have complete readable content and safe next lessons", () => {
  assert.equal(content.ARTICLE4_REVISION, "article4-v9");
  assert.deepEqual(plain(content.ARTICLE4_LESSON_IDS), expectedIds);
  assert.deepEqual(lessons.map(lesson => lesson.id).join(","), expectedIds.join(","));
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, 10);
  for (const lesson of lessons) {
    for (const key of ["title", "question", "takeaway", "shows", "doesNotShow"]) nonempty(lesson[key], `${lesson.id}: ${key}`);
    assert.ok(lesson.paragraphs.length >= 1 && lesson.paragraphs.length <= 2, `${lesson.id}: compact main explanation`);
    for (const paragraph of lesson.paragraphs) nonempty(paragraph, `${lesson.id}: main paragraph`);
    assert.ok(lesson.technical.paragraphs.length > 0, `${lesson.id}: technical explanation`);
    assert.ok(lesson.technical.equations.length > 0, `${lesson.id}: technical equations`);
    for (const text of [...lesson.technical.paragraphs, ...lesson.technical.equations]) nonempty(text, `${lesson.id}: technical text`);
    assert.ok(expectedIds.includes(lesson.nextLessonId), `${lesson.id}: next lesson exists`);
    assert.notEqual(lesson.nextLessonId, lesson.id, `${lesson.id}: next lesson advances`);
  }
});

test("five eligible lessons map to exactly four tools, with one shared Optics tool", () => {
  assert.deepEqual(plain(Object.fromEntries(lessons.filter(lesson => lesson.tool).map(lesson => [lesson.id, lesson.tool]))), {
    sampling: "sampling", scheduling: "scheduling", routing: "routing", photonics: "optics", loss: "optics",
  });
  assert.deepEqual([...new Set(lessons.flatMap(lesson => lesson.tool ? [lesson.tool] : []))].sort(), ["optics", "routing", "sampling", "scheduling"]);
  for (const id of ["transmon", "ions", "blockade", "phase", "entanglement"]) {
    assert.equal(lessons.find(lesson => lesson.id === id).tool, undefined, `${id}: no unimplemented Explore mode`);
  }
});

test("all ten lesson still stems exist inside the frontend build context", () => {
  const sourceCaptions = new Map(intakeManifest.filter(item => item.lesson_id).map(item => [item.lesson_id, item.caption]));
  for (const lesson of lessons) {
    assert.equal(lesson.media.still, `${assetRoot}/${lesson.id}.png`);
    assert.equal(existsSync(path.join(publicDirectory, lesson.media.still)), true);
    nonempty(lesson.media.alt, `${lesson.id}: accessible image explanation`);
    assert.equal(lesson.media.caption, sourceCaptions.get(lesson.id), `${lesson.id}: original scientific caption preserved`);
    assert.equal(lesson.media.steps.length, 4, `${lesson.id}: four manual textual steps`);
    assert.equal(new Set(lesson.media.steps.map(step => step.text)).size, 4, `${lesson.id}: distinct steps`);
    for (const step of lesson.media.steps) nonempty(step.text, `${lesson.id}: step text`);
    for (const optionalPath of [lesson.media.mp4, lesson.media.gif, lesson.media.print, ...lesson.media.steps.map(step => step.image)]) {
      if (!optionalPath) continue;
      assert.match(optionalPath, /^\/articles\/04-qubit-technologies\/v9\/[a-z0-9_-]+\.(mp4|gif|png)$/);
      assert.equal(existsSync(path.join(publicDirectory, optionalPath)), true, `${lesson.id}: declared assets must exist`);
    }
  }
});

test("11 published PNGs preserve original bytes and independently pinned SHA-256 provenance", () => {
  assert.equal(manifest.articleRevision, "article4-v9");
  assert.equal(manifest.scientificReviewDate, null, "Import does not create a scientific review date");
  assert.equal(manifest.files.length, 11);
  assert.deepEqual(manifest.files.map(item => item.path).sort(), Object.keys(originalPngHashes).sort());
  for (const item of manifest.files) {
    const published = readFileSync(path.join(publicDirectory, assetRoot, item.path));
    const original = readFileSync(path.join(repository, item.sourcePath));
    assert.equal(published.compare(original), 0, `${item.path}: source bytes unchanged`);
    assert.equal(published.length, item.byteCount, `${item.path}: manifest byte count`);
    assert.equal(sha256(published), originalPngHashes[item.path], `${item.path}: original DOCX digest`);
    assert.equal(item.sha256, originalPngHashes[item.path], `${item.path}: manifest digest`);
    assert.equal(published.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${item.path}: PNG signature`);
    assert.equal(published.readUInt32BE(16), item.lessonId ? 1240 : 1600, `${item.path}: original width`);
    assert.equal(published.readUInt32BE(20), item.lessonId === "loss" ? 515 : item.lessonId ? 490 : 749, `${item.path}: original height`);
  }
});

test("41 source IDs, citation text and links remain identical to supplied V9 references", () => {
  assert.equal(referenceBytes.compare(readFileSync(path.join(sourceDirectory, "references.json"))), 0);
  assert.equal(sources.length, 41);
  assert.deepEqual(sources.map(source => source.id), Array.from({ length: 41 }, (_, index) => `[${index + 1}]`));
  for (const source of sources) {
    assert.equal(source.id, `[${source.number}]`);
    assert.ok(source.text.startsWith(source.id));
    assert.ok(source.links.length > 0);
    for (const link of source.links) {
      nonempty(link.text, `${source.id}: link title`);
      const url = new URL(link.url);
      assert.equal(url.protocol, "https:");
      assert.equal(url.username, "");
      assert.equal(url.password, "");
    }
  }
});

test("every lesson and comparison cites existing original IDs without duplicate citations", () => {
  const ids = new Set(sources.map(source => source.id));
  const records = [...lessons, ...content.ARTICLE4_TECHNOLOGY_COMPARISON, ...content.ARTICLE4_ALGORITHM_COMPARISON];
  for (const record of records) {
    const label = record.id ?? record.technology ?? record.method;
    assert.ok(record.sourceIds.length > 0, `${label}: references`);
    assert.equal(new Set(record.sourceIds).size, record.sourceIds.length, `${label}: unique references`);
    for (const id of record.sourceIds) assert.ok(ids.has(id), `${label}: ${id} resolves to V9`);
  }
  assert.deepEqual(content.ARTICLE4_TECHNOLOGY_COMPARISON.map(row => row.technology).join(","), "Superconducting circuits,Trapped ions,Neutral atoms,Photonics");
  assert.deepEqual(content.ARTICLE4_ALGORITHM_COMPARISON.map(row => row.method).join(","), "VQE,SQD,Digital QAOA,Analog Rydberg MIS,Demanding chemistry QPE");
  assert.match(content.ARTICLE4_COMPARISON_NOTE, /not rankings/i);
});

const series = loadTypeScript("src/content/series.ts");

test("canonical article links hide absent, malformed, non-HTTPS and credential-bearing values", () => {
  for (const value of [undefined, null, "", " ", "article-four", "/series/04-qubit-technologies", "//example.com/article", "https://", "https://example.com:invalid/", "http://example.com/article", "javascript:alert(1)", "data:text/html,test", "file:///article", "https://user@example.com/article", "https://user:secret@example.com/article", "https://:secret@example.com/article", "https://us%65r@example.com/article"]) {
    assert.equal(series.configuredArticleUrl(value), null, `Reject ${String(value)}`);
  }
});

test("canonical article links accept and normalize configured absolute HTTPS URLs", () => {
  for (const [value, expected] of [
    ["https://example.com", "https://example.com/"],
    ["https://EXAMPLE.com:443/p/article-four", "https://example.com/p/article-four"],
    ["https://example.com/p/article-four?edition=v9#reading-guide", "https://example.com/p/article-four?edition=v9#reading-guide"],
  ]) assert.equal(series.configuredArticleUrl(value), expected);
});

test("shared registry contains exactly one Article 4 companion and preserves Articles 1 and 2", () => {
  for (const [slug, sequence] of [["01-platform-problem", 1], ["02-hybrid-computing", 2], ["04-qubit-technologies", 4]]) {
    assert.equal(series.SERIES_ARTICLES.filter(article => article.slug === slug).length, 1);
    assert.equal(series.SERIES_COMPANIONS.filter(companion => companion.articleSlug === slug).length, 1);
    assert.equal(series.getSeriesArticle(slug).sequence, sequence);
    assert.ok(series.getSeriesCompanion(slug));
  }
  assert.equal(series.getSeriesCompanion("04-qubit-technologies").kind, "QUBIT_TECHNOLOGIES");
  assert.equal(series.getSeriesCompanion("01-platform-problem").interactiveModule.kind, "PLATFORM_ARCHITECTURE");
  assert.equal(series.getSeriesCompanion("02-hybrid-computing").interactiveModule.kind, "HYBRID_WORKFLOW");
  assert.equal(series.getSeriesArticle("not-a-lesson"), null);
  assert.equal(series.getSeriesCompanion("not-a-lesson"), null);
  assert.equal(series.getSeriesArticle("04-qubit-technologies").canonicalArticleUrl, null);
});

test("registry uses Article 4 build configuration independently of Articles 1 and 2", () => {
  const configured = loadTypeScript("src/content/series.ts", {}, {
    NEXT_PUBLIC_SERIES_ARTICLE_01_URL: "https://example.com/p/one",
    NEXT_PUBLIC_SERIES_ARTICLE_02_URL: "https://example.com/p/two",
    NEXT_PUBLIC_SERIES_ARTICLE_04_URL: "https://example.com/p/four",
  });
  assert.equal(configured.getSeriesArticle("01-platform-problem").canonicalArticleUrl, "https://example.com/p/one");
  assert.equal(configured.getSeriesArticle("02-hybrid-computing").canonicalArticleUrl, "https://example.com/p/two");
  assert.equal(configured.getSeriesArticle("04-qubit-technologies").canonicalArticleUrl, "https://example.com/p/four");
  const invalid = loadTypeScript("src/content/series.ts", {}, { NEXT_PUBLIC_SERIES_ARTICLE_04_URL: "https://user:secret@example.com/four" });
  assert.equal(invalid.getSeriesArticle("04-qubit-technologies").canonicalArticleUrl, null);
});

const Article4Companion = () => null;
const SeriesCompanionExperience = () => null;
const route = loadTypeScript("src/app/series/[slug]/page.tsx", {
  "@/content/series": series,
  "@/components/article4/Article4Companion": { Article4Companion },
  "@/components/series/SeriesCompanionExperience": { SeriesCompanionExperience },
  "next/navigation": { notFound() { throw new Error("Route not found"); } },
});

test("existing dynamic route generates one Article 4 path and its matching metadata", async () => {
  const parameters = route.generateStaticParams();
  assert.equal(parameters.filter(item => item.slug === "04-qubit-technologies").length, 1);
  const metadata = await route.generateMetadata({ params: Promise.resolve({ slug: "04-qubit-technologies" }) });
  assert.equal(metadata.alternates.canonical, "/series/04-qubit-technologies");
  assert.ok(metadata.title.startsWith(content.ARTICLE4_TITLE));
  assert.equal(metadata.description, series.getSeriesArticle("04-qubit-technologies").summary);
});

test("existing dynamic route dispatches Article 4 explicitly and retains earlier companion rendering", async () => {
  const article4 = await route.default({ params: Promise.resolve({ slug: "04-qubit-technologies" }) });
  assert.equal(article4.type, Article4Companion);
  assert.equal(article4.props.article, series.getSeriesArticle("04-qubit-technologies"));
  for (const slug of ["01-platform-problem", "02-hybrid-computing"]) {
    const existing = await route.default({ params: Promise.resolve({ slug }) });
    assert.equal(existing.type, SeriesCompanionExperience);
    assert.equal(existing.props.companion, series.getSeriesCompanion(slug));
  }
  await assert.rejects(route.default({ params: Promise.resolve({ slug: "missing" }) }), /Route not found/);
});

test("sitemap derives the companion URL from the shared registry and configured origin", () => {
  const sitemap = loadTypeScript("src/app/sitemap.ts", {
    "@/content/series": series,
    "@/content/lessons": { LESSON_PATHS: [], LESSONS: [] },
    "@/content/use-case-pages": { USE_CASE_PAGES: [] },
  }, { NEXT_PUBLIC_SITE_URL: "https://preview.example.test" }).default();
  for (const slug of ["01-platform-problem", "02-hybrid-computing", "04-qubit-technologies"]) {
    assert.equal(sitemap.filter(entry => entry.url === `https://preview.example.test/series/${slug}`).length, 1);
  }
});

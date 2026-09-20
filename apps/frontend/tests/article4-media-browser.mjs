/**
 * Genuine browser lifecycle tests of the real TeachingMedia component using
 * SYNTHETIC test fixtures. No fixture is a reviewed Article 4 animation.
 * Everything generated lives in an OS temporary directory and is removed.
 * Passing this suite does not unblock the missing original-media acceptance.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const frontend = fileURLToPath(new URL("../", import.meta.url));
const assetRoot = "/articles/04-qubit-technologies/v9";
let temporaryDirectory;
let browser;
let server;
let baseUrl;
let fixtureBytes;

async function transpile(sourcePath, targetPath) {
  const source = await readFile(sourcePath, "utf8");
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });
  assert.equal(diagnostics?.length ?? 0, 0, `Test-harness transpilation: ${sourcePath}: ${diagnostics?.map(item => ts.flattenDiagnosticMessageText(item.messageText, " ")).join("; ")}`);
  await writeFile(targetPath, outputText);
}

async function bundleHarness() {
  await transpile(path.join(frontend, "src/components/article4/TeachingMedia.tsx"), path.join(temporaryDirectory, "TeachingMedia.js"));
  await transpile(path.join(frontend, "src/content/article4.ts"), path.join(temporaryDirectory, "article4.js"));
  await copyFile(path.join(frontend, "src/content/article4-sources.json"), path.join(temporaryDirectory, "article4-sources.json"));
  const entry = `
    import React, { StrictMode, useState } from "react";
    import { createRoot } from "react-dom/client";
    import { TeachingMedia } from "./TeachingMedia.js";
    import { ARTICLE4_LESSONS, ARTICLE4_ASSET_ROOT } from "./article4.js";
    function Harness() {
      const [id, setId] = useState("sampling");
      const [mode, setMode] = useState("watch");
      const [liveInput, setLiveInput] = useState("100");
      const [mounted, setMounted] = useState(true);
      const query = new URLSearchParams(location.search);
      const original = ARTICLE4_LESSONS.find(item => item.id === id);
      const stem = ARTICLE4_ASSET_ROOT + "/synthetic-" + id;
      const lesson = { ...original, media: {
        ...original.media,
        still: query.has("brokenStill") ? ARTICLE4_ASSET_ROOT + "/synthetic-failure.png" : stem + ".png",
        mp4: query.has("brokenVideo") ? ARTICLE4_ASSET_ROOT + "/synthetic-failure.mp4" : stem + ".mp4",
        gif: query.has("brokenGif") ? ARTICLE4_ASSET_ROOT + "/synthetic-failure.gif" : stem + ".gif",
        steps: original.media.steps.map((step, index) => ({ ...step, image: stem + "_step" + (index + 1) + ".png" })),
      }};
      function observe(format) {
        window.__observedMedia.push(format);
        if (query.get("observer") === "throws") throw new Error("Synthetic observer failure");
        if (query.get("observer") === "rejects") return Promise.reject(new Error("Synthetic observer rejection"));
      }
      return <main>
        <h1>Synthetic TeachingMedia component test</h1>
        <p>These generated fixtures are not supplied or reviewed V9 media.</p>
        <nav aria-label="Synthetic lesson navigation">
          {ARTICLE4_LESSONS.map(lesson => <button key={lesson.id} onClick={() => {setId(lesson.id); setMode("watch");}}>Select {lesson.id}</button>)}
        </nav>
        <div>
          <button onClick={() => setMode("watch")}>Harness Watch</button>
          <button onClick={() => setMode("steps")}>Harness Steps</button>
          <button onClick={() => setMode("explore")}>Harness Explore</button>
          <button onClick={() => setMounted(value => !value)}>{mounted ? "Unmount scene" : "Mount scene"}</button>
        </div>
        {mode === "explore" ? <label>Synthetic live sample input<input value={liveInput} onChange={event => setLiveInput(event.target.value)} /></label> : null}
        {mounted && mode !== "explore" ? <TeachingMedia lesson={lesson} mode={mode} onMediaPlay={observe} /> : null}
      </main>;
    }
    window.__observedMedia = [];
    createRoot(document.getElementById("root")).render(<StrictMode><Harness /></StrictMode>);
  `;
  const harnessTsx = path.join(temporaryDirectory, "harness.tsx");
  await writeFile(harnessTsx, entry);
  await transpile(harnessTsx, path.join(temporaryDirectory, "entry.js"));
  const compiler = webpack({
    mode: "development",
    target: "web",
    devtool: false,
    entry: path.join(temporaryDirectory, "entry.js"),
    output: { path: temporaryDirectory, filename: "bundle.js" },
    resolve: {
      modules: [path.join(frontend, "node_modules"), "node_modules"],
      alias: { "@/content/article4": path.join(temporaryDirectory, "article4.js") },
    },
    plugins: [new webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
  });
  try {
    await new Promise((resolve, reject) => compiler.run((error, stats) => {
      if (error) return reject(error);
      if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })));
      resolve();
    }));
  } finally {
    await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()));
  }
}

async function generateSyntheticFixtures() {
  const page = await browser.newPage();
  try {
    const generated = await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const context = canvas.getContext("2d");
      const image = (label, color) => {
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "white";
        context.font = "24px sans-serif";
        context.fillText("SYNTHETIC TEST", 25, 60);
        context.fillText(label, 25, 110);
        return canvas.toDataURL("image/png").split(",")[1];
      };
      const pngs = [image("Still", "#164e63"), image("Step 1", "#1e40af"), image("Step 2", "#5b21b6"), image("Step 3", "#9a3412"), image("Step 4", "#166534")];
      const mime = ["video/mp4;codecs=avc1.42E01E", "video/mp4"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mime) throw new Error("Browser cannot encode a synthetic MP4 fixture; original-media checks remain blocked.");
      const stream = canvas.captureStream(12);
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 100_000 });
      const chunks = [];
      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = event => reject(new Error(event.error?.message ?? "Synthetic recording failed"));
      });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.start();
      for (let frame = 0; frame < 18; frame++) {
        image("Frame " + frame, frame % 2 === 0 ? "#1e40af" : "#5b21b6");
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      recorder.stop();
      await stopped;
      stream.getTracks().forEach(track => track.stop());
      const bytes = new Uint8Array(await new Blob(chunks, { type: mime }).arrayBuffer());
      return { pngs, mp4: Array.from(bytes), mime };
    });
    const mp4 = Buffer.from(generated.mp4);
    assert.ok(mp4.length > 500, "A real synthetic MP4 was encoded");
    assert.equal(mp4.subarray(4, 8).toString(), "ftyp", "Synthetic video has an MP4 file-type box");
    // A two-frame 1×1 GIF89a with red/blue frames and a looping extension.
    // Generated test bytes, never presented as a V9 teaching animation.
    const gif = Buffer.concat([
      Buffer.from("GIF89a"), Buffer.from([1, 0, 1, 0, 0x80, 0, 0, 255, 0, 0, 0, 0, 255]),
      Buffer.from([0x21, 0xff, 11]), Buffer.from("NETSCAPE2.0"), Buffer.from([3, 1, 0, 0, 0]),
      ...[0x44, 0x4c].map(pixel => Buffer.from([0x21, 0xf9, 4, 0, 10, 0, 0, 0, 0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, pixel, 1, 0])),
      Buffer.from([0x3b]),
    ]);
    const pngs = generated.pngs.map(data => Buffer.from(data, "base64"));
    await writeFile(path.join(temporaryDirectory, "synthetic.mp4"), mp4);
    await writeFile(path.join(temporaryDirectory, "synthetic.gif"), gif);
    await Promise.all(pngs.map((bytes, index) => writeFile(path.join(temporaryDirectory, `synthetic-${index}.png`), bytes)));
    fixtureBytes = { mp4, gif, pngs };
    console.info(`Synthetic fixture generation: ${mp4.length} MP4 bytes (${generated.mime}), ${gif.length} animated GIF bytes, 5 distinct PNGs. Reviewed V9 moving assets remain unavailable.`);
  } finally {
    await page.close();
  }
}

async function serveHarness() {
  const bundle = await readFile(path.join(temporaryDirectory, "bundle.js"));
  const html = Buffer.from(`<!doctype html><html><head><meta charset="utf-8"><title>Synthetic Article 4 media tests</title><style>body{font-family:system-ui;max-width:900px;margin:20px auto}button{padding:10px;margin:4px}img,video{max-width:100%;height:auto}button:focus-visible{outline:3px solid blue}figure{margin:0}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    let bytes;
    let type;
    if (url.pathname === "/") { bytes = html; type = "text/html"; }
    else if (url.pathname === "/bundle.js") { bytes = bundle; type = "text/javascript"; }
    else if (url.pathname.startsWith(`${assetRoot}/synthetic-`) && !url.pathname.includes("failure")) {
      if (url.pathname.endsWith(".mp4")) { bytes = fixtureBytes.mp4; type = "video/mp4"; }
      else if (url.pathname.endsWith(".gif")) { bytes = fixtureBytes.gif; type = "image/gif"; }
      else if (url.pathname.endsWith(".png")) {
        const step = /_step([1-4])\.png$/.exec(url.pathname);
        bytes = fixtureBytes.pngs[step ? Number(step[1]) : 0];
        type = "image/png";
      }
    }
    if (!bytes) { response.writeHead(404); response.end("Synthetic missing-media fixture"); return; }
    const headers = { "Content-Type": type, "Cache-Control": "no-store", "Accept-Ranges": "bytes" };
    const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? "");
    if (range) {
      const start = Number(range[1]);
      const end = Math.min(range[2] ? Number(range[2]) : bytes.length - 1, bytes.length - 1);
      if (start > end) { response.writeHead(416, { "Content-Range": `bytes */${bytes.length}` }); response.end(); return; }
      response.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${bytes.length}`, "Content-Length": end - start + 1 });
      response.end(bytes.subarray(start, end + 1));
    } else {
      response.writeHead(200, { ...headers, "Content-Length": bytes.length });
      response.end(bytes);
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(tmpdir(), "qf-article4-synthetic-media-"));
  const override = process.env.ARTICLE4_CHROME_PATH;
  const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const executablePath = override ?? (existsSync(chromium.executablePath()) ? undefined : existsSync(systemChrome) ? systemChrome : undefined);
  browser = await chromium.launch({ headless: true, executablePath });
  await bundleHarness();
  await generateSyntheticFixtures();
  await serveHarness();
}, { timeout: 60000 });

after(async () => {
  await browser?.close();
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

async function withPage(run, query = "", options = {}) {
  const context = await browser.newContext(options);
  const requests = [];
  context.on("request", request => requests.push(new URL(request.url()).pathname));
  await context.addInitScript(() => {
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function (...args) {
      this.__testPauseCalls = (this.__testPauseCalls ?? 0) + 1;
      return pause.apply(this, args);
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto(`${baseUrl}/${query}`, { waitUntil: "networkidle" });
    await page.getByTestId("teaching-media").waitFor();
    await run(page, requests);
    assert.deepEqual(errors, [], "No uncaught errors from synthetic component lifecycle");
  } finally { await context.close(); }
}

async function startVideo(page) {
  await page.getByRole("button", { name: "Play video", exact: true }).click();
  await page.locator("video").waitFor();
  await page.waitForFunction(() => {
    const video = document.querySelector("video");
    return video && video.readyState >= 2 && !video.paused;
  });
}
async function retainVideo(page) {
  await page.evaluate(() => {
    window.__previousVideo = document.querySelector("video");
    window.__pauseCallsBefore = window.__previousVideo.__testPauseCalls ?? 0;
  });
}
async function assertUnloaded(page) {
  const result = await page.evaluate(() => ({
    connected: window.__previousVideo.isConnected,
    paused: window.__previousVideo.paused,
    source: window.__previousVideo.getAttribute("src"),
    pauseWasCalled: (window.__previousVideo.__testPauseCalls ?? 0) > window.__pauseCallsBefore,
  }));
  assert.deepEqual(result, { connected: false, paused: true, source: null, pauseWasCalled: true });
}
async function assertLoadedImage(page, suffix) {
  await page.waitForFunction(expected => {
    const image = document.querySelector('[data-testid="teaching-media"] img');
    return image?.complete && image.naturalWidth > 0 && image.getAttribute("src").endsWith(expected);
  }, suffix);
}

test("SYNTHETIC: initial and reduced-motion views request no MP4 or GIF", { timeout: 30000 }, async () => {
  for (const reducedMotion of ["no-preference", "reduce"]) await withPage(async (page, requests) => {
    await assertLoadedImage(page, "/synthetic-sampling.png");
    assert.equal(await page.locator("video").count(), 0);
    assert.deepEqual(requests.filter(url => /\.(mp4|gif)$/.test(url)), []);
    assert.equal(await page.getByTestId("missing-moving-media").count(), 0, "Only test fixture lesson has complete moving assets");
  }, "", { reducedMotion });
});

test("SYNTHETIC: explicit Play loads only the selected MP4 and uses native inline controls", { timeout: 20000 }, async () => withPage(async (page, requests) => {
  await startVideo(page);
  const attributes = await page.locator("video").evaluate(video => ({ controls: video.controls, inline: video.playsInline, preload: video.preload, autoplay: video.autoplay }));
  assert.deepEqual(attributes, { controls: true, inline: true, preload: "none", autoplay: false });
  const moving = [...new Set(requests.filter(url => /\.(mp4|gif)$/.test(url)))];
  assert.deepEqual(moving, [`${assetRoot}/synthetic-sampling.mp4`]);
  assert.deepEqual(await page.evaluate(() => window.__observedMedia), ["mp4"]);
  await retainVideo(page);
  await page.getByRole("button", { name: "Stop and show still", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-sampling.png");
  await assertUnloaded(page);
}));

test("SYNTHETIC: lesson change pauses and unloads the old video without loading the next clip", { timeout: 20000 }, async () => withPage(async (page, requests) => {
  await startVideo(page);
  await retainVideo(page);
  await page.getByRole("button", { name: "Select ions", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-ions.png");
  await assertUnloaded(page);
  assert.equal(await page.locator("video").count(), 0);
  assert.equal(requests.some(url => url.endsWith("/synthetic-ions.mp4")), false);
}));

test("SYNTHETIC: Explore unmounts moving media and returning to Watch preserves separate live input", { timeout: 20000 }, async () => withPage(async page => {
  await page.getByRole("button", { name: "Harness Explore", exact: true }).click();
  await page.getByLabel("Synthetic live sample input").fill("10000");
  await page.getByRole("button", { name: "Harness Watch", exact: true }).click();
  assert.match(await page.getByTestId("teaching-media").textContent(), /Watch the preset example/);
  await startVideo(page);
  await retainVideo(page);
  await page.getByRole("button", { name: "Harness Explore", exact: true }).click();
  await page.getByLabel("Synthetic live sample input").waitFor();
  assert.equal(await page.getByLabel("Synthetic live sample input").inputValue(), "10000");
  assert.equal(await page.getByTestId("teaching-media").count(), 0);
  await assertUnloaded(page);
}));

test("SYNTHETIC: explicit GIF replaces video, and Stop removes it and restores the still", { timeout: 20000 }, async () => withPage(async (page, requests) => {
  await startVideo(page);
  await retainVideo(page);
  assert.equal(requests.some(url => url.endsWith(".gif")), false);
  await page.getByRole("button", { name: "Use GIF alternative", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-sampling.gif");
  await assertUnloaded(page);
  assert.equal(await page.getByRole("button", { name: /pause.*gif/i }).count(), 0);
  await page.getByRole("button", { name: "Stop and show still", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-sampling.png");
  assert.equal(await page.locator('img[src$=".gif"]').count(), 0);
  assert.deepEqual(await page.evaluate(() => window.__observedMedia), ["mp4", "gif"]);
}));

test("SYNTHETIC: lesson and step-mode changes remove an active GIF", { timeout: 20000 }, async () => withPage(async page => {
  await page.getByRole("button", { name: "Use GIF alternative", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-sampling.gif");
  await page.getByRole("button", { name: "Select ions", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-ions.png");
  assert.equal(await page.locator('img[src$=".gif"]').count(), 0);
  await page.getByRole("button", { name: "Use GIF alternative", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-ions.gif");
  await page.getByRole("button", { name: "Harness Steps", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-ions_step1.png");
  assert.equal(await page.locator('img[src$=".gif"]').count(), 0);
}));

test("SYNTHETIC: failed MP4 and GIF return to a usable still and explanation", { timeout: 30000 }, async () => {
  for (const [query, button] of [["?brokenVideo", "Play video"], ["?brokenGif", "Use GIF alternative"]]) await withPage(async page => {
    await page.getByRole("button", { name: button, exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Playback could not continue" }).waitFor();
    await assertLoadedImage(page, "/synthetic-sampling.png");
    assert.equal(await page.locator("video").count(), 0);
    assert.equal(await page.locator('img[src$=".gif"]').count(), 0);
    assert.match(await page.locator("figcaption").textContent(), /not energies measured on quantum hardware/);
  }, query);
});

test("SYNTHETIC: four manual steps synchronize image, explanation and keyboard selection", { timeout: 20000 }, async () => withPage(async page => {
  await startVideo(page);
  await retainVideo(page);
  await page.getByRole("button", { name: "Harness Steps", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-sampling_step1.png");
  await assertUnloaded(page);
  assert.equal(await page.getByTestId("missing-step-images").count(), 0);
  const texts = [];
  for (let step = 1; step <= 4; step++) {
    const button = page.getByRole("button", { name: `Step ${step}`, exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    await assertLoadedImage(page, `/synthetic-sampling_step${step}.png`);
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    const text = await page.locator("#sampling-step-text").textContent();
    assert.match(text, new RegExp(`Step ${step} of 4`));
    texts.push(text);
  }
  assert.equal(new Set(texts).size, 4);
  assert.equal(await page.getByRole("button", { name: "Next step", exact: true }).isDisabled(), true);
  await page.getByRole("button", { name: "Step 2", exact: true }).click();
  await assertLoadedImage(page, "/synthetic-sampling_step2.png");
  await page.waitForTimeout(250);
  assert.equal(await page.getByRole("button", { name: "Step 2", exact: true }).getAttribute("aria-pressed"), "true", "No automatic advancement");
}));

test("SYNTHETIC: throwing or rejecting playback observers cannot block native playback", { timeout: 30000 }, async () => {
  for (const kind of ["throws", "rejects"]) await withPage(async page => {
    await startVideo(page);
    assert.deepEqual(await page.evaluate(() => window.__observedMedia), ["mp4"]);
  }, `?observer=${kind}`);
});

test("SYNTHETIC: missing still retains the accessible explanation instead of an empty frame", { timeout: 15000 }, async () => withPage(async page => {
  const fallback = page.getByRole("status").filter({ hasText: "The image could not load" });
  await fallback.waitFor();
  assert.match(await fallback.textContent(), /increasing sample size narrows the spread without removing the offset/);
  assert.match(await page.locator("figcaption").textContent(), /reference and offset are chosen/);
}, "?brokenStill"));

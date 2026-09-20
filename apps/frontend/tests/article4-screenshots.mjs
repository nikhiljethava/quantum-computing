import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.ARTICLE4_BASE_URL ?? "http://127.0.0.1:3000";
const directory = fileURLToPath(new URL("../../../docs/screenshots/", import.meta.url));
await mkdir(directory, { recursive: true });
const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.ARTICLE4_CHROME_PATH ?? (existsSync(chromium.executablePath()) ? undefined : existsSync(systemChrome) ? systemChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath });
try {
  for (const [kind, width, height] of [["desktop", 1440, 1100], ["mobile", 360, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    await context.route(/\/api\//, route => route.abort("connectionfailed"));
    const page = await context.newPage();
    await page.goto(`${baseUrl}/series/04-qubit-technologies?lesson=sampling&level=100`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await page.locator("#sampling-N").waitFor();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(directory, `article4-${kind}-hero.png`) });
    const scrollBelowHeader = element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - document.querySelector("header").getBoundingClientRect().height - 18, behavior: "instant" });
    await page.locator(".a4-lesson").evaluate(scrollBelowHeader);
    await page.screenshot({ path: path.join(directory, `article4-${kind}-lesson.png`) });
    if (kind === "mobile") {
      await page.locator('section[aria-label="Sampling tool"]').evaluate(scrollBelowHeader);
      await page.screenshot({ path: path.join(directory, "article4-mobile-tool.png") });
      await page.locator('section[aria-label="Sampling tool"] figure').evaluate(scrollBelowHeader);
      await page.screenshot({ path: path.join(directory, "article4-mobile-results.png") });
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(directory, `article4-${kind}-full.png`), fullPage: true });
    console.log(`Captured ${kind} at ${width}×${height}, default sampling inputs, API unavailable.`);
    await context.close();
  }
} finally {
  await browser.close();
}

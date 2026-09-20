// Inspect an actual completed Next production build, not source-string plumbing.
// The expected article URL is empty for the absent/invalid configuration cases.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(path.join(frontend, ".next/server/app/series/04-qubit-technologies.html"), "utf8");
const sitemap = readFileSync(path.join(frontend, ".next/server/app/sitemap.xml.body"), "utf8");
const expectedArticle = process.env.ARTICLE4_EXPECTED_ARTICLE_URL ?? "";
const expectedOrigin = process.env.ARTICLE4_EXPECTED_SITE_ORIGIN;
assert.ok(expectedOrigin, "Set ARTICLE4_EXPECTED_SITE_ORIGIN for this build check");
assert.equal(html.includes("Read the full Article 4"), Boolean(expectedArticle));
if (expectedArticle) assert.ok(html.includes(`href="${expectedArticle.replaceAll("&", "&amp;")}"`));
assert.ok(sitemap.includes(`${expectedOrigin}/series/04-qubit-technologies`));
assert.equal(sitemap.includes("http://localhost:"), expectedOrigin.startsWith("http://localhost:"));
for (const lesson of ["sampling", "scheduling", "transmon", "ions", "routing", "blockade", "photonics", "loss", "phase", "entanglement"]) {
  assert.ok(existsSync(path.join(frontend, `public/articles/04-qubit-technologies/v9/${lesson}.png`)));
}
process.stdout.write(`PASS: production CTA ${expectedArticle ? "matches configured HTTPS fixture" : "hidden"}; sitemap uses expected origin; ten stills are inside frontend build context.\n`);

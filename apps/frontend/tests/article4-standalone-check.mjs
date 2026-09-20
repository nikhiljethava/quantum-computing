// Run against the built standalone server, with public/static copied as Docker does.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const baseUrl = process.env.ARTICLE4_BASE_URL ?? "http://127.0.0.1:3000";
const lessons = ["sampling", "scheduling", "transmon", "ions", "routing", "blockade", "photonics", "loss", "phase", "entanglement", "cover"];
const resources = await Promise.all(lessons.map(async lesson => {
  const pathname = `/articles/04-qubit-technologies/v9/${lesson}.png`;
  const response = await fetch(`${baseUrl}${pathname}`);
  assert.equal(response.status, 200, pathname);
  assert.match(response.headers.get("content-type"), /^image\/png(?:;|$)/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(bytes, await readFile(new URL(`../public${pathname}`, import.meta.url)), pathname);
  return { pathname, status: response.status, contentType: response.headers.get("content-type"), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}));
const report = { baseUrl, checkedAt: new Date().toISOString(), localNode: process.version, localPlatform: process.platform, limitation: "Local standalone server and asset layout verified; no Docker image or production deployment performed.", resources };
await writeFile(new URL("../../../docs/screenshots/article4-standalone-check.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write("PASS: all ten lesson stills and cover return HTTP 200, image/png, and exact source bytes from the local standalone server.\n");

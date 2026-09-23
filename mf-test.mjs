import { Miniflare } from "miniflare";

const ROOT = "/home/hatch/workspace/lisible-deploy/.open-next";
const files = [
  "worker.js",
  "cloudflare/images.js",
  "cloudflare/init.js",
  "cloudflare/skew-protection.js",
  "cloudflare/next-env.mjs",
  "middleware/handler.mjs",
  "middleware/open-next.config.mjs",
  ".build/durable-objects/queue.js",
  ".build/durable-objects/sharded-tag-cache.js",
  ".build/durable-objects/bucket-cache-purge.js",
  "server-functions/default/handler.mjs",
];

const mf = new Miniflare({
  modules: files.map((f) => ({ type: "ESModule", path: `${ROOT}/${f}` })),
  modulesRoot: ROOT,
  compatibilityDate: "2026-08-09",
  compatibilityFlags: ["nodejs_compat"],
});

for (const path of ["/", "/library"]) {
  try {
    const res = await mf.dispatchFetch(`http://localhost${path}`);
    const text = await res.text();
    console.log(path, "->", res.status, text.slice(0, 200));
  } catch (e) {
    console.log(path, "THREW:", e && e.stack ? e.stack.split("\n").slice(0, 10).join("\n") : String(e));
  }
}
await mf.dispose();

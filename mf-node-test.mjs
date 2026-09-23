import { Miniflare } from "miniflare";
const mf = new Miniflare({
  modules: [{ type: "ESModule", path: "/tmp/entry.mjs" }],
  modulesRoot: "/tmp",
  compatibilityDate: "2026-08-09",
  compatibilityFlags: ["nodejs_compat"],
});
const res = await mf.dispatchFetch("http://localhost/");
console.log("status:", res.status, "body:", (await res.text()).slice(0, 200));
await mf.dispose();

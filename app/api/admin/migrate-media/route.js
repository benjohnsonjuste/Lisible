// Migration unique : déplace les images stockées en base64 dans les JSON
// GitHub vers le stockage R2, puis réécrit les fichiers avec des URLs.
// Réservé à l'administration. Rejouable par lots (startAfter + maxFiles).
import { NextResponse } from "next/server";
import { getSessionUser } from "../../_lib/session.js";
import { getMediaBucket, isDataUrl } from "../../_lib/r2.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "cmo.lablitteraire7@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const GH = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN,
};

async function ghGet(path) {
  const res = await fetch(
    `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${GH.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Lisible-Migrate",
      },
      cache: "no-store",
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
  return res.json();
}

async function ghPut(path, content, sha, message) {
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
  const res = await fetch(
    `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GH.token}`,
        "Content-Type": "application/json",
        "User-Agent": "Lisible-Migrate",
      },
      body: JSON.stringify({
        message: `[MEDIA] ${message} [skip ci]`,
        content: btoa(binString),
        sha,
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub PUT ${path}: ${res.status}`);
}

function dataUrlBytes(dataUrl) {
  const b64 = (dataUrl.split(",")[1] || "").replace(/\s/g, "");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function mimeOf(dataUrl) {
  const m = /^data:([^;,]+)?/.exec(dataUrl || "");
  return (m && m[1] && m[1].toLowerCase()) || "image/jpeg";
}

const EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

async function migrateObjectImages(bucket, obj, prefix, stats) {
  const fields = ["image", "photo", "avatar", "cover", "banner"];
  for (const f of fields) {
    if (isDataUrl(obj[f])) {
      const bytes = dataUrlBytes(obj[f]);
      const mime = mimeOf(obj[f]);
      const key = `${prefix}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${EXT[mime] || "jpg"}`;
      await bucket.put(key, bytes, { httpMetadata: { contentType: mime } });
      stats.migrated += 1;
      stats.bytesSaved += obj[f].length;
      obj[f] = `/api/media/${key}`;
    }
    const alt = `${f}Base64`;
    if (alt in obj) delete obj[alt];
  }
  if ("imageBase64" in obj) delete obj.imageBase64;
  return obj;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = await getSessionUser(body.sessionToken);
    if (!session || !ADMIN_EMAILS.includes((session.email || "").toLowerCase())) {
      return NextResponse.json({ error: "Accès réservé à l'administration." }, { status: 403 });
    }
    const bucket = getMediaBucket();
    if (!bucket) {
      return NextResponse.json(
        { error: "R2 non configuré : créez le bucket lisible-media puis redéployez." },
        { status: 503 }
      );
    }

    const scope = body.scope || "all"; // texts | index | users | all
    const maxFiles = Math.min(Number(body.maxFiles) || 50, 200);
    const startAfter = body.startAfter || "";
    const stats = { scanned: 0, migrated: 0, bytesSaved: 0, files: [] };
    let remaining = 0;
    let lastName = startAfter;

    async function handleFile(path, prefix, isArray) {
      const f = await ghGet(path);
      if (!f || !f.content) return;
      const content = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(atob(f.content.replace(/\s/g, "")), (c) => c.charCodeAt(0))
        )
      );
      const before = JSON.stringify(content).length;
      if (isArray && Array.isArray(content)) {
        for (const item of content) await migrateObjectImages(bucket, item, prefix, stats);
      } else {
        await migrateObjectImages(bucket, content, prefix, stats);
      }
      const after = JSON.stringify(content).length;
      if (after < before) {
        await ghPut(path, content, f.sha, `migration R2 ${path}`);
        stats.files.push(path);
      }
      await sleep(400);
    }

    async function handleDir(dir, prefix) {
      const list = await ghGet(dir);
      if (!Array.isArray(list)) return;
      const files = list
        .filter((e) => e.type === "file" && e.name.endsWith(".json") && e.name > startAfter)
        .sort((a, b) => (a.name < b.name ? -1 : 1));
      for (const e of files) {
        if (stats.scanned >= maxFiles) {
          remaining = files.length - stats.scanned;
          lastName = e.name;
          break;
        }
        stats.scanned += 1;
        lastName = e.name;
        try {
          await handleFile(`${dir}/${e.name}`, prefix, false);
        } catch (err) {
          console.error("migration", e.name, err.message);
        }
      }
      if (stats.scanned < files.length && remaining === 0) {
        remaining = files.length - stats.scanned;
      }
    }

    if (scope === "all" || scope === "texts") await handleDir("data/texts", "images");
    if (scope === "all" || scope === "index")
      await handleFile("data/publications/index.json", "images", true);
    if (scope === "all" || scope === "users") await handleDir("data/users", "avatars");

    return NextResponse.json({
      ok: true,
      ...stats,
      bytesSavedMo: +(stats.bytesSaved / 1048576).toFixed(2),
      remaining,
      nextStartAfter: lastName,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

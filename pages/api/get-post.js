// /app/api/get-post/route.js
import { NextResponse } from "next/server";
import { getFile } from "@/lib/githubClient";

function parseFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/m.exec(md);
  if (!m) return { frontmatter: {}, content: md };
  const fmRaw = m[1];
  const content = m[2];
  const fm = {};
  fmRaw.split("\n").forEach(line => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    fm[key] = val;
  });
  return { frontmatter: fm, content };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path"); // e.g. posts/2025-12-01-slug.md
    if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

    const file = await getFile(path);
    if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const md = Buffer.from(file.content, "base64").toString("utf8");
    const parsed = parseFrontmatter(md);
    return NextResponse.json({ ok: true, frontmatter: parsed.frontmatter, content: parsed.content });
  } catch (err) {
    console.error("get-post error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
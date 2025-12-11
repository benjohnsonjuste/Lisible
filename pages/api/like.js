// /app/api/like/route.js
import { NextResponse } from "next/server";
import { getFile, createOrUpdateFile } from "@/lib/githubClient";

export async function POST(req) {
  try {
    const { postPath, username } = await req.json(); // postPath example: posts/2025-12-01-slug.md
    if (!postPath || !username) return NextResponse.json({ error: "postPath and username required" }, { status: 400 });

    // derive id from postPath: e.g. replace slashes and .md
    const id = postPath.replace(/\//g, "__").replace(/\./g, "_");
    const likesPath = `data/likes/${id}.json`;

    const existing = await getFile(likesPath);
    let likes = [];
    let sha = undefined;
    if (existing) {
      sha = existing.sha;
      likes = JSON.parse(Buffer.from(existing.content, "base64").toString("utf8")) || [];
    }

    if (!likes.includes(username)) likes.push(username);

    const contentB64 = Buffer.from(JSON.stringify(likes, null, 2), "utf8").toString("base64");
    await createOrUpdateFile(likesPath, contentB64, `Like ${postPath} by ${username}`, sha);

    return NextResponse.json({ ok: true, likes: likes.length });
  } catch (err) {
    console.error("like error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
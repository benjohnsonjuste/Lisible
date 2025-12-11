// /app/api/comment/route.js
import { NextResponse } from "next/server";
import { getFile, createOrUpdateFile } from "@/lib/githubClient";

export async function POST(req) {
  try {
    const { postPath, username, comment } = await req.json();
    if (!postPath || !username || !comment) return NextResponse.json({ error: "postPath, username, comment required" }, { status: 400 });

    const id = postPath.replace(/\//g, "__").replace(/\./g, "_");
    const commentsPath = `data/comments/${id}.json`;

    const existing = await getFile(commentsPath);
    let comments = [];
    let sha = undefined;
    if (existing) {
      sha = existing.sha;
      comments = JSON.parse(Buffer.from(existing.content, "base64").toString("utf8")) || [];
    }

    const newComment = { author: username, content: comment, date: new Date().toISOString() };
    comments.push(newComment);

    const contentB64 = Buffer.from(JSON.stringify(comments, null, 2), "utf8").toString("base64");
    await createOrUpdateFile(commentsPath, contentB64, `Comment on ${postPath} by ${username}`, sha);

    return NextResponse.json({ ok: true, comments });
  } catch (err) {
    console.error("comment error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
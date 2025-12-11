// /app/api/publish-github/route.js
import { NextResponse } from "next/server";
import { getFile, createOrUpdateFile } from "@/lib/githubClient";

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
function basenameWithoutExt(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, content, authorName, authorEmail, imageBase64, imageName, createdAt } = body;

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO_OWNER || !process.env.GITHUB_REPO_NAME) {
      return NextResponse.json({ error: "Server misconfigured: missing GITHUB_TOKEN / OWNER / NAME" }, { status: 500 });
    }

    if (!title || !content) return NextResponse.json({ error: "title and content required" }, { status: 400 });

    const date = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
    const slug = slugify(title).slice(0, 80) || "post";
    const postPath = `posts/${date}-${slug}.md`;

    let imagePath = null;
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
      let mime = null;
      let b64 = imageBase64;
      if (match) {
        mime = match[1];
        b64 = match[2];
      }
      const approxBytes = Math.ceil((b64.length * 3) / 4);
      const MAX_BYTES = 2 * 1024 * 1024;
      if (approxBytes > MAX_BYTES) return NextResponse.json({ error: "Image size > 2MB" }, { status: 400 });

      const safeName = imageName ? basenameWithoutExt(imageName).replace(/\s+/g, "_") : `${date}-${slug}`;
      const extFromMime = mime ? mime.split("/")[1] : null;
      const ext = extFromMime || (imageName && imageName.split(".").pop()) || "png";
      const finalImageName = `${safeName}.${ext}`;
      imagePath = `images/${finalImageName}`;

      // write image (b64) to repo
      await createOrUpdateFile(imagePath, b64, `Add image for ${postPath}`);
    }

    const imageUrl = imagePath ? `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/${process.env.GITHUB_REPO_BRANCH || "main"}/${imagePath}` : null;

    const md = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${new Date(createdAt || Date.now()).toISOString()}"
author: "${(authorName || "").replace(/"/g, '\\"')}"
email: "${(authorEmail || "").replace(/"/g, '\\"')}"
image: ${imageUrl ? `"${imageUrl}"` : "null"}
---

${content}
`;

    const mdB64 = Buffer.from(md, "utf8").toString("base64");
    await createOrUpdateFile(postPath, mdB64, `Publish post: ${title}`);

    const fileUrl = `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/blob/${process.env.GITHUB_REPO_BRANCH || "main"}/${postPath}`;
    return NextResponse.json({ ok: true, url: fileUrl }, { status: 201 });
  } catch (err) {
    console.error("publish-github error:", err);
    return NextResponse.json({ error: "internal_error", details: String(err) }, { status: 500 });
  }
}
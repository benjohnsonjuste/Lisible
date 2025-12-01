// app/api/publish-github/route.js
import { NextResponse } from "next/server";

/**
 * POST /api/publish-github
 *
 * Exige dans les env:
 * - GITHUB_TOKEN          (token avec scope 'repo' pour écrire dans le repo)
 * - GITHUB_REPO_OWNER     (owner du repo)
 * - GITHUB_REPO_NAME      (nom du repo)
 * - GITHUB_REPO_BRANCH    (branch cible, ex: main) — optionnel, défaut "main"
 *
 * Payload attendu (JSON):
 * {
 *   title, content, authorName, authorEmail,
 *   imageBase64 (data URL or base64), imageName, createdAt
 * }
 *
 * Réponse:
 * { ok: true, url: "https://github.com/…/blob/main/posts/2025-12-01-title.md" }
 */

const GITHUB_API = "https://api.github.com";

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function basenameWithoutExt(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

export async function POST(req) {
  try {
    const env = process.env;
    const token = env.GITHUB_TOKEN;
    const owner = env.GITHUB_REPO_OWNER;
    const repo = env.GITHUB_REPO_NAME;
    const branch = env.GITHUB_REPO_BRANCH || "main";

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GITHUB_TOKEN / OWNER / NAME" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { title, content, authorName, authorEmail, imageBase64, imageName, createdAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    // create slug and file path
    const date = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
    const slug = slugify(title).slice(0, 80) || "post";
    const postPath = `posts/${date}-${slug}.md`;

    // If image provided, validate size roughly (base64 length)
    let imagePath = null;
    if (imageBase64) {
      // imageBase64 may be "data:image/png;base64,...." or just base64
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
      let mime = null;
      let b64 = imageBase64;
      if (match) {
        mime = match[1];
        b64 = match[2];
      }
      // approximate bytes
      const approxBytes = Math.ceil((b64.length * 3) / 4);
      const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
      if (approxBytes > MAX_BYTES) {
        return NextResponse.json(
          { error: "Image trop grande. Maximum 2 MB" },
          { status: 400 }
        );
      }

      // sanitize imageName
      const safeName = imageName
        ? basenameWithoutExt(imageName).replace(/\s+/g, "_")
        : `${date}-${slug}`;
      const extFromMime = mime ? mime.split("/")[1] : null;
      const ext = extFromMime || (imageName && imageName.split(".").pop()) || "png";
      const finalImageName = `${safeName}.${ext}`;
      imagePath = `images/${finalImageName}`;

      // create image file in repo
      const imageContent = b64; // already base64 if matched; else might be plain base64 so treat as-is

      // PUT to /repos/{owner}/{repo}/contents/{path}
      const putImageUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(imagePath)}`;

      const imagePayload = {
        message: `Add image for post ${postPath}`,
        content: imageContent,
        branch,
      };

      const putImageRes = await fetch(putImageUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify(imagePayload),
      });

      if (!putImageRes.ok) {
        const txt = await putImageRes.text();
        return NextResponse.json(
          { error: "GitHub image upload failed", details: txt },
          { status: 500 }
        );
      }
    }

    // build markdown content with frontmatter
    const imageUrl = imagePath
      ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imagePath}`
      : null;

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

    // create markdown file
    const putMdUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(postPath)}`;
    const mdPayload = {
      message: `Publish post: ${title}`,
      content: mdB64,
      branch,
    };

    const putMdRes = await fetch(putMdUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify(mdPayload),
    });

    const putMdJson = await putMdRes.json();

    if (!putMdRes.ok) {
      return NextResponse.json(
        { error: "GitHub markdown upload failed", details: putMdJson },
        { status: 500 }
      );
    }

    const fileUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${postPath}`;

    return NextResponse.json({ ok: true, url: fileUrl }, { status: 201 });
  } catch (err) {
    console.error("publish-github error:", err);
    return NextResponse.json({ error: "internal_error", details: String(err) }, { status: 500 });
  }
}
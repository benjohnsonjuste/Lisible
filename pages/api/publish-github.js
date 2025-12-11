import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

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
    const env = process.env;
    const token = env.GITHUB_PERSONAL_ACCESS_TOKEN;
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const branch = env.GITHUB_BRANCH || "main";

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: "Variables GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_OWNER ou GITHUB_REPO manquantes" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { title, content, authorName, authorEmail, imageBase64, imageName, createdAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content required" }, { status: 400 });
    }

    const date = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
    const slug = slugify(title).slice(0, 80) || "post";
    const postPath = `posts/${date}-${slug}.md`;

    let imageUrl = null;

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
      let mime = null;
      let b64 = imageBase64;
      if (match) {
        mime = match[1];
        b64 = match[2];
      }

      const safeName = imageName
        ? basenameWithoutExt(imageName).replace(/\s+/g, "_")
        : `${date}-${slug}`;
      const ext = mime ? mime.split("/")[1] : "png";
      const finalImageName = `${safeName}.${ext}`;
      const imagePath = `images/${finalImageName}`;

      const putImageRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(imagePath)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            message: `Add image for post ${postPath}`,
            content: b64,
            branch,
          }),
        }
      );

      let putImageJson = {};
      try {
        putImageJson = await putImageRes.json();
      } catch {
        putImageJson = { text: await putImageRes.text() };
      }

      if (!putImageRes.ok) {
        return NextResponse.json(
          { error: "GitHub image upload failed", details: putImageJson },
          { status: 500 }
        );
      }

      imageUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imagePath}`;
    }

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

    const putMdRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(postPath)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          message: `Publish post: ${title}`,
          content: mdB64,
          branch,
        }),
      }
    );

    let putMdJson = {};
    try {
      putMdJson = await putMdRes.json();
    } catch {
      putMdJson = { text: await putMdRes.text() };
    }

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
    return NextResponse.json(
      { error: "internal_error", details: String(err) },
      { status: 500 }
    );
  }
}
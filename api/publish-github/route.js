import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

// ✅ Mapping flexible des variables d'environnement
const env = {
  token: process.env.MY_GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  owner: process.env.MY_GITHUB_OWNER || process.env.GITHUB_OWNER,
  repo: process.env.MY_REPO_NAME || process.env.GITHUB_REPO,
  branch: process.env.MY_BRANCH || process.env.GITHUB_BRANCH || "main",
};

/**
 * Création d'un slug sûr pour le nom de fichier
 */
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
    const { token, owner, repo, branch } = env;

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: "Variables GitHub manquantes ou mal configurées" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { title, content, authorName, authorEmail, imageBase64, imageName, createdAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const date = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
    const slug = slugify(title).slice(0, 80) || "post";
    const postPath = `posts/${date}-${slug}.md`;

    // --- Gestion de l'image ---
    let imagePath = null;
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
      let mime = null;
      let b64 = imageBase64;
      if (match) {
        mime = match[1];
        b64 = match[2];
      }

      const MAX_BYTES = 2 * 1024 * 1024;
      const approxBytes = Math.ceil((b64.length * 3) / 4);
      if (approxBytes > MAX_BYTES) {
        return NextResponse.json({ error: "Image trop grande. Maximum 2 MB" }, { status: 400 });
      }

      const safeName = imageName
        ? basenameWithoutExt(imageName).replace(/\s+/g, "_")
        : `${date}-${slug}`;
      const extFromMime = mime ? mime.split("/")[1] : null;
      const ext = extFromMime || (imageName && imageName.split(".").pop()) || "png";
      const finalImageName = `${safeName}.${ext}`;
      imagePath = `images/${finalImageName}`;

      // Upload image sur GitHub
      const imageRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(imagePath)}`, {
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
      });

      if (!imageRes.ok) {
        const txt = await imageRes.text();
        return NextResponse.json({ error: "Échec upload image", details: txt }, { status: 500 });
      }
    }

    // --- Création du markdown ---
    const imageUrl = imagePath ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imagePath}` : null;
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

    const mdRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(postPath)}`, {
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
    });

    const mdJson = await mdRes.json();
    if (!mdRes.ok) {
      return NextResponse.json({ error: "Échec upload markdown", details: mdJson }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      url: `https://github.com/${owner}/${repo}/blob/${branch}/${postPath}`,
    }, { status: 201 });

  } catch (err) {
    console.error("publish-github error:", err);
    return NextResponse.json({ error: "internal_error", details: String(err) }, { status: 500 });
  }
}

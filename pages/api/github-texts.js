// pages/api/github-texts.js
export const runtime = "nodejs";

import { Buffer } from "buffer";
import { listFilesInRepoDir, getFileContent } from "../../lib/githubClient";

export default async function handler(req, res) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({ error: "GitHub configuration missing in environment variables." });
    }

    // Liste les fichiers du dossier data/texts/
    const listing = await listFilesInRepoDir({
      owner,
      repo,
      path: "data/texts",
      branch,
      token,
    });

    if (!Array.isArray(listing)) return res.status(200).json({ success: true, data: [] });

    const results = [];

    for (const file of listing) {
      if (file.type !== "file") continue;

      try {
        const fileObj = await getFileContent({
          owner,
          repo,
          path: file.path,
          branch,
          token,
        });

        const contentEncoded = fileObj?.data?.content || fileObj?.content;
        if (!contentEncoded) continue;

        const decoded = Buffer.from(contentEncoded, "base64").toString("utf8");

        // --- Extraction du frontmatter ---
        const fmMatch = decoded.match(/^---\s*([\s\S]*?)---\s*([\s\S]*)$/);
        let meta = {};
        let body = decoded;

        if (fmMatch) {
          const rawFm = fmMatch[1];
          body = fmMatch[2];
          rawFm.split(/\r?\n/).forEach((line) => {
            const idx = line.indexOf(":");
            if (idx > -1) {
              const key = line.slice(0, idx).trim();
              const val = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
              meta[key] = val;
            }
          });
        }

        results.push({
          id: meta.id || file.name.replace(/\.[^/.]+$/, ""),
          title: meta.title || file.name,
          author: meta.author || "",
          image: meta.image || "",
          date: meta.date || file.sha,
          excerpt: body.trim().slice(0, 300),
          content: body.trim(),
        });
      } catch (err) {
        console.warn("Erreur lors du fetch du fichier:", file.path, err.message);
      }
    }

    // Tri par date (décroissant)
    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Erreur dans /api/github-texts:", err);
    return res.status(500).json({ error: err.message });
  }
}
// pages/api/github-texts.js
import { listFilesInRepoDir, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    if (!owner || !repo) return res.status(500).json({ error: "GitHub config missing" });

    // list files under data/texts
    const listing = await listFilesInRepoDir({ owner, repo, path: "data/texts", branch, token: process.env.GITHUB_TOKEN });

    if (!Array.isArray(listing)) return res.status(200).json([]);

    const results = [];
    for (const file of listing) {
      if (file.type !== "file") continue;
      try {
        const fileObj = await getFileContent({ owner, repo, path: file.path, branch, token: process.env.GITHUB_TOKEN });
        if (!fileObj || !fileObj.content) continue;
        const decoded = Buffer.from(fileObj.content, "base64").toString("utf8");
        // parse frontmatter (simple)
        const fmMatch = decoded.match(/^---\s*([\s\S]*?)---\s*([\s\S]*)$/);
        let meta = {}, body = decoded;
        if (fmMatch) {
          const rawFm = fmMatch[1];
          body = fmMatch[2];
          rawFm.split(/\r?\n/).forEach(line => {
            const idx = line.indexOf(":");
            if (idx > -1) {
              const key = line.slice(0, idx).trim();
              const val = line.slice(idx+1).trim().replace(/^"|"$/g, "");
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
        console.warn("fetch file error", file.path, err.message);
      }
    }

    // sort by date desc
    results.sort((a,b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("github-texts error:", err);
    return res.status(500).json({ error: err.message });
  }
}
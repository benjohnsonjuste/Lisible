// pages/api/publish-github.js
import { putFileToRepo } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      title,
      content,
      authorName,
      authorEmail,
      imageBase64, // optional: data:image/..;base64,...
      imageName,   // optional original filename
    } = req.body;

    if (!title || !content) return res.status(400).json({ error: "title and content required" });

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const token = process.env.GITHUB_TOKEN;
    if (!owner || !repo || !token) {
      return res.status(500).json({ error: "GitHub configuration missing on server" });
    }

    // generate an id (slug + timestamp)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
    const id = `${new Date().toISOString().slice(0,10)}-${slug}`;

    // 1) upload image (if any) to public/uploads/<imageName> and get path
    let imagePath = "";
    if (imageBase64 && imageName) {
      // imageBase64 expected like "data:image/png;base64,...."
      const matches = imageBase64.match(/^data:(.+);base64,(.*)$/);
      if (!matches) throw new Error("Invalid imageBase64 format");
      const mime = matches[1];
      const b64 = matches[2];
      const ext = imageName.split(".").pop() || mime.split("/").pop();
      const filename = `public/uploads/${id}-${Date.now()}.${ext}`;
      await putFileToRepo({
        owner,
        repo,
        path: filename,
        contentBase64: b64,
        message: `Add image for ${id}`,
        branch,
        token,
      });
      imagePath = `/${filename}`; // accessible via GitHub Pages or raw link (depends hosting)
    }

    // 2) create markdown with frontmatter inside data/texts/<id>.md
    const mdPath = `data/texts/${id}.md`;
    const frontmatter = [
      `title: "${escapeQuotes(title)}"`,
      `author: "${escapeQuotes(authorName || "Auteur inconnu")}"`,
      `author_email: "${escapeQuotes(authorEmail || "")}"`,
      `date: "${new Date().toISOString()}"`,
      `image: "${imagePath}"`,
      `id: "${id}"`,
    ].join("\n");

    const mdContent = `---\n${frontmatter}\n---\n\n${content}\n`;
    const mdBase64 = Buffer.from(mdContent, "utf8").toString("base64");

    await putFileToRepo({
      owner,
      repo,
      path: mdPath,
      contentBase64: mdBase64,
      message: `Add text ${id}`,
      branch,
      token,
    });

    return res.status(200).json({ success: true, id });
  } catch (err) {
    console.error("publish-github error:", err);
    return res.status(500).json({ error: err.message || "publish failed" });
  }
}

function escapeQuotes(s) {
  return String(s || "").replace(/"/g, '\\"');
}
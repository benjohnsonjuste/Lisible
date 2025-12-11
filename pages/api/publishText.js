// pages/api/publishText.js
import { commitFileToGithub, octokit, GITHUB_REPO } from "@/lib/github";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // autorise payloads jusqu'à 10MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, content, imageBase64, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }

    // author peut être string ou objet
    const authorName = typeof author === "string" ? author : (author?.name || "Auteur");

    // Vérifier token GitHub via octokit initialisé
    try {
      // simple ping to check auth (will throw if token invalid)
      if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        return res.status(500).json({ error: "GITHUB_PERSONAL_ACCESS_TOKEN not configured on server" });
      }
    } catch (err) {
      console.warn("GitHub token check failed:", err);
    }

    // Générer ID
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Si on a une imageBase64 : vérifier format puis stocker dans JSON (ou optionnel: créer fichier image)
    let imageField = null;
    if (imageBase64) {
      // validation basique : data:[mime];base64,......
      if (!/^data:.*;base64,/.test(imageBase64)) {
        // si l'utilisateur a envoyé seulement base64 sans prefix
        // on laisse quand même: tenter d'ajouter prefix png
        imageField = `data:image/png;base64,${imageBase64}`;
      } else {
        imageField = imageBase64;
      }

      // optionally: check size (approx)
      const approxBytes = Math.ceil((imageField.length * 3) / 4);
      if (approxBytes > 6 * 1024 * 1024) { // 6MB safety
        return res.status(400).json({ error: "Image trop grosse (limite ~6MB)" });
      }
    }

    const data = {
      id,
      title,
      content,
      image: imageField,
      author: { name: authorName },
      date: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    const path = `data/texts/${id}.json`;

    // commit to GitHub
    try {
      await commitFileToGithub(path, data, `Publish text ${title}`);
    } catch (err) {
      console.error("Erreur commit GitHub:", err?.message || err);
      // try to surface Octokit error details
      const ghErr = err?.message || (err?.errors && JSON.stringify(err.errors)) || "Unknown GitHub error";
      return res.status(500).json({ error: `GitHub error: ${ghErr}` });
    }

    return res.status(200).json({ success: true, id });
  } catch (err) {
    console.error("publishText handler error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
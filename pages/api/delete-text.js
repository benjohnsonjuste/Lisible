import { getFileContent, createOrUpdateFile } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { path } = req.body; // ex: public/data/texts/texte123.json
    if (!path) {
      return res.status(400).json({ error: "Chemin du fichier manquant" });
    }

    // Vérifie si le fichier existe
    let fileData;
    try {
      fileData = await getFileContent({ path });
    } catch (err) {
      return res.status(404).json({ error: "Fichier introuvable sur GitHub" });
    }

    // Supprime le fichier sur GitHub
    const API_BASE = "https://api.github.com";
    const OWNER = "benjohnsonjuste";
    const REPO = "Lisible";
    const TOKEN = process.env.GITHUB_TOKEN;

    const headers = {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    // On récupère le SHA du fichier pour la suppression
    const getRes = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers,
    });

    if (!getRes.ok) {
      return res.status(404).json({ error: "Impossible de localiser le fichier" });
    }

    const fileInfo = await getRes.json();

    const deleteRes = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        message: `Suppression du texte ${path}`,
        sha: fileInfo.sha,
        branch: "main",
      }),
    });

    if (!deleteRes.ok) {
      const text = await deleteRes.text();
      throw new Error(`Erreur GitHub: ${text}`);
    }

    return res.status(200).json({ message: "Texte supprimé avec succès !" });
  } catch (error) {
    console.error("Erreur suppression texte:", error);
    return res.status(500).json({ error: "Erreur lors de la suppression du texte" });
  }
}
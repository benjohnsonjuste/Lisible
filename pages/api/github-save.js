// pages/api/github-save.js
import { saveFileToGitHub } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { id, data } = req.body;
    if (!id || !data) return res.status(400).json({ error: "ID ou données manquantes" });

    const filePath = `data/texts/${id}.json`;
    await saveFileToGitHub(filePath, data, `Mise à jour automatique du texte ${id}`);

    res.status(200).json({ message: "✅ Données enregistrées sur GitHub !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur d’enregistrement sur GitHub" });
  }
}
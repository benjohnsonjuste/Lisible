import { saveFileToGitHub } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { id, data } = req.body;

    if (!id || !data) {
      return res.status(400).json({ error: "ID ou données manquantes" });
    }

    const path = `public/data/texts/${id}.json`;

    await saveFileToGitHub(path, data, `Mise à jour du texte ${id}`);

    return res.status(200).json({ success: true });
    
  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
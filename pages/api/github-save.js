// /pages/api/github-save.js
import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

/**
 * POST body: { id: string|number, updatedFields: object }
 * Ex: { id: "1761492296819", updatedFields: { likes: [...], comments: [...], views: 12 } }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { id, updatedFields } = req.body;
    if (!id || typeof updatedFields !== "object") {
      return res.status(400).json({ error: "Paramètres manquants ou invalides" });
    }

    const path = `public/data/texts/${id}.json`;
    let current = null;

    try {
      const raw = await getFileContent({ path });
      current = JSON.parse(raw);
    } catch (err) {
      // Si le fichier n'existe pas on le crée à partir des updatedFields
      current = { id, date: new Date().toISOString(), title: "Titre inconnu", content: "", authorName: "Auteur inconnu" };
    }

    // Fusionne objets : updatedFields remplace les champs donnés
    const merged = { ...current, ...updatedFields, updatedAt: new Date().toISOString() };

    await createOrUpdateFile({
      path,
      content: JSON.stringify(merged, null, 2),
      message: `Mise à jour texte ${id} (${Object.keys(updatedFields).join(", ")})`,
    });

    return res.status(200).json({ success: true, data: merged });
  } catch (err) {
    console.error("Erreur /api/github-save:", err);
    return res.status(500).json({ error: "Impossible de sauvegarder sur GitHub", details: err.message });
  }
}
// pages/api/track-view.js
import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { textId } = req.body;
  if (!textId) return res.status(400).json({ error: "textId requis" });

  try {
    const path = `data/publications/${textId}.json`;
    const textRes = await getFile(path);

    if (!textRes) return res.status(404).json({ error: "Publication introuvable" });
    
    let text = textRes.content;

    // Logique simple : on incrémente la vue
    // (Note: Pour plus de sécurité, on pourrait vérifier l'IP ou un cookie ici)
    text.views = (text.views || 0) + 1;

    await updateFile(path, text, textRes.sha, `👁️ Vue incrémentée : ${textId}`);

    return res.status(200).json({ success: true, views: text.views });
  } catch (e) {
    return res.status(500).json({ error: "Erreur lors du tracking" });
  }
}

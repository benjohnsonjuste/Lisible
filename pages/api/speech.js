// pages/api/speech.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, lang = 'fr-FR' } = req.body;

  if (!text) return res.status(400).json({ error: 'Texte manquant' });

  try {
    // Note: Pour une version gratuite et illimitée, on utilise l'URL de synthèse Google Translate
    // qui est très robuste pour Lisible.
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text.substring(0, 1000) // On limite à 1000 caractères par segment pour la stabilité
    )}&tl=${lang}&client=tw-ob`;

    return res.status(200).json({ audioUrl: url });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la génération vocale' });
  }
}

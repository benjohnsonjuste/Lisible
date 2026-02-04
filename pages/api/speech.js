// pages/api/speech.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, lang = 'fr' } = req.body;

  if (!text) return res.status(400).json({ error: 'Texte manquant' });

  try {
    // Nettoyage strict : max 200 caractères (limite Google TTS gratuit)
    const safeText = text.replace(/\n/g, ' ').substring(0, 200);
    
    // Construction de l'URL avec les paramètres de contournement
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      safeText
    )}&tl=${lang}&client=tw-ob&ttsspeed=1`;

    // On pourrait simplement renvoyer l'URL, mais certains navigateurs bloquent le referer.
    // En renvoyant cette URL, on s'assure que le client l'appelle avec son propre User-Agent.
    return res.status(200).json({ 
      audioUrl: url,
      userAgentTarget: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la génération vocale' });
  }
}

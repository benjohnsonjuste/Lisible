// app/api/speech/route.js

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, lang = 'fr' } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: 'Texte manquant' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Nettoyage strict : max 200 caractères (limite Google TTS gratuit)
    const safeText = text.replace(/\n/g, ' ').substring(0, 200);
    
    // Construction de l'URL avec les paramètres de contournement
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      safeText
    )}&tl=${lang}&client=tw-ob&ttsspeed=1`;

    // On renvoie l'URL et l'indication de User-Agent cible
    return new Response(
      JSON.stringify({ 
        audioUrl: url,
        userAgentTarget: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Speech API Error:", error);
    return new Response(JSON.stringify({ error: 'Erreur lors de la génération vocale' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

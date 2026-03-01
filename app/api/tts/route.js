import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text, title, userName } = await req.json();
    const fullText = (title + " " + text).toLowerCase();

    // 1. Logique des Jingles (Conservée)
    const jingles = [
      `Bienvenue sur Lisible. Vous écoutez : ${title}.`,
      `Lecture en cours sur votre plateforme littéraire. Voici : ${title}.`,
      `Plongez dans l'univers de ${userName || 'nos auteurs'}. Titre de l'œuvre : ${title}.`
    ];
    const randomJingle = jingles[Math.floor(Math.random() * jingles.length)];

    // 2. Détection du Ton (Conservée)
    const emotionalMap = [
      { key: 'Sombre', words: ['mort', 'sang', 'triste', 'noir'], pitch: 0.75, rate: 0.85 },
      { key: 'Joyeux', words: ['soleil', 'amour', 'fête', 'rire'], pitch: 1.15, rate: 1.1 },
      { key: 'Mystère', words: ['secret', 'ombre', 'nuit', 'étrange'], pitch: 0.8, rate: 0.9 }
    ];

    let tone = emotionalMap.find(e => e.words.some(w => fullText.includes(w))) || 
               { key: 'Neutre', pitch: 1.0, rate: 1.0 };

    // 3. Préparation des segments pour l'IA Google (Nouveau)
    // On combine le jingle et le texte, puis on découpe par morceaux de 180 caractères
    const completeScript = `${randomJingle}. . . ${text}`;
    
    // Découpage intelligent par phrases ou par limite de caractères (limite Google TTS = 200)
    const chunks = completeScript.match(/[^\.!\?]+[\.!\?]+|.{1,180}(?:\s|$)/g) || [completeScript];
    
    // Génération de la playlist d'URLs
    const urls = chunks
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0)
      .map(chunk => 
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=fr&client=tw-ob`
      );

    return NextResponse.json({ 
      success: true, 
      tone, 
      urls, // La liste des morceaux à lire à la suite
      jingle: randomJingle 
    });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

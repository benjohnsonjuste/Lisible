import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text, title, userName } = await req.json();
    const fullText = (title + " " + text).toLowerCase();

    // Phrases d'introduction aléatoires pour faire "Pro"
    const jingles = [
      `Bienvenue sur Lisible. Vous écoutez : ${title}.`,
      `Lecture en cours sur votre plateforme littéraire. Voici : ${title}.`,
      `Plongez dans l'univers de ${userName || 'nos auteurs'}. Titre de l'œuvre : ${title}.`
    ];
    const randomJingle = jingles[Math.floor(Math.random() * jingles.length)];

    const emotionalMap = [
      { key: 'Sombre', words: ['mort', 'sang', 'triste', 'noir'], pitch: 0.75, rate: 0.85 },
      { key: 'Joyeux', words: ['soleil', 'amour', 'fête', 'rire'], pitch: 1.15, rate: 1.1 },
      { key: 'Mystère', words: ['secret', 'ombre', 'nuit', 'étrange'], pitch: 0.8, rate: 0.9 }
    ];

    let tone = emotionalMap.find(e => e.words.some(w => fullText.includes(w))) || 
               { key: 'Neutre', pitch: 1.0, rate: 1.0 };

    return NextResponse.json({ success: true, tone, jingle: randomJingle });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

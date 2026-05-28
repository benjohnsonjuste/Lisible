import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk) return NextResponse.json({ error: "Texte absent" }, { status: 400 });

    const text = textChunk.trim();
    const suggestions = [];

    // Règle 1 : Répétitions flagrantes et lourdeurs de verbes ternes (Exemple : "Il y a")
    const matchesIlYa = [...text.matchAll(/\b(il y a)\b/gi)];
    matchesIlYa.forEach((match, index) => {
      suggestions.push({
        id: `proof-${index}`,
        original: match[0],
        index: match.index,
        context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + 40)),
        type: "Lourdeur Stylistique",
        corrected: "Se déploie / S'installe",
        explanation: "Le gallicisme 'il y a' affaiblit la portée évocatrice de votre phrase."
      });
    });

    // Règle 2 : Adverbes redondants modifiant un verbe déjà fort
    const matchesAdverbes = [...text.matchAll(/\b(marcher lentement|courir rapidement)\b/gi)];
    matchesAdverbes.forEach((match, index) => {
      const correction = match[0].toLowerCase().includes('marcher') ? "Flâner / S'attarder" : "Obliquer / Filer";
      suggestions.push({
        id: `adv-${index}`,
        original: match[0],
        index: match.index,
        context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + 30)),
        type: "Pléonasme / Surcharge",
        corrected: correction,
        explanation: "Remplacez le couple 'verbe + adverbe' par un verbe d'action sémantiquement fort."
      });
    });

    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json({ error: "Erreur du moteur de réécriture stylistique." }, { status: 500 });
  }
}

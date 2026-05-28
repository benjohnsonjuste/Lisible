import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk) return NextResponse.json({ error: "Contenu vide" }, { status: 400 });

    const words = textChunk.toLowerCase().split(/[\s',’]+/).filter(w => w.length > 5);
    const uniqueWords = Array.from(new Set(words)).slice(0, 4);
    
    const themeA = uniqueWords[0] || "destinée";
    const themeB = uniqueWords[1] || "mystère";

    const generatedSummary = `Dans une architecture narrative dominée par les thématiques de ${themeA} et de ${themeB}, ce récit déploie une tension dramatique unique. Porté par une prose singulière, le texte explore les fractures de ses personnages à travers un prisme sensoriel saisissant. Une œuvre chorale percutante, taillée pour captiver dès les premières pages.`;

    return NextResponse.json({
      generatedSummary,
      pitchBorders: "Saisissant • Profond • Percutant",
      marketTarget: "Littérature Générale / Fiction Contemporaine"
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur de génération marketing" }, { status: 500 });
  }
}

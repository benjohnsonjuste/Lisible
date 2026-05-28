import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk || textChunk.trim().length < 15) {
      return NextResponse.json({ error: "Contenu insuffisant pour une lecture bêta cohérente." }, { status: 400 });
    }

    const text = textChunk.trim();
    const wordCount = text.split(/[\s',’]+/).filter(w => w.length > 0).length;
    
    // Algorithme d'analyse d'immersion (basé sur la longueur des paragraphes et la ponctuation)
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    const riskPassages = [];
    
    paragraphs.forEach((p, index) => {
      const pWords = p.split(/[\s',’]+/).length;
      // Risque d'infodump ou de lenteur si un paragraphe est trop massif
      if (pWords > 120) {
        riskPassages.push({
          id: index,
          excerpt: p.substring(0, 90) + "...",
          type: "Risque d'Abandon (Info-dumping)",
          reason: "Bloc de texte trop dense. Le lecteur sature par manque d'espaces de respiration narrative.",
          fix: "Aérez en créant au moins deux paragraphes distincts ou insérez une micro-action."
        });
      }
    });

    // Score d'engagement simulé
    const clichesCount = (text.match(/(un silence de mort|les larmes aux yeux|battre la chamade)/gi) || []).length;
    const engagementScore = Math.max(30, Math.min(99, Math.round(85 - (clichesCount * 8) - (riskPassages.length * 7))));

    return NextResponse.json({
      engagementScore,
      riskPassages: riskPassages.slice(0, 3),
      readerFeedbacks: [
        { profile: "Le Passionné", avatar: "📖", review: engagementScore > 75 ? "Le texte m'embarque bien, l'univers s'installe vite !" : "Le rythme est un peu lourd sur les descriptions, je saute des lignes." },
        { profile: "L'Analyste", avatar: "🧐", review: clichesCount > 0 ? "Quelques métaphores éculées brisent l'originalité de la voix." : "La voix stylistique est propre et évite les pièges du premier jet." }
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: "Défaillance de la simulation de lecture bêta." }, { status: 500 });
  }
}

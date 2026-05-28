import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk) return NextResponse.json({ error: "Texte manquant" }, { status: 400 });

    const sentences = textChunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = textChunk.split(/\s+/).length / (sentences.length || 1);

    // Analyse de l'index de clonage inconscient
    let dominantMimicry = "Voix Propre & Singulière";
    let cloneRisk = 12; // Pourcentage de base de coïncidence

    if (avgSentenceLength > 32) {
      dominantMimicry = "Pastiche Proustien / Style Céladon";
      cloneRisk = 74;
    } else if (textChunk.includes('——') && avgSentenceLength < 14) {
      dominantMimicry = "Minimalisme Contemporain (Type Modiano/Duras)";
      cloneRisk = 65;
    }

    return NextResponse.json({
      fingerprint: {
        avgSentenceLength: Math.round(avgSentenceLength),
        punctuationDensity: Math.round(((textChunk.match(/[,;:]/g) || []).length / textChunk.length) * 1000)
      },
      mimicryAlert: {
        authorTarget: dominantMimicry,
        riskPercentage: cloneRisk,
        critique: cloneRisk > 50 
          ? "Votre signature stylistique s'efface derrière l'ombre de structures classiques. Forcez la rupture de rythme."
          : "Empreinte idiosyncratique saine. Votre voix n'appartient qu'à vous."
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur de l'analyseur d'empreinte stylistique." }, { status: 500 });
  }
}

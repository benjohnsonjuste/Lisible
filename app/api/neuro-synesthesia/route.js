import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk) return NextResponse.json({ error: "Texte manquant" }, { status: 400 });

    const text = textChunk.toLowerCase();

    // Matrices lexicales de résonance sensorielle
    const sensoryPatterns = {
      visual: /(rouge|sombre|lumière|éclat|ombre|contours|bleu|pâle|scintiller|horizon)/gi,
      auditory: /(murmure|fracas|silence|écho|bruissement|vibration|strident|voix|sonore)/gi,
      kinesthetic: /(lourd|brûlant|froid|rugueux|pression|frisson|étreinte|peser|saisir)/gi,
      olfactoryGustatory: /(parfum|odeur|amer|sucré|saveur|effluve|acide|musc|empester)/gi
    };

  const vCount = (text.match(sensoryPatterns.visual) || []).length;
  const aCount = (text.match(sensoryPatterns.auditory) || []).length;
  const kCount = (text.match(sensoryPatterns.kinesthetic) || []).length;
  const ogCount = (text.match(sensoryPatterns.olfactoryGustatory) || []).length;
  const totalSensory = vCount + aCount + kCount + ogCount || 1;

  // Calcul du coefficient de texturisation mentale (Harmonie des sens)
  const sensoryBalanceScore = Math.round(
    (1 - Math.abs((vCount/totalSensory) - 0.25) 
       - Math.abs((aCount/totalSensory) - 0.25)
       - Math.abs((kCount/totalSensory) - 0.25)
       - Math.abs((ogCount/totalSensory) - 0.25)) * 100
  );

  return NextResponse.json({
    scores: {
      visual: Math.min(100, Math.round((vCount / totalSensory) * 100)),
      auditory: Math.min(100, Math.round((aCount / totalSensory) * 100)),
      kinesthetic: Math.min(100, Math.round((kCount / totalSensory) * 100)),
      olfactoryGustatory: Math.min(100, Math.round((ogCount / totalSensory) * 100))
    },
    synesthesiaIndex: Math.max(15, Math.min(99, sensoryBalanceScore)),
    aestheticVerdict: totalSensory < 4 
      ? "Texte 'éthéré' (Trop cérébral, manque d'ancrage physique dans la réalité du lecteur)." 
      : "Texte 'organique' (Excellente balance des stimuli sensoriels)."
  });
} catch (e) {
  return NextResponse.json({ error: "Erreur lors du calcul synesthésique." }, { status: 500 });
}
}

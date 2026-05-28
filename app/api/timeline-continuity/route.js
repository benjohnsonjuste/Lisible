import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk) return NextResponse.json({ error: "Texte absent." }, { status: 400 });

    const text = textChunk.trim();
    
    // Extraction des marqueurs temporels explicites
    const timeMarkers = text.match(/\b(lendemain|veille|deux jours plus tard|à\s\d+h|matin|soir|nuit|été|hiver|printemps)\b/gi) || [];
    
    // Détection d'incohérences de météo ou d'environnement immédiat
    const environmentalClashes = [];
    if (/pluie|pleuvait|orage/i.test(text) && /soleil radieux|ciel limpide/i.test(text)) {
      environmentalClashes.push({
        type: "Météorologique",
        desc: "Collision climatique immédiate : Transition instantanée entre un déluge et un soleil de plomb sans étape de dispersion nuageuse."
      });
    }
    
    if (/neige|gelait/i.test(text) && /chaleur étouffante|canicule/i.test(text)) {
      environmentalClashes.push({
        type: "Saisonnière",
        desc: "Incohérence thermique majeure : Éléments de gelée et de canicule entrelacés dans le même paragraphe."
      });
    }

    // Reconstruction d'une ébauche de fil conducteur (Timeline narrative)
    const timelineEvents = timeMarkers.map((marker, idx) => ({
      id: idx + 1,
      anchor: marker.charAt(0).toUpperCase() + marker.slice(1),
      impact: "Pivot de sédimentation temporelle du récit."
    }));

    return NextResponse.json({
      environmentalClashes,
      timelineEvents: timelineEvents.slice(0, 5), // Limiter aux 5 premiers événements clés
      continuityStatus: environmentalClashes.length > 0 ? "Continuité compromise" : "Trame temporelle stable"
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur lors du calcul de la continuité temporelle." }, { status: 500 });
  }
}

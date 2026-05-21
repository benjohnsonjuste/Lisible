import { NextResponse } from 'next/server';
export async function POST(request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Configuration manquante : La clé API n'est pas configurée." },
        { status: 500 }
      );
    }
    const { textChunk } = await request.json();
    if (!textChunk || textChunk.trim().length < 10) {
      return NextResponse.json(
        { error: "Le texte fourni est trop court pour être analysé." },
        { status: 400 }
      );
    }
    const systemPrompt = `Tu es un comité de lecture virtuel composé d'éditeurs seniors de chez Gallimard, XO Éditions, Albin Michel et Actes Sud.
Ton rôle est d'analyser le texte fourni avec une rigueur chirurgicale, d'évaluer son potentiel d'acceptation pour chaque maison, et de renvoyer un rapport EXCLUSIVEMENT au format JSON.
Analyse et calcule les scores selon ces profils :
1. Gallimard (Collection Blanche) : Exige un style littéraire pur, poétique, introspectif, profondeur psychologique. Déteste le style thriller commercial américain ou les phrases trop hachées.
2. XO Éditions : Exige un rythme haletant, efficacité maximale, tension narrative dès les premières lignes. Déteste les longues descriptions contemplatives.
3. Albin Michel : Cherche le grand romanesque, des personnages forts, un style accessible mais exigeant.
4. Actes Sud : Recherche une voix singulière, une originalité thématique ou un engagement (social, écologique). Déteste les structures trop classiques et prévisibles.
Tu devez STRICTEMENT répondre au format JSON suivant, sans aucune autre phrase avant ou après :
{
  "metrics": {
    "hookScore": 85,
    "rhythmStyle": "Chaotique, fluide, ou trop descriptif...",
    "adverbDensity": "Élevée, modérée, ou excellente..."
  },
  "publisherCompatibility": [
    {
      "name": "Gallimard (Blanche)",
      "score": 75,
      "reasons": "Explique pourquoi le style correspond ou non à leur ligne éditoriale.",
      "adjustmentsNeeded": "Ce que l'auteur doit modifier spécifiquement pour plaire à cet éditeur."
    },
    {
      "name": "XO Éditions",
      "score": 40,
      "reasons": "Analyse du rythme par rapport à leurs attentes.",
      "adjustmentsNeeded": "Conseil précis pour accélérer ou ajuster la tension."
    },
    {
      "name": "Albin Michel",
      "score": 60,
      "reasons": "Analyse du potentiel romanesque.",
      "adjustmentsNeeded": "Conseil sur la force narrative."
    },
    {
      "name": "Actes Sud",
      "score": 50,
      "reasons": "Analyse de la singularité de la plume.",
      "adjustmentsNeeded": "Conseil pour accentuer l'originalité."
    }
  ],
  "clichesDetected": [
    {"expression": "cliché trouvé", "alternative": "proposition de réécriture originale"}
  ],
  "heavyPhrases": [
    {"text": "la phrase lourde exacte", "reason": "pourquoi elle bloque le rythme", "suggestion": "comment la couper ou l'alléger"}
  ],
  "editorialVerdict": "Ton analyse globale synthétique destinée à l'auteur."
}`;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Voici l'extrait du manuscrit à analyser :\n\n--- \n${textChunk}\n---` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      })
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Erreur lors de l'appel à Gemini.");
    }
    const resData = await response.json();
    const rawJsonText = resData.candidates[0].content.parts[0].text;
    const reportData = JSON.parse(rawJsonText);
    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Erreur API Éditomètre :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'analyse du manuscrit." },
      { status: 500 }
    );
  }
}

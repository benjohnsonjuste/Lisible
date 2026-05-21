import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Configuration manquante : La clé API GEMINI_API_KEY n'est pas configurée." },
        { status: 500 }
      );
    }

    // Utilisation de la bonne classe GoogleGenerativeAI
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

    // Récupération correcte du modèle
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    // Exécution de la génération de contenu
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Voici l'extrait du manuscrit à analyser :\n\n--- \n${textChunk}\n---` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const response = await result.response;
    const reportData = JSON.parse(response.text());
    
    return NextResponse.json(reportData);

  } catch (error) {
    console.error("Erreur API Éditomètre :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'analyse du manuscrit." },
      { status: 500 }
    );
  }
}

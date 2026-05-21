import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request) {
  try {
    // Vérification de la présence de la clé avant instanciation pour le build Vercel
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Configuration manquante : La clé API n'est pas configurée." },
        { status: 500 }
      );
    }

    // Initialisation du client OpenAI déplacée à l'intérieur de la route
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Récupération du texte envoyé par le frontend
    const { textChunk } = await request.json();

    if (!textChunk || textChunk.trim().length < 10) {
      return NextResponse.json(
        { error: "Le texte fourni est trop court pour être analysé." },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu es un conseiller éditorial senior et un expert en stylistique pour les grandes maisons d'édition. 
Ton rôle est d'analyser le texte fourni avec une rigueur chirurgicale et de renvoyer un rapport EXCLUSIVEMENT au format JSON.

Analyse les aspects suivants :
1. Le "Hook Score" (sur 100) : La capacité des premières lignes à captiver le lecteur.
2. Le rythme : Identifier si le texte est trop dense, fluide, ou s'il y a un "ventre mou".
3. Les tics de langage : Repérer la surutilisation d'adverbes en "-ment", les répétitions et les clichés.
4. Les phrases lourdes : Identifier précisément les phrases trop longues qui bloquent la lecture.

Tu dois STRICTEMENT répondre au format JSON suivant, sans aucune autre phrase avant ou après :
{
  "metrics": {
    "hookScore": 85,
    "rhythmStyle": "Chaotique, fluide, ou trop descriptif...",
    "adverbDensity": "Élevée, modérée, ou excellente..."
  },
  "clichesDetected": [
    {"expression": "cliché trouvé", "alternative": "proposition de réécriture originale"}
  ],
  "heavyPhrases": [
    {"text": "la phrase lourde exacte", "reason": "pourquoi elle bloque le rythme", "suggestion": "comment la couper ou l'alléger"}
  ],
  "editorialVerdict": "Ton analyse globale synthétique destinée à l'auteur."
}`;

    // Appel à l'API OpenAI (Modèle gpt-4o pour la finesse littéraire)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Voici l'extrait du manuscrit à analyser :\n\n--- \n${textChunk}\n---` }
      ],
      temperature: 0.3,
    });

    const reportData = JSON.parse(response.choices[0].message.content);

    // Renvoi du rapport d'analyse en JSON au frontend
    return NextResponse.json(reportData);

  } catch (error) {
    console.error("Erreur API Éditomètre :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'analyse du manuscrit." },
      { status: 500 }
    );
  }
}

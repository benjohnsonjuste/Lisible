import { NextResponse } from 'next/server';
import { callAI, parseAIJson, truncateText, aiError, SYSTEM_FR } from '../_lib';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk || textChunk.trim().length < 200) {
      return NextResponse.json(
        { error: 'Collez au moins 200 caractères pour obtenir une critique pertinente.' },
        { status: 400 }
      );
    }
    const { text, truncated } = truncateText(textChunk);

    const prompt = `Voici un extrait de manuscrit à critiquer en profondeur (extrait${truncated ? ' tronqué' : ''}) :

"""
${text}
"""

Rédige une critique littéraire professionnelle et complète. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement cette structure :
{
  "noteGlobale": <nombre de 0 à 100>,
  "resume": "<résumé de l'extrait en 4-5 phrases, ton neutre>",
  "notes": {
    "style": <0-100>,
    "intrigue": <0-100>,
    "personnages": <0-100>,
    "rythme": <0-100>,
    "originalite": <0-100>,
    "emotion": <0-100>
  },
  "pointsForts": ["<3 à 5 points forts, chacun illustré par une courte citation du texte>"],
  "pointsFaibles": ["<3 à 5 points faibles précis, chacun illustré par une courte citation du texte>"],
  "conseils": [
    {"titre": "<titre du conseil>", "detail": "<explication concrète de 2-3 phrases>", "exemple": "<courte citation du texte concerné>"}
  ],
  "verdict": "<verdict final de 3-4 phrases : potentiel du texte et priorité n°1 à travailler>"
}
Tout en français. Sois exigeant mais bienveillant, comme un éditeur qui veut faire progresser l'auteur.`;

    const raw = await callAI(
      [
        { role: 'system', content: SYSTEM_FR },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 3000, temperature: 0.6 }
    );
    const critique = parseAIJson(raw);
    return NextResponse.json({ ...critique, extraitTronque: truncated });
  } catch (e) {
    return aiError(e.message || 'La critique IA a échoué.');
  }
}

import { NextResponse } from 'next/server';
import { callAI, parseAIJson, truncateText, aiError, SYSTEM_FR } from '../_lib';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk || textChunk.trim().length < 200) {
      return NextResponse.json(
        { error: 'Collez au moins 200 caractères pour recevoir des idées.' },
        { status: 400 }
      );
    }
    const { text, truncated } = truncateText(textChunk);

    const prompt = `Voici un extrait de manuscrit d'un auteur en panne d'inspiration ou en quête de rebondissements (extrait${truncated ? ' tronqué' : ''}) :

"""
${text}
"""

Propose des idées créatives pour l'aider à continuer. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "ideesDeScenes": [
    {"titre": "<titre évocateur>", "description": "<description de la scène en 3-4 phrases, cohérente avec l'univers et les personnages du texte>"}
  ],
  "rebondissements": ["<3 rebondissements surprenants mais crédibles, 1-2 phrases chacun>"],
  "conseilBlocage": "<un conseil concret de 3-4 phrases pour sortir de la page blanche, adapté à ce texte>"
}
Donne 3 idées de scènes. Tout en français. Sois inventif, surprenant, mais toujours cohérent avec le ton et l'univers de l'extrait.`;

    const raw = await callAI(
      [
        { role: 'system', content: SYSTEM_FR },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 2200, temperature: 0.9 }
    );
    const idees = parseAIJson(raw);
    return NextResponse.json(idees);
  } catch (e) {
    return aiError(e.message || 'La génération d\u2019idées a échoué.');
  }
}

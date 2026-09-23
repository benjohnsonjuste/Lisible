import { NextResponse } from 'next/server';
import { callAI, parseAIJson, truncateText, aiError, SYSTEM_FR } from '../_lib';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk || textChunk.trim().length < 200) {
      return NextResponse.json(
        { error: 'Collez au moins 200 caractères pour générer le kit marketing.' },
        { status: 400 }
      );
    }
    const { text, truncated } = truncateText(textChunk);
    const header = `Voici un extrait de manuscrit (extrait${truncated ? ' tronqué' : ''}) :\n\n"""\n${text}\n"""`;

    // Le kit est généré en deux temps : le service IA gratuit tronque les
    // réponses trop longues (contenu vide). Deux appels courts = fiabilité.
    const promptA = `${header}\n\nTu es un expert en marketing éditorial.\nRéponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement cette structure :\n{\n  "titres": ["<5 propositions de titres accrocheurs, variés>"],\n  "quatrieme": "<texte de 4e de couverture : 100-130 mots, qui donne envie sans spoiler>",\n  "synopsisCourt": "<synopsis d'1 paragraphe, 50-70 mots>"\n}\nTout en français. Ton vendeur mais élégant, digne d'une maison d'édition. Reste concis.`;

    const promptB = `${header}\n\nTu es un expert en marketing éditorial.\nRéponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement cette structure :\n{\n  "synopsisLong": "<synopsis détaillé de 150-200 mots pour éditeurs>",\n  "pitch": "<pitch oral de 30 secondes, 2-3 phrases percutantes>",\n  "accrochesRS": ["<3 accroches pour réseaux sociaux, ton moderne, avec 1-2 hashtags>"],\n  "motsCles": ["<8 mots-clés pour le référencement du livre>"],\n  "publicCible": "<description du lectorat idéal en 2 phrases>"\n}\nTout en français. Ton vendeur mais élégant. Reste concis.`;

    const [resA, resB] = await Promise.allSettled([
      callAI(
        [
          { role: 'system', content: SYSTEM_FR },
          { role: 'user', content: promptA },
        ],
        { maxTokens: 1200, temperature: 0.8 }
      ),
      callAI(
        [
          { role: 'system', content: SYSTEM_FR },
          { role: 'user', content: promptB },
        ],
        { maxTokens: 1500, temperature: 0.8 }
      ),
    ]);

    const kit = {};
    if (resA.status === 'fulfilled') Object.assign(kit, parseAIJson(resA.value));
    if (resB.status === 'fulfilled') Object.assign(kit, parseAIJson(resB.value));

    if (Object.keys(kit).length === 0) {
      const reason =
        (resA.status === 'rejected' ? resA.reason?.message : null) ||
        (resB.status === 'rejected' ? resB.reason?.message : null) ||
        'La génération marketing a échoué.';
      throw new Error(reason);
    }
    return NextResponse.json(kit);
  } catch (e) {
    return aiError(e.message || 'La génération marketing a échoué.');
  }
}

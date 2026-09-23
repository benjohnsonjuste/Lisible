import { NextResponse } from 'next/server';
import { callAI, parseAIJson, aiError, SYSTEM_FR } from '../_lib';

const CONSIGNES = {
  fluidite: 'Rends le passage plus fluide et rythmé, sans changer le sens ni le ton.',
  images: 'Enrichis le passage avec des images sensorielles fortes (vues, sons, odeurs, textures), sans alourdir.',
  dialogue: 'Rends le dialogue plus vivant et naturel, avec des répliques qui sonnent vrai.',
  concision: 'Rends le passage plus concis et percutant : coupe le superflu, garde l\u2019essentiel.',
  tension: 'Augmente la tension dramatique du passage, phrase par phrase.',
};

export async function POST(request) {
  try {
    const { passage, consigne = 'fluidite' } = await request.json();
    if (!passage || passage.trim().length < 30) {
      return NextResponse.json(
        { error: 'Sélectionnez un passage d\u2019au moins 30 caractères à réécrire.' },
        { status: 400 }
      );
    }
    if (passage.length > 4000) {
      return NextResponse.json(
        { error: 'Passage trop long : limitez-vous à 4000 caractères.' },
        { status: 400 }
      );
    }
    const instruction = CONSIGNES[consigne] || CONSIGNES.fluidite;

    const prompt = `Consigne de réécriture : ${instruction}

Passage original :
"""
${passage.trim()}
"""

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "reformulation": "<le passage réécrit, même longueur approximative, en français>",
  "changements": ["<3 à 5 changements expliqués en une phrase chacun : ce qui a été modifié et pourquoi>"]
}`;

    const raw = await callAI(
      [
        { role: 'system', content: SYSTEM_FR },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 1800, temperature: 0.7 }
    );
    const result = parseAIJson(raw);
    return NextResponse.json(result);
  } catch (e) {
    return aiError(e.message || 'La réécriture a échoué.');
  }
}

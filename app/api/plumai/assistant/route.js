import { NextResponse } from 'next/server';
import { callAI, truncateText, aiError, SYSTEM_FR } from '../_lib';

export async function POST(request) {
  try {
    const { textChunk, history = [], question } = await request.json();
    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Posez votre question à PlumAI.' }, { status: 400 });
    }
    const { text, truncated } = truncateText(textChunk || '');

    const context = text
      ? `Voici le manuscrit de l'auteur (extrait${truncated ? ' tronqué' : ''}) :\n"""\n${text}\n"""\n\n`
      : `L'auteur n'a pas encore fourni de texte. Réponds de façon générale mais utile.\n\n`;

    const messages = [
      {
        role: 'system',
        content:
          SYSTEM_FR +
          `\nTu es l'assistant d'écriture personnel de l'auteur. Tu l'aides à améliorer son manuscrit : style, structure, personnages, dialogues, rythme, idées.\nTes réponses sont en français, claires et actionnables, avec des exemples concrets tirés de son texte quand c'est pertinent.\nRéponses de longueur moyenne (150-300 mots), sauf si l'auteur demande un développement. Utilise le format Markdown (titres, listes, gras).`,
      },
    ];
    const cleanHistory = (history || []).slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    }));
    messages.push(...cleanHistory);
    messages.push({ role: 'user', content: context + 'Question de l\'auteur : ' + question.trim() });

    const reponse = await callAI(messages, { maxTokens: 1500, temperature: 0.7 });
    return NextResponse.json({ reponse });
  } catch (e) {
    return aiError(e.message || "L'assistant IA a échoué.");
  }
}

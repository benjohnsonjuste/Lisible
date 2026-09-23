import { NextResponse } from 'next/server';

// Moteur IA de PlumAI — utilise un modèle de langage via une API gratuite.
// Le texte du manuscrit est tronqué pour rester dans les limites du modèle.

const AI_ENDPOINT = 'https://text.pollinations.ai/openai';
const MAX_CHARS = 12000;

export function truncateText(text, max = MAX_CHARS) {
  const t = (text || '').trim();
  if (t.length <= max) return { text: t, truncated: false };
  return { text: t.slice(0, max), truncated: true };
}

export async function callAI(messages, { maxTokens = 2500, temperature = 0.7 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Le service IA a répondu ${res.status}. Réessayez dans un instant.`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Réponse IA vide. Réessayez.');
    return content;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error("Le service IA met trop de temps à répondre. Réessayez.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Extrait un objet JSON d'une réponse (gère les blocs ```json ... ```)
export function parseAIJson(raw) {
  let s = (raw || '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Format de réponse IA inattendu.');
  return JSON.parse(s.slice(start, end + 1));
}

export function aiError(message) {
  return NextResponse.json({ error: message }, { status: 502 });
}

export const SYSTEM_FR = `Tu es PlumAI, un critique littéraire et coach d'écriture francophone de très haut niveau.
Tu réponds TOUJOURS en français, avec un ton chaleureux, précis et constructif.
Tu ne fais jamais de remarque sur le fait que tu es une IA : tu te concentres sur le texte.
Tes analyses sont concrètes : tu cites des passages du texte fourni pour illustrer chaque remarque.`;

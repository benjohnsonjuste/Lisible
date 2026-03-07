import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

async function getFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Lisible-App'
      },
      cache: 'no-store'
    });
    if (res.status === 404) return null;
    const data = await res.json();
    const decodedContent = new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), (m) => m.codePointAt(0)));
    return { content: JSON.parse(decodedContent), sha: data.sha };
  } catch (err) { return null; }
}

async function updateFile(path, content, sha) {
  const encodedContent = btoa(Array.from(new TextEncoder().encode(JSON.stringify(content, null, 2)), (byte) => String.fromCodePoint(byte)).join(""));
  const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 
      'Content-Type': 'application/json',
      'User-Agent': 'Lisible-App'
    },
    body: JSON.stringify({
      message: `[STATS] Incrémentation vues [skip ci]`,
      content: encodedContent,
      sha: sha
    }),
  });
  return res.ok;
}

export async function POST(req) {
  try {
    const { id } = await req.json();
    const path = `data/podcasts.json`;
    
    const file = await getFile(path);
    if (!file) return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });

    const podcasts = file.content;
    const index = podcasts.findIndex(p => p.id === id);

    if (index !== -1) {
      // Incrémentation (initialise à 1 si le champ n'existe pas encore)
      podcasts[index].views = (podcasts[index].views || 0) + 1;
      
      const success = await updateFile(path, podcasts, file.sha);
      if (success) return NextResponse.json({ success: true, views: podcasts[index].views });
    }

    return NextResponse.json({ error: "Podcast non trouvé" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

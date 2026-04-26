import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// --- HELPERS CORE (Exactement identiques à github-db) ---

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
    if (!res.ok) return null;
    
    const data = await res.json();
    if (!data.content) return null;
    
    const b64 = data.content.replace(/\s/g, '');
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    const decodedContent = new TextDecoder().decode(bytes);
    
    return { content: JSON.parse(decodedContent), sha: data.sha };
  } catch (err) {
    return null;
  }
}

async function updateFile(path, content, sha, message) {
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const encodedContent = btoa(binString);

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 
        'Content-Type': 'application/json',
        'User-Agent': 'Lisible-App'
      },
      body: JSON.stringify({
        message: `[NOVEL BATTLE] ${message} [skip ci]`,
        content: encodedContent,
        sha: sha || undefined
      }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

const globalSort = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const certA = Number(a?.certified || a?.totalCertified || 0);
    const certB = Number(b?.certified || b?.totalCertified || 0);
    if (certB !== certA) return certB - certA;
    const likesA = Number(a?.likes || a?.totalLikes || 0);
    const likesB = Number(b?.likes || b?.totalLikes || 0);
    if (likesB !== likesA) return likesB - likesA;
    const dateB = b?.date ? new Date(b.date).getTime() : 0;
    const dateA = a?.date ? new Date(a.date).getTime() : 0;
    return dateB - dateA;
  });
};

// --- ROUTES ---

export async function GET(req) {
  try {
    const index = await getFile(`data/publications/index.json`);
    if (!index || !Array.isArray(index.content)) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Filtrage exclusif pour le Duel de Nouvelles
    const novelBattleTexts = index.content.filter(t => 
      t.isnovelbattle === true || t.isnovelbattle === "true"
    );

    return NextResponse.json({ 
      success: true, 
      leaderboard: globalSort(novelBattleTexts) 
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, textId, data } = body;
    const indexPath = `data/publications/index.json`;

    // Inscription d'un texte existant au Duel de Nouvelles
    if (action === 'enroll') {
      const path = `data/texts/${textId}.json`;
      const textFile = await getFile(path);
      if (!textFile) return NextResponse.json({ error: "Texte introuvable" }, { status: 404 });

      // 1. Maj du fichier texte
      textFile.content.isnovelbattle = true;
      textFile.content.category = "Nouvelle"; // Force la catégorie pour le duel
      await updateFile(path, textFile.content, textFile.sha, `Inscription Duel: ${textFile.content.title}`);

      // 2. Maj de l'index
      const indexFile = await getFile(indexPath);
      if (indexFile && Array.isArray(indexFile.content)) {
        const itemIndex = indexFile.content.findIndex(t => t.id === textId);
        if (itemIndex > -1) {
          indexFile.content[itemIndex].isnovelbattle = true;
          indexFile.content[itemIndex].category = "Nouvelle";
          await updateFile(indexPath, globalSort(indexFile.content), indexFile.sha, `Sync Index Duel: ${textId}`);
        }
      }
      return NextResponse.json({ success: true });
    }

    // Publication directe pour le duel
    if (action === 'publish_battle') {
      const pubId = `nb_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const newPub = { 
        ...data, 
        id: pubId, 
        isnovelbattle: true, 
        category: "Nouvelle",
        date: new Date().toISOString(), 
        views: 0, likes: 0, certified: 0, comments: [] 
      };

      await updateFile(pubPath, newPub, null, `🚀 Novel Battle: ${data.title}`);

      const indexFile = await getFile(indexPath) || { content: [] };
      let indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
      indexContent.unshift({ 
        id: pubId, title: data.title, author: data.authorName, authorEmail: data.authorEmail, 
        category: "Nouvelle", isnovelbattle: true, date: newPub.date, views: 0, likes: 0, certified: 0 
      });

      await updateFile(indexPath, globalSort(indexContent), indexFile.sha, `📝 Index Update Duel`);
      return NextResponse.json({ success: true, id: pubId });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

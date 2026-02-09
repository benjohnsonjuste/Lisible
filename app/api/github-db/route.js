import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// Helper pour interagir avec l'API GitHub
async function getFile(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    cache: 'no-store',
    headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')),
    sha: data.sha
  };
}

async function updateFile(path, content, sha, message) {
  return fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha
    }),
  });
}

// --- POST : Publication, Commentaires, Signets ---
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, id, textId, userEmail, ...data } = body;

    // 1. ACTION : PUBLISH (Nouvelle œuvre)
    if (!action || action === 'publish') {
      const pubId = id || Buffer.from(`${data.title}-${Date.now()}`).toString('base64').substring(0, 12).replace(/\//g, '_');
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;

      const newPub = {
        ...data,
        id: pubId,
        createdAt: new Date().toISOString(),
        views: 0,
        totalLikes: 0,
        totalCertified: 0,
        comments: []
      };

      // Créer le fichier texte
      await updateFile(pubPath, newPub, null, `🚀 Pub: ${data.title}`);

      // Mettre à jour l'index
      const indexFile = await getFile(indexPath);
      if (indexFile) {
        const indexEntry = {
          id: pubId,
          title: data.title,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          category: data.category,
          date: newPub.createdAt,
          image: data.image || data.imageBase64 || null
        };
        indexFile.content.push(indexEntry);
        await updateFile(indexPath, indexFile.content, indexFile.sha, `📝 Index+ : ${data.title}`);
      }
      return NextResponse.json({ success: true, id: pubId });
    }

    // 2. ACTION : COMMENT
    if (action === 'comment') {
      const pubPath = `data/texts/${textId}.json`;
      const file = await getFile(pubPath);
      if (!file) throw new Error("Texte introuvable");

      const newComment = {
        id: Date.now(),
        userEmail,
        userName: data.userName,
        text: data.comment,
        date: new Date().toISOString()
      };

      file.content.comments = [newComment, ...(file.content.comments || [])];
      await updateFile(pubPath, file.content, file.sha, `💬 Comment on ${textId}`);
      return NextResponse.json({ success: true });
    }

    // 3. ACTION : BOOKMARK (Signets)
    if (action === 'add' || action === 'remove') {
      const bookmarkPath = `data/users/${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_bookmarks.json`;
      const file = await getFile(bookmarkPath) || { content: [], sha: null };
      
      let newList = action === 'add' 
        ? [...new Set([...file.content, textId])] 
        : file.content.filter(bid => bid !== textId);

      await updateFile(bookmarkPath, newList, file.sha, `🔖 Bookmark ${action}`);
      return NextResponse.json({ success: true });
    }

    // 4. ACTION : CERTIFY (Le Sceau)
    if (action === 'certify') {
      const pubPath = `data/texts/${textId}.json`;
      const file = await getFile(pubPath);
      if (!file) throw new Error("Fichier introuvable");

      file.content.totalCertified = (file.content.totalCertified || 0) + 1;
      await updateFile(pubPath, file.content, file.sha, `📜 Certified: ${textId}`);
      return NextResponse.json({ success: true, count: file.content.totalCertified });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- PATCH : Vues et Likes (Actions rapides) ---
export async function PATCH(req) {
  try {
    const { id, action } = await req.json();
    const pubPath = `data/texts/${id}.json`;
    const file = await getFile(pubPath);
    if (!file) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

    if (action === 'view') {
      file.content.views = (file.content.views || 0) + 1;
    } else if (action === 'like') {
      file.content.totalLikes = (file.content.totalLikes || 0) + 1;
    }

    await updateFile(pubPath, file.content, file.sha, `📈 ${action} on ${id}`);
    return NextResponse.json({ success: true, count: action === 'view' ? file.content.views : file.content.totalLikes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { storeImagesIn } from '../_lib/r2.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GITHUB_CONFIG = { owner: "benjohnsonjuste", repo: "Lisible", token: process.env.GITHUB_TOKEN };
const LIVRES_DIR = "data/livres";
const LIVRES_INDEX = "data/livres/index.json";

async function getFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Lisible-App' },
      cache: 'no-store'
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data)) return { content: data, isDir: true };
    if (!data.content) return null;
    const b64 = data.content.replace(/\s/g, '');
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    const decodedContent = new TextDecoder().decode(bytes);
    return { content: JSON.parse(decodedContent), sha: data.sha };
  } catch (err) {
    console.error(`Fetch error [${path}]:`, err.message);
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
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json', 'User-Agent': 'Lisible-App' },
      body: JSON.stringify({ message: `[DATA] ${message} [skip ci]`, content: encodedContent, sha: sha || undefined }),
    });
    return res.ok;
  } catch (err) {
    console.error(`Update error [${path}]:`, err.message);
    return false;
  }
}

const getSafePath = (email) => {
  if (!email) return null;
  const safeEmail = email.toLowerCase().trim().replace(/[@.]/g, '_');
  return `data/users/${safeEmail}.json`;
};

const toIndexEntry = (b) => ({
  id: b.id,
  title: b.title,
  authorName: b.authorName,
  authorEmail: b.authorEmail,
  description: b.description || "",
  cover: b.cover || null,
  pageCount: b.pageCount || 0,
  date: b.date,
  views: b.views || 0,
  likes: b.likes || 0,
});

// GET /api/livres -> catalogue ; /api/livres?id=xxx -> livre complet
export async function GET(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const file = await getFile(`${LIVRES_DIR}/${id}.json`);
      if (!file) return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
      return NextResponse.json(file);
    }
    const index = await getFile(LIVRES_INDEX);
    const list = index && Array.isArray(index.content) ? index.content : [];
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return NextResponse.json({ content: list });
  } catch (e) {
    console.error("API livres GET:", e.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/livres { action: "publish_livre", title, authorName, authorEmail, description, coverBase64, pages[], sourceFormat }
export async function POST(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
    const body = await req.json();
    const { action, ...data } = body;
    if (action !== 'publish_livre') return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    if (!data.title || !String(data.title).trim()) return NextResponse.json({ error: "Le titre du livre est requis." }, { status: 400 });
    if (!Array.isArray(data.pages) || data.pages.length === 0) return NextResponse.json({ error: "Aucune page à publier." }, { status: 400 });

    const livreId = data.id || `livre_${Date.now()}`;
    await storeImagesIn(data, 'livres');

    const newLivre = {
      ...data,
      id: livreId,
      kind: 'livre',
      title: String(data.title).trim(),
      authorName: String(data.authorName || "Une Plume").trim(),
      description: String(data.description || "").trim(),
      cover: data.cover || null,
      pageCount: data.pages.length,
      date: new Date().toISOString(),
      views: 0,
      likes: 0,
    };
    delete newLivre.action;

    const ok = await updateFile(`${LIVRES_DIR}/${livreId}.json`, newLivre, null, `📚 Livre publié: ${newLivre.title}`);
    if (!ok) return NextResponse.json({ error: "Échec de la publication." }, { status: 500 });

    const indexFile = await getFile(LIVRES_INDEX);
    const list = indexFile && Array.isArray(indexFile.content) ? indexFile.content : [];
    list.unshift(toIndexEntry(newLivre));
    await updateFile(LIVRES_INDEX, list, (indexFile && indexFile.sha) || null, `📚 Index livres: ${newLivre.title}`);

    if (data.authorEmail) {
      const upath = getSafePath(data.authorEmail);
      const ufile = await getFile(upath);
      if (ufile && ufile.content) {
        ufile.content.works = ufile.content.works || [];
        ufile.content.works.unshift({ id: livreId, kind: 'livre', title: newLivre.title, date: newLivre.date });
        await updateFile(upath, ufile.content, ufile.sha, `📚 Livre ajouté: ${data.authorEmail}`);
      }
    }

    return NextResponse.json({ success: true, id: livreId });
  } catch (e) {
    console.error("API livres POST:", e.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/livres { id, action: "view" | "like" }
export async function PATCH(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
    const { id, action } = await req.json();
    if (!id || !['view', 'like'].includes(action)) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    const path = `${LIVRES_DIR}/${id}.json`;
    const file = await getFile(path);
    if (!file) return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
    if (action === 'view') file.content.views = (file.content.views || 0) + 1;
    if (action === 'like') file.content.likes = (file.content.likes || 0) + 1;
    await updateFile(path, file.content, file.sha, `📚 ${action}: ${id}`);
    const indexFile = await getFile(LIVRES_INDEX);
    if (indexFile && Array.isArray(indexFile.content)) {
      const it = indexFile.content.find((x) => x.id === id);
      if (it) {
        it.views = file.content.views;
        it.likes = file.content.likes;
        await updateFile(LIVRES_INDEX, indexFile.content, indexFile.sha, `📚 Sync index: ${id} (${action})`);
      }
    }
    return NextResponse.json({ success: true, count: action === 'view' ? file.content.views : file.content.likes });
  } catch (e) {
    console.error("API livres PATCH:", e.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

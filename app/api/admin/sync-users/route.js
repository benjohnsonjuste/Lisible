import { NextResponse } from 'next/server';
import { getSessionUser } from "../../_lib/session.js";

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "cmo.lablitteraire7@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export async function GET(req) {
  try {
    // Réservé à l'administration : session vérifiée requise.
    const { searchParams } = new URL(req.url);
    const session = await getSessionUser(searchParams.get("sessionToken")).catch(() => null);
    if (!session || !ADMIN_EMAILS.includes((session.email || "").toLowerCase())) {
      return NextResponse.json({ error: "Accès réservé à l'administration." }, { status: 403 });
    }
    // 1. Lister tous les fichiers dans data/users
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const listRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`, {
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Lisible-App' },
      cache: 'no-store'
    });

    const files = await listRes.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json') && f.name !== 'index.json');
    // Traitement par lots : une invocation Worker est limitée en sous-requêtes.
    const batchFiles = jsonFiles.slice(offset, offset + limit);

    // 2. Récupérer le contenu de chaque utilisateur du lot
    const usersData = await Promise.all(batchFiles.map(async (file) => {
      const res = await fetch(file.download_url);
      const data = await res.json();
      return {
        id: data.id || file.name.replace('.json', ''),
        name: data.name || data.fullName || "Inconnu",
        email: data.email
      };
    }));

    // 3. Sauvegarder/Créer le fichier index.json sur GitHub
    const indexPath = "data/users/index.json";
    
    // On vérifie si l'index existe déjà pour avoir son SHA (nécessaire pour l'update)
    const existingIndex = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${indexPath}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'User-Agent': 'Lisible-App' }
    });
    const indexData = existingIndex.ok ? await existingIndex.json() : null;
    let existingUsers = [];
    try {
      const decoded = indexData?.content ? Buffer.from(indexData.content, 'base64').toString('utf-8') : "[]";
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) existingUsers = parsed;
    } catch { existingUsers = []; }
    // Fusion du lot dans l'index existant (clé : email, repli sur id).
    const merged = new Map();
    for (const u of existingUsers) merged.set((u.email || u.id || "").toLowerCase(), u);
    for (const u of usersData) merged.set((u.email || u.id || "").toLowerCase(), u);
    const mergedList = [...merged.values()];

    const contentBase64 = Buffer.from(JSON.stringify(mergedList, null, 2)).toString('base64');

    await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${indexPath}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json', 'User-Agent': 'Lisible-App' },
      body: JSON.stringify({
        message: `Index utilisateurs (lot ${offset + 1}-${offset + batchFiles.length}/${jsonFiles.length})`,
        content: contentBase64,
        sha: indexData?.sha // Si le fichier existe, on passe son SHA
      })
    });

    const nextOffset = offset + batchFiles.length;
    return NextResponse.json({
      success: true,
      done: nextOffset >= jsonFiles.length,
      nextOffset,
      total: jsonFiles.length,
      count: mergedList.length
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

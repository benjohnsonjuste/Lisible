import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCES_TOKEN
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder');
  const debug = searchParams.get('debug') === '1';
  const listOnly = searchParams.get('mode') === 'list';

  if (!folder) {
    return NextResponse.json({ error: "Spécifiez un dossier (folder)" }, { status: 400 });
  }

  try {
    // 1. Récupérer la liste des fichiers avec désactivation stricte du cache
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Lisible-App',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
    // Le dépôt est public : on tente avec le token, sinon sans (repli gracieux)
    if (GITHUB_CONFIG.token) headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
    const listRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/${folder}`,
      {
        headers,
        // Force Next.js à ne pas mettre en cache cette route API
        cache: 'no-store'
      }
    );

    if (!listRes.ok) {
      if (debug) {
        let bodySnippet = "";
        try { bodySnippet = (await listRes.text()).slice(0, 200); } catch {}
        return NextResponse.json({
          debug: {
            hasToken: !!GITHUB_CONFIG.token,
            tokenLen: (GITHUB_CONFIG.token || "").length,
            tokenStart: (GITHUB_CONFIG.token || "").slice(0, 4),
            upstreamStatus: listRes.status,
            upstreamBody: bodySnippet
          },
          content: []
        });
      }
      return NextResponse.json({ content: [] });
    }

    const files = await listRes.json();

    // Mode "email" : un seul profil utilisateur (2 sous-requêtes max).
    // Le nom du fichier est dérivé de l'email : minuscules, tout caractère
    // non alphanumérique remplacé par "_". Contourne la limite de 50
    // sous-requêtes par invocation du Worker (63 profils à ce jour).
    const emailParam = searchParams.get('email');
    if (emailParam && folder === 'users') {
      const fileName = emailParam.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') + '.json';
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/data/users/${fileName}`,
        { cache: 'no-store' }
      );
      if (!fileRes.ok) return NextResponse.json({ folder, total: 0, content: [] });
      const user = await fileRes.json();
      return NextResponse.json({ folder, total: 1, content: [user] });
    }

    // Mode "list" : on ne renvoie que la liste des fichiers (1 seule sous-requête).
    // Le client télécharge ensuite chaque fichier via son download_url (même
    // modèle que la page salon). Cela contourne la limite de 50 sous-requêtes
    // par invocation du Worker.
    if (listOnly) {
      const list = files
        .filter(file => file.name.endsWith('.json'))
        .map(file => ({ name: file.name, download_url: file.download_url, size: file.size }));
      return NextResponse.json({ folder, total: list.length, files: list }, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Content-Type': 'application/json' }
      });
    }

    // 2. Lire le contenu de chaque fichier JSON, par petits lots avec réessai
    const jsonFiles = files.filter(file => file.name.endsWith('.json'));
    const failures = [];
    async function fetchOne(file, attempt) {
      try {
        const nocacheUrl = `${file.download_url}?t=${Date.now()}`;
        const fileRes = await fetch(nocacheUrl, { cache: 'no-store' });
        if (!fileRes.ok) throw new Error('HTTP ' + fileRes.status);
        return await fileRes.json();
      } catch (e) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 400 * attempt));
          return fetchOne(file, attempt + 1);
        }
        failures.push({ name: file.name, error: String(e && e.message || e).slice(0, 120) });
        return null;
      }
    }
    const cleanResults = [];
    const BATCH = 8;
    for (let i = 0; i < jsonFiles.length; i += BATCH) {
      const batch = await Promise.all(jsonFiles.slice(i, i + BATCH).map(f => fetchOne(f, 1)));
      for (const r of batch) if (r !== null) cleanResults.push(r);
    }

    // 3. Retourner les données propres
    const body = {
      folder: folder,
      total: cleanResults.length,
      content: cleanResults
    };
    if (debug) body.debugFiles = { listed: jsonFiles.length, failures };

    return NextResponse.json(body, {
      // Headers de réponse pour empêcher le navigateur de mettre en cache la liste
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

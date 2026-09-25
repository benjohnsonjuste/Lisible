import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

const GH_HEADERS = {
  'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
  'Accept': 'application/vnd.github.v3+json',
  // L'API GitHub exige un header User-Agent, sinon 403 « Request forbidden by administrative rules ».
  'User-Agent': 'Lisible-App'
};

// Synchronisation des stats utilisateurs depuis l'index des publications.
// Traitement par lots : une invocation Cloudflare Workers est limitée en sous-requêtes
// (2 + 2 × limite par appel). Appelez avec ?offset=N&limit=20 jusqu'à done: true.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

    // 1. Récupérer l'index des publications
    const pubRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/publications/index.json`,
      { headers: GH_HEADERS, cache: 'no-store' }
    );

    if (!pubRes.ok) {
      const errText = await pubRes.text().catch(() => "");
      throw new Error(`GitHub contents API: HTTP ${pubRes.status} — ${errText.slice(0, 200)}`);
    }

    const pubFileData = await pubRes.json();
    // L'API Contents ne renvoie pas le contenu base64 des fichiers > 1 Mo :
    // on bascule alors sur download_url (contenu brut), sinon JSON.parse("") lève.
    let pubJsonText;
    if (pubFileData.content && String(pubFileData.content).trim()) {
      pubJsonText = Buffer.from(pubFileData.content, 'base64').toString();
    } else if (pubFileData.download_url) {
      const dlRes = await fetch(pubFileData.download_url, { cache: 'no-store' });
      if (!dlRes.ok) throw new Error(`Téléchargement index publications: HTTP ${dlRes.status}`);
      pubJsonText = await dlRes.text();
    } else {
      throw new Error("Réponse GitHub sans contenu ni download_url pour l'index des publications.");
    }
    const pubContent = JSON.parse(pubJsonText);
    const allPublications = Array.isArray(pubContent) ? pubContent : [];

    // 2. Récupérer la liste des fichiers utilisateurs
    const usersListRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`,
      { headers: GH_HEADERS, cache: 'no-store' }
    );
    if (!usersListRes.ok) throw new Error(`Liste utilisateurs GitHub: HTTP ${usersListRes.status}`);
    const allUserFiles = (await usersListRes.json()).filter(f => f.name && f.name.endsWith('.json'));

    const batch = allUserFiles.slice(offset, offset + limit);
    const updates = [];

    // 3. Traiter le lot d'utilisateurs
    for (const file of batch) {
      const userRes = await fetch(file.download_url, { cache: 'no-store' });
      const userData = await userRes.json();
      const email = userData.email?.toLowerCase().trim();

      if (!email) { updates.push({ user: file.name, status: "⏭️ Ignoré (sans email)" }); continue; }

      // Calcul des stats
      const userPubs = allPublications.filter(p => p.authorEmail?.toLowerCase().trim() === email);

      const updatedData = {
        ...userData,
        totalLikes: userPubs.reduce((acc, p) => acc + Number(p.likes || 0), 0),
        totalCertifications: userPubs.reduce((acc, p) => acc + Number(p.certified || 0), 0),
        totalFollowers: Array.isArray(userData.followers) ? userData.followers.length : 0,
        lastStatsUpdate: new Date().toISOString()
      };

      // 4. Encodage sécurisé en Base64 (gestion des caractères spéciaux/accents)
      const jsonString = JSON.stringify(updatedData, null, 2);
      const encodedContent = Buffer.from(jsonString, 'utf-8').toString('base64');

      const putRes = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${file.path}`,
        {
          method: "PUT",
          headers: { ...GH_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `📊 Stats Sync: ${email}`,
            content: encodedContent,
            sha: file.sha
          })
        }
      );

      updates.push({ user: email, status: putRes.ok ? "✅ OK" : "❌ Erreur" });
    }

    const nextOffset = offset + batch.length;
    return NextResponse.json({
      success: true,
      done: nextOffset >= allUserFiles.length,
      nextOffset,
      total: allUserFiles.length,
      traites: batch.length,
      results: updates
    });

  } catch (error) {
    return NextResponse.json({
      error: "Échec de la synchronisation des statistiques",
      details: error.message
    }, { status: 500 });
  }
}

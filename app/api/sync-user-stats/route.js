import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function GET() {
  try {
    // 1. Récupérer l'index des publications proprement
    const pubRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/publications/index.json`,
      { 
        headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json' },
        cache: 'no-store' 
      }
    );

    if (!pubRes.ok) throw new Error("Impossible de lire l'index des publications.");
    
    const pubFileData = await pubRes.json();
    const pubContent = JSON.parse(Buffer.from(pubFileData.content, 'base64').toString());
    const allPublications = Array.isArray(pubContent) ? pubContent : [];

    // 2. Récupérer la liste des fichiers utilisateurs
    const usersListRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`,
      { headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }, cache: 'no-store' }
    );
    const userFiles = await usersListRes.json();

    const updates = [];

    // 3. Traiter chaque utilisateur
    for (const file of userFiles) {
      if (!file.name.endsWith('.json')) continue;

      const userRes = await fetch(file.download_url, { cache: 'no-store' });
      const userData = await userRes.json();
      const email = userData.email?.toLowerCase().trim();

      if (!email) continue;

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
          headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `📊 Stats Sync: ${email}`,
            content: encodedContent,
            sha: file.sha
          })
        }
      );

      updates.push({ user: email, status: putRes.ok ? "✅ OK" : "❌ Erreur" });
    }

    return NextResponse.json({ success: true, results: updates });

  } catch (error) {
    return NextResponse.json({ 
      error: "Erreur de formatage JSON détectée", 
      details: error.message,
      conseil: "Vérifiez manuellement le fichier data/publications/index.json sur GitHub pour corriger la virgule manquante."
    }, { status: 500 });
  }
}

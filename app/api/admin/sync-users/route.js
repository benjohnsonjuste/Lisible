import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function GET() {
  try {
    // 1. Lister tous les fichiers dans data/users
    const listRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`, {
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json' },
      cache: 'no-store'
    });

    const files = await listRes.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json') && f.name !== 'index.json');

    // 2. Récupérer le contenu de chaque utilisateur
    const usersData = await Promise.all(jsonFiles.map(async (file) => {
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
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }
    });
    const indexData = existingIndex.ok ? await existingIndex.json() : null;

    const contentBase64 = Buffer.from(JSON.stringify(usersData, null, 2)).toString('base64');

    await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${indexPath}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Initialisation de l'index des utilisateurs",
        content: contentBase64,
        sha: indexData?.sha // Si le fichier existe, on passe son SHA
      })
    });

    return NextResponse.json({ success: true, count: usersData.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

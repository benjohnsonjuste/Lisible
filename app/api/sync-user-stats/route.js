import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function GET() {
  try {
    // 1. Récupérer toutes les publications pour calculer les stats (Likes, Certifications)
    const pubRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/publications`,
      { headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }, next: { revalidate: 0 } }
    );
    const pubFiles = await pubRes.json();
    
    // On récupère le contenu de l'index ou des fichiers de publications
    const pubDataRes = await fetch(pubFiles[0].download_url);
    const allPublications = await pubDataRes.json();

    // 2. Récupérer la liste des fichiers utilisateurs
    const usersListRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`,
      { headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }, next: { revalidate: 0 } }
    );
    const userFiles = await usersListRes.json();

    const updateResults = [];

    // 3. Boucler sur chaque utilisateur pour mettre à jour son fichier
    for (const file of userFiles) {
      if (!file.name.endsWith('.json')) continue;

      // Lire le fichier utilisateur actuel
      const userContentRes = await fetch(file.download_url);
      const userData = await userContentRes.json();
      const email = userData.email?.toLowerCase().trim();

      if (!email) continue;

      // Calculer les nouvelles stats depuis les publications
      const userPubs = allPublications.filter(p => p.authorEmail?.toLowerCase().trim() === email);
      
      const totalLikes = userPubs.reduce((acc, p) => acc + Number(p.likes || 0), 0);
      const totalCertifications = userPubs.reduce((acc, p) => acc + Number(p.certified || 0), 0);
      const totalFollowers = Array.isArray(userData.followers) ? userData.followers.length : 0;

      // Créer l'objet mis à jour
      const updatedUserData = {
        ...userData,
        totalLikes: totalLikes,
        totalCertifications: totalCertifications,
        totalFollowers: totalFollowers,
        lastSync: new Date().toISOString()
      };

      // 4. Renvoyer le fichier mis à jour vers GitHub
      const putRes = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${file.path}`,
        {
          method: "PUT",
          headers: { 
            'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `🔄 Sync stats pour ${email}`,
            content: Buffer.from(JSON.stringify(updatedUserData, null, 2)).toString('base64'),
            sha: file.sha // Obligatoire pour mettre à jour un fichier existant
          })
        }
      );

      updateResults.push({ email, success: putRes.ok });
    }

    return NextResponse.json({ message: "Synchronisation terminée", details: updateResults });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

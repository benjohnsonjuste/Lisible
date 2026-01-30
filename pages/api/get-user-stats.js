import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: "Méthode non autorisée" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const cleanEmail = email.trim().toLowerCase();
  
  // Encodage Base64 du nom de fichier
  const userFileName = Buffer.from(cleanEmail).toString('base64').replace(/=/g, "") + ".json";

  try {
    // 1. Récupération du Profil (Abonnés)
    let subscribersCount = 0;
    try {
      const { data: userData } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: `data/users/${userFileName}`,
        headers: { 'If-None-Match': '' } // Bypass cache
      });
      const userProfile = JSON.parse(Buffer.from(userData.content, "base64").toString());
      subscribersCount = userProfile.subscribers?.length || 0;
    } catch (e) {
      console.log("Profil non trouvé.");
    }

    // 2. Récupération des Manuscrits
    const { data: files } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/publications"
    });

    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    const textPromises = jsonFiles.map(async (file) => {
      try {
        const { data: contentData } = await octokit.repos.getContent({
          owner: "benjohnsonjuste",
          repo: "Lisible",
          path: file.path
        });
        return JSON.parse(Buffer.from(contentData.content, "base64").toString());
      } catch (e) { return null; }
    });

    const allTexts = (await Promise.all(textPromises)).filter(t => t !== null);

    // 3. Filtrage et Calcul
    const userTexts = allTexts.filter(t => 
      t.authorEmail && t.authorEmail.trim().toLowerCase() === cleanEmail
    );

    const stats = userTexts.reduce((acc, curr) => {
      return {
        totalViews: acc.totalViews + (Number(curr.views) || 0),
        totalLikes: acc.totalLikes + (curr.likes?.length || 0),
        totalTexts: acc.totalTexts + 1
      };
    }, { totalViews: 0, totalLikes: 0, totalTexts: 0 });

    // 4. Génération des données pour le graphique (7 derniers jours)
    // On répartit le total des vues de manière organique pour simuler une activité
    const generateActivity = (total) => {
      if (total === 0) return [0, 0, 0, 0, 0, 0, 0];
      const base = total / 10;
      return [
        Math.floor(base * 0.8),
        Math.floor(base * 1.2),
        Math.floor(base * 0.5),
        Math.floor(base * 1.5),
        Math.floor(base * 0.9),
        Math.floor(base * 2.1),
        Math.floor(base * 1.0)
      ];
    };

    const isMonetized = subscribersCount >= 250;
    const earnings = isMonetized ? (stats.totalViews / 1000) * 0.20 : 0;

    res.status(200).json({
      subscribers: subscribersCount,
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes,
      totalTexts: stats.totalTexts,
      estimatedEarnings: earnings.toFixed(2),
      isMonetized,
      dailyActivity: generateActivity(stats.totalViews), // Transmis au composant graphique
      currency: "USD"
    });

  } catch (error) {
    console.error("Erreur API Stats:", error);
    res.status(500).json({ error: "Erreur serveur lors du calcul des stats" });
  }
}

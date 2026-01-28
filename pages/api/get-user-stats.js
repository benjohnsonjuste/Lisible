import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: "Méthode non autorisée" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const cleanEmail = email.trim().toLowerCase();
  // Génération du nom de fichier utilisateur (base64 de l'email)
  const userFileName = Buffer.from(cleanEmail).toString('base64').replace(/=/g, "") + ".json";

  try {
    // 1. Récupérer les infos du profil (pour les abonnés)
    let subscribersCount = 0;
    try {
      const { data: userData } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: `data/users/${userFileName}`
      });
      const userProfile = JSON.parse(Buffer.from(userData.content, "base64").toString());
      subscribersCount = userProfile.subscribers?.length || 0;
    } catch (e) {
      console.log("Profil non trouvé, abonnés par défaut à 0");
    }

    // 2. Récupérer la liste de tous les manuscrits
    const { data: files } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/publications"
    });

    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    // 3. Récupérer le contenu de chaque manuscrit
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

    // 4. Filtrer les textes de l'auteur
    const userTexts = allTexts.filter(t => 
      t.authorEmail && t.authorEmail.trim().toLowerCase() === cleanEmail
    );

    // 5. Calculer les statistiques
    const stats = userTexts.reduce((acc, curr) => {
      return {
        totalViews: acc.totalViews + (Number(curr.views) || 0),
        totalLikes: acc.totalLikes + (curr.likes?.length || 0),
        totalTexts: acc.totalTexts + 1
      };
    }, { totalViews: 0, totalLikes: 0, totalTexts: 0 });

    // 6. Calcul des revenus (Seuil de monétisation : 250 abonnés)
    const isMonetized = subscribersCount >= 250;
    const earnings = isMonetized ? (stats.totalViews / 1000) * 0.20 : 0;

    res.status(200).json({
      subscribers: subscribersCount,
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes,
      totalTexts: stats.totalTexts,
      estimatedEarnings: earnings.toFixed(2),
      isMonetized,
      currency: "USD"
    });

  } catch (error) {
    console.error("Erreur API Stats:", error);
    res.status(200).json({ 
      subscribers: 0,
      totalViews: 0, 
      totalLikes: 0, 
      totalTexts: 0,
      estimatedEarnings: "0.00",
      isMonetized: false
    });
  }
}

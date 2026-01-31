import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: "Méthode non autorisée" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const cleanEmail = email.trim().toLowerCase();
  
  // Utilisation directe de l'email pour le nom de fichier (cohérent avec tes autres APIs)
  const userFileName = `${cleanEmail}.json`;

  try {
    // 1. Récupération du Profil & Portefeuille de Li
    let subscribersCount = 0;
    let currentLiBalance = 0;
    try {
      const { data: userData } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: `data/users/${userFileName}`,
        headers: { 'If-None-Match': '' } 
      });
      const userProfile = JSON.parse(Buffer.from(userData.content, "base64").toString());
      subscribersCount = userProfile.subscribers?.length || 0;
      currentLiBalance = userProfile.wallet?.balance || 0;
    } catch (e) {
      console.log("Profil ou Wallet non trouvé.");
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

    // 3. Filtrage et Calcul (Inclusion de certifiedReads)
    const userTexts = allTexts.filter(t => 
      t.authorEmail && t.authorEmail.trim().toLowerCase() === cleanEmail
    );

    const stats = userTexts.reduce((acc, curr) => {
      return {
        totalViews: acc.totalViews + (Number(curr.views) || 0),
        totalLikes: acc.totalLikes + (curr.likes?.length || 0),
        totalCertified: acc.totalCertified + (Number(curr.certifiedReads) || 0),
        totalTexts: acc.totalTexts + 1
      };
    }, { totalViews: 0, totalLikes: 0, totalCertified: 0, totalTexts: 0 });

    // 4. Conversion des Li en Valeur Monétaire (ex: 1000 Li = 1 USD)
    const LI_TO_USD_RATE = 0.001; 
    const estimatedValueUSD = (currentLiBalance * LI_TO_USD_RATE).toFixed(2);

    res.status(200).json({
      subscribers: subscribersCount,
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes,
      totalCertified: stats.totalCertified, // Nouvelle stat clé
      totalTexts: stats.totalTexts,
      liBalance: currentLiBalance, // Ton solde actuel de Li
      estimatedValueUSD: estimatedValueUSD,
      // On simule l'activité basée sur les lectures certifiées (plus gratifiant)
      dailyActivity: generateActivity(stats.totalCertified || stats.totalViews / 10), 
      currency: "Li"
    });

  } catch (error) {
    console.error("Erreur API Stats:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Fonction utilitaire pour le graphique
const generateActivity = (total) => {
  if (total === 0) return [0, 0, 0, 0, 0, 0, 0];
  const base = total / 7;
  return [
    Math.floor(base * 0.5), Math.floor(base * 1.5),
    Math.floor(base * 0.8), Math.floor(base * 1.2),
    Math.floor(base * 0.7), Math.floor(base * 2.0),
    Math.floor(base * 1.0)
  ];
};

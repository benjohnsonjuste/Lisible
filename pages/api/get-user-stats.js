import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: "Méthode non autorisée" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const cleanEmail = email.trim().toLowerCase();
  const userFileName = `${cleanEmail}.json`;

  try {
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

    // --- LOGIQUE DE MONÉTISATION ET RETRAIT ---
    const LI_TO_USD_RATE = 0.0002; // 1000 Li = 0.20$
    const MINIMUM_WITHDRAWAL_USD = 5.00;
    
    const estimatedValueUSD = (currentLiBalance * LI_TO_USD_RATE).toFixed(2);
    
    // Condition 1: 250 Abonnés
    const isEligibleForMonetization = subscribersCount >= 250;
    
    // Condition 2: Solde suffisant pour retrait (5$)
    const canWithdraw = isEligibleForMonetization && (parseFloat(estimatedValueUSD) >= MINIMUM_WITHDRAWAL_USD);

    res.status(200).json({
      subscribers: subscribersCount,
      totalViews: stats.totalViews,
      totalCertified: stats.totalCertified, 
      totalTexts: stats.totalTexts,
      liBalance: currentLiBalance, 
      estimatedValueUSD: estimatedValueUSD,
      isMonetized: isEligibleForMonetization,
      canWithdraw: canWithdraw, // Nouvelle info pour activer le bouton de retrait
      minimumWithdrawal: MINIMUM_WITHDRAWAL_USD,
      remainingForWithdrawal: Math.max(0, MINIMUM_WITHDRAWAL_USD - parseFloat(estimatedValueUSD)).toFixed(2),
      remainingSubscribers: Math.max(0, 250 - subscribersCount),
      dailyActivity: generateActivity(stats.totalCertified || stats.totalViews / 10), 
      currency: "Li",
      rateInfo: "0.20$ / 1000 Li"
    });

  } catch (error) {
    console.error("Erreur API Stats:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

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

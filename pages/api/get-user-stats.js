import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: "Méthode non autorisée" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const cleanEmail = email.trim().toLowerCase();
  
  const OWNER = "benjohnsonjuste";
  const REPO = "Lisible";

  try {
    let subscribersCount = 0;
    let currentLiBalance = 0;

    // 1. RÉCUPÉRER LE PROFIL UTILISATEUR (Profil + Wallet)
    try {
      const { data: userData } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: `data/users/${cleanEmail}.json`,
      });
      const userProfile = JSON.parse(Buffer.from(userData.content, "base64").toString());
      subscribersCount = userProfile.subscribers?.length || 0;
      currentLiBalance = userProfile.wallet?.balance || 0;
    } catch (e) {
      console.log("Utilisateur non trouvé, stats à zéro.");
    }

    // 2. RÉCUPÉRER L'INDEX GLOBAL (Beaucoup plus rapide que de scanner tout le dossier)
    let userStats = { totalViews: 0, totalLikes: 0, totalCertified: 0, totalTexts: 0 };
    
    try {
      const { data: indexData } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: "data/publications/index.json",
      });
      
      const allTexts = JSON.parse(Buffer.from(indexData.content, "base64").toString());
      
      // Filtrer les textes appartenant à cet utilisateur
      const userTexts = allTexts.filter(t => t.authorEmail?.toLowerCase().trim() === cleanEmail);
      
      userStats = userTexts.reduce((acc, curr) => ({
        totalViews: acc.totalViews + (Number(curr.views) || 0),
        totalLikes: acc.totalLikes + (Number(curr.totalLikes || curr.likes || 0)),
        totalCertified: acc.totalCertified + (Number(curr.totalCertified || 0)),
        totalTexts: acc.totalTexts + 1
      }), { totalViews: 0, totalLikes: 0, totalCertified: 0, totalTexts: 0 });
      
    } catch (e) {
      console.error("Erreur lecture index publications:", e);
    }

    // --- LOGIQUE DE MONÉTISATION ---
    const LI_TO_USD_RATE = 0.0002; // 1000 Li = 0.20$
    const MINIMUM_WITHDRAWAL_USD = 5.00;
    const estimatedValueUSD = (currentLiBalance * LI_TO_USD_RATE).toFixed(2);
    
    const isEligibleForMonetization = subscribersCount >= 250;
    const canWithdraw = isEligibleForMonetization && (parseFloat(estimatedValueUSD) >= MINIMUM_WITHDRAWAL_USD);

    

    res.status(200).json({
      subscribers: subscribersCount,
      totalViews: userStats.totalViews,
      totalLikes: userStats.totalLikes,
      totalCertified: userStats.totalCertified, 
      totalTexts: userStats.totalTexts,
      liBalance: currentLiBalance, 
      estimatedValueUSD: estimatedValueUSD,
      isMonetized: isEligibleForMonetization,
      canWithdraw: canWithdraw,
      minimumWithdrawal: MINIMUM_WITHDRAWAL_USD,
      remainingForWithdrawal: Math.max(0, MINIMUM_WITHDRAWAL_USD - parseFloat(estimatedValueUSD)).toFixed(2),
      remainingSubscribers: Math.max(0, 250 - subscribersCount),
      dailyActivity: generateActivity(userStats.totalCertified || (userStats.totalViews / 10)), 
      currency: "Li",
      rateInfo: "0.20$ / 1000 Li"
    });

  } catch (error) {
    console.error("Erreur API Stats:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Générateur d'activité fictive (pour le graphique du dashboard)
const generateActivity = (total) => {
  const safeTotal = Math.max(total, 0);
  if (safeTotal === 0) return [0, 0, 0, 0, 0, 0, 0];
  const base = safeTotal / 7;
  return [
    Math.floor(base * 0.5), Math.floor(base * 1.5),
    Math.floor(base * 0.8), Math.floor(base * 1.2),
    Math.floor(base * 0.7), Math.floor(base * 2.0),
    Math.floor(base * 1.0)
  ];
};

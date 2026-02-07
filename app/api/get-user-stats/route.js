// app/api/get-user-stats/route.js
import { Octokit } from "@octokit/rest";
import { Buffer } from "buffer";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return new Response(JSON.stringify({ error: "Email requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const cleanEmail = email.trim().toLowerCase();
  
  const OWNER = "benjohnsonjuste";
  const REPO = "Lisible";

  try {
    let subscribersCount = 0;
    let currentLiBalance = 0;

    // 1. RÉCUPÉRER LE PROFIL UTILISATEUR via son ID Base64
    try {
      const userFileId = Buffer.from(cleanEmail).toString("base64").replace(/=/g, "");
      const { data: userData } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: `data/users/${userFileId}.json`,
      });
      
      const userProfile = JSON.parse(Buffer.from(userData.content, "base64").toString());
      subscribersCount = userProfile.subscribers?.length || 0;
      currentLiBalance = userProfile.wallet?.balance || 0;
    } catch (e) {
      console.log("Profil introuvable, initialisation des stats à zéro.");
    }

    // 2. RÉCUPÉRER L'INDEX GLOBAL DES PUBLICATIONS
    let userStats = { totalViews: 0, totalLikes: 0, totalCertified: 0, totalTexts: 0 };
    
    try {
      const { data: indexData } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: "data/publications/index.json",
      });
      
      const allTexts = JSON.parse(Buffer.from(indexData.content, "base64").toString());
      
      // Filtrage par email auteur
      const userTexts = allTexts.filter(t => t.authorEmail?.toLowerCase().trim() === cleanEmail);
      
      userStats = userTexts.reduce((acc, curr) => ({
        totalViews: acc.totalViews + (Number(curr.views) || 0),
        totalLikes: acc.totalLikes + (Number(curr.totalLikes || curr.likes || 0)),
        totalCertified: acc.totalCertified + (Number(curr.totalCertified || 0)),
        totalTexts: acc.totalTexts + 1
      }), { totalViews: 0, totalLikes: 0, totalCertified: 0, totalTexts: 0 });
      
    } catch (e) {
      console.error("Erreur lors de la lecture de l'index.");
    }

    // --- LOGIQUE DE MONÉTISATION ---
    const LI_TO_USD_RATE = 0.0002; 
    const MINIMUM_WITHDRAWAL_USD = 5.00;
    const estimatedValueUSD = (currentLiBalance * LI_TO_USD_RATE).toFixed(2);
    
    const isEligibleForMonetization = subscribersCount >= 250;
    const canWithdraw = isEligibleForMonetization && (parseFloat(estimatedValueUSD) >= MINIMUM_WITHDRAWAL_USD);

    const statsPayload = {
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
    };

    return new Response(JSON.stringify(statsPayload), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0"
      },
    });

  } catch (error) {
    console.error("Erreur API Stats:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur lors du calcul des statistiques" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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

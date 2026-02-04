import { getFile, updateFile } from "@/lib/github";
import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { authorEmail } = req.body; // L'email du filleul qui vient de publier

  try {
    // 1. Récupérer le profil du filleul
    const fileName = Buffer.from(authorEmail.toLowerCase()).toString('base64').replace(/=/g, "");
    const authorPath = `data/users/${fileName}.json`;
    const authorData = await getFile(authorPath);

    if (!authorData) return res.status(404).json({ error: "Auteur non trouvé" });

    // 2. Vérifier s'il a un parrain et si la récompense n'a pas déjà été versée
    if (authorData.referredBy && !authorData.stats.referralRewardProcessed) {
      
      const referrerEmail = authorData.referredBy.toLowerCase();
      const referrerFileName = Buffer.from(referrerEmail).toString('base64').replace(/=/g, "");
      const referrerPath = `data/users/${referrerFileName}.json`;
      
      const referrerData = await getFile(referrerPath);

      if (referrerData) {
        // 3. Créditer le parrain de 500 Li
        const updatedReferrer = {
          ...referrerData,
          wallet: {
            ...referrerData.wallet,
            balance: (referrerData.wallet.balance || 0) + 500,
            totalEarned: (referrerData.wallet.totalEarned || 0) + 500,
            history: [
              ...(referrerData.wallet.history || []),
              {
                date: new Date().toISOString(),
                type: "referral_bonus",
                amount: 500,
                label: `Bonus parrainage : ${authorData.penName || authorData.name}`
              }
            ]
          }
        };

        // 4. Marquer le parrainage comme "Traité" chez le filleul pour éviter les doublons
        const updatedAuthor = {
          ...authorData,
          stats: {
            ...authorData.stats,
            referralRewardProcessed: true
          }
        };

        // Sauvegarder les deux profils
        await updateFile(referrerPath, updatedReferrer, null, `🎁 Bonus parrainage pour ${referrerEmail}`);
        await updateFile(authorPath, updatedAuthor, null, `✅ Parrainage validé pour ${authorEmail}`);

        return res.status(200).json({ success: true, message: "Récompense versée au parrain" });
      }
    }

    return res.status(200).json({ success: false, message: "Aucun parrainage à traiter" });

  } catch (error) {
    console.error("Referral Reward Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

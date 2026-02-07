// app/api/process-referral-reward/route.js
import { getFile, updateFile } from "@/lib/github";
import { Buffer } from "buffer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { authorEmail } = body; // L'email du filleul qui vient de publier

    if (!authorEmail) {
      return new Response(JSON.stringify({ error: "Email de l'auteur requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Récupérer le profil du filleul
    const fileName = Buffer.from(authorEmail.toLowerCase().trim()).toString('base64').replace(/=/g, "");
    const authorPath = `data/users/${fileName}.json`;
    const authorRes = await getFile(authorPath);

    if (!authorRes) {
      return new Response(JSON.stringify({ error: "Auteur non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authorData = authorRes.content;

    // 2. Vérifier s'il a un parrain et si la récompense n'a pas déjà été versée
    if (authorData.referredBy && !authorData.stats?.referralRewardProcessed) {
      
      const referrerEmail = authorData.referredBy.toLowerCase().trim();
      const referrerFileName = Buffer.from(referrerEmail).toString('base64').replace(/=/g, "");
      const referrerPath = `data/users/${referrerFileName}.json`;
      
      const referrerRes = await getFile(referrerPath);

      if (referrerRes) {
        const referrerData = referrerRes.content;

        // 3. Créditer le parrain de 500 Li
        const updatedReferrer = {
          ...referrerData,
          wallet: {
            ...referrerData.wallet,
            balance: (Number(referrerData.wallet?.balance) || 0) + 500,
            totalEarned: (Number(referrerData.wallet?.totalEarned) || 0) + 500,
            history: [
              {
                date: new Date().toISOString(),
                type: "referral_bonus",
                amount: 500,
                label: `Bonus parrainage : ${authorData.penName || authorData.email}`
              },
              ...(referrerData.wallet?.history || [])
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

        // Sauvegarder les deux profils sur GitHub
        await updateFile(referrerPath, updatedReferrer, referrerRes.sha, `🎁 Bonus parrainage pour ${referrerEmail}`);
        await updateFile(authorPath, updatedAuthor, authorRes.sha, `✅ Parrainage validé pour ${authorEmail}`);

        return new Response(JSON.stringify({ success: true, message: "Récompense versée au parrain" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: false, message: "Aucun parrainage à traiter" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Referral Reward Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

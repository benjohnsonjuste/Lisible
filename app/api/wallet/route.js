// app/api/wallet/route.js
import { getFile, updateFile, getEmailId } from "@/lib/github";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, reason, targetEmail, type = "system" } = body;
    const val = parseInt(amount);

    if (!email || isNaN(val)) {
      return new Response(JSON.stringify({ error: "Données invalides" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userPath = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(userPath);
    if (!userRes) {
      return new Response(JSON.stringify({ error: "Utilisateur source introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let userData = userRes.content;

    // --- LOGIQUE DE TRANSFERT ENTRE UTILISATEURS ---
    if (targetEmail) {
      if (val < 1000) {
        return new Response(JSON.stringify({ error: "Minimum 1000 Li." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (userData.wallet.balance < val) {
        return new Response(JSON.stringify({ error: "Solde insuffisant." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const targetPath = `data/users/${getEmailId(targetEmail)}.json`;
      const targetRes = await getFile(targetPath);
      if (!targetRes) {
        return new Response(JSON.stringify({ error: "Destinataire introuvable." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      let targetData = targetRes.content;

      // Mise à jour de l'expéditeur
      userData.wallet.balance -= val;
      userData.wallet.history.unshift({
        id: `send-${Date.now()}`,
        date: new Date().toISOString(),
        amount: -val,
        reason: `Envoi à ${targetData.penName || targetEmail}`,
        type: "transfer_sent"
      });

      // Mise à jour du destinataire
      targetData.wallet.balance += val;
      targetData.wallet.history.unshift({
        id: `recv-${Date.now()}`,
        date: new Date().toISOString(),
        amount: val,
        reason: `Reçu de ${userData.penName || email}`,
        type: "transfer_received"
      });

      // Sauvegardes simultanées
      await updateFile(userPath, userData, userRes.sha, `💸 Transfert vers ${targetEmail}`);
      await updateFile(targetPath, targetData, targetRes.sha, `💰 Réception de ${email}`);

      return new Response(JSON.stringify({ success: true, newBalance: userData.wallet.balance }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- LOGIQUE DE CRÉDIT SIMPLE (Système ou Achat) ---
    userData.wallet.balance += val;
    userData.wallet.history.unshift({
      id: `wallet-${Date.now()}`,
      date: new Date().toISOString(),
      amount: val,
      reason: reason || "Mise à jour",
      type: type
    });

    await updateFile(userPath, userData, userRes.sha, `🪙 Mise à jour solde : ${email}`);
    
    return new Response(JSON.stringify({ success: true, newBalance: userData.wallet.balance }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Wallet Error:", error);
    return new Response(JSON.stringify({ error: "Erreur transactionnelle." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

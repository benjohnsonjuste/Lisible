// app/api/process-purchase/route.js
import { getFile, updateFile, getEmailId } from "@/lib/github";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amount, packId } = body;

    if (!email || !amount) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);
    
    if (!userRes) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let user = userRes.content;

    // Initialisation du wallet si inexistant
    if (!user.wallet) {
      user.wallet = { balance: 0, history: [] };
    }
    
    // Crédit du solde et enregistrement dans l'historique
    user.wallet.balance += Number(amount);
    user.wallet.history.unshift({ 
        id: `buy-${Date.now()}`, 
        date: new Date().toISOString(), 
        amount: Number(amount), 
        reason: `Achat Pack ${packId || 'Standard'}`, 
        type: "purchase" 
    });

    // Mise à jour du fichier sur GitHub
    await updateFile(path, user, userRes.sha, `💰 Purchase: +${amount} for ${email}`);

    return new Response(
      JSON.stringify({ success: true, balance: user.wallet.balance }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Purchase Processing Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

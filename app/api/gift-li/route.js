// app/api/gift-li/route.js
import { getFile, updateFile, getEmailId } from "@/lib/github";

export async function POST(req) {
  try {
    const body = await req.json();
    const { readerEmail, authorEmail, amount, textTitle } = body;
    const giftAmount = parseInt(amount);

    if (!readerEmail || !authorEmail || isNaN(giftAmount)) {
      return new Response(JSON.stringify({ error: "Données invalides" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Charger les deux profils en parallèle
    const [readerRes, authorRes] = await Promise.all([
      getFile(`data/users/${getEmailId(readerEmail)}.json`),
      getFile(`data/users/${getEmailId(authorEmail)}.json`)
    ]);

    if (!readerRes || !authorRes) {
      return new Response(JSON.stringify({ error: "Utilisateurs introuvables" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let reader = readerRes.content;
    let author = authorRes.content;

    // 2. Vérification du solde
    if (reader.wallet.balance < giftAmount) {
      return new Response(JSON.stringify({ error: "Solde insuffisant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Exécuter la transaction
    reader.wallet.balance -= giftAmount;
    reader.wallet.history.unshift({
      id: `gift-sent-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -giftAmount,
      reason: `Cadeau offert pour : ${textTitle}`,
      type: "gift_sent"
    });

    author.wallet.balance += giftAmount;
    author.wallet.history.unshift({
      id: `gift-received-${Date.now()}`,
      date: new Date().toISOString(),
      amount: giftAmount,
      reason: `Cadeau reçu de ${reader.penName || "Un lecteur"}`,
      type: "gift_received"
    });

    // 4. Sauvegarde simultanée sur GitHub
    await Promise.all([
      updateFile(`data/users/${getEmailId(readerEmail)}.json`, reader, readerRes.sha, `🎁 Don envoyé par ${readerEmail}`),
      updateFile(`data/users/${getEmailId(authorEmail)}.json`, author, authorRes.sha, `💰 Don reçu par ${authorEmail}`)
    ]);

    // 5. Déclencher la notification Pusher via la route interne
    const { origin } = new URL(req.url);
    fetch(`${origin}/api/create-notif`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "li_received",
        targetEmail: authorEmail,
        message: `🎁 ${reader.penName || "Un lecteur"} vous a offert ${giftAmount} Li !`,
        amountLi: giftAmount,
        link: "/dashboard"
      })
    }).catch(err => console.error("Notif failed:", err));

    return new Response(
      JSON.stringify({ success: true, newBalance: reader.wallet.balance }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (e) {
    console.error("Gift-Li Error:", e);
    return new Response(JSON.stringify({ error: "Erreur lors du transfert de cadeau" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

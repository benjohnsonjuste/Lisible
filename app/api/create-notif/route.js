// app/api/create-notif/route.js
import { Buffer } from "buffer";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: "1931362",
  key: "1da55287e2911ceb01dd",
  secret: "f07d3b5b15be62507850",
  cluster: "us2",
  useTLS: true,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, message, targetEmail, link, amountLi } = body;

    if (!targetEmail) {
      return new Response(JSON.stringify({ error: "L'email cible est requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = "benjohnsonjuste";
    const repo = "Lisible";

    // Normalisation du nom de fichier
    const emailClean = targetEmail.toLowerCase().trim();
    const userFileId = Buffer.from(emailClean).toString("base64").replace(/=/g, "");
    const path = `data/users/${userFileId}.json`;

    const newNotif = {
      id: `notif-${Date.now()}`,
      type: type || "info",
      message: message || "Nouvelle activité sur votre compte",
      link: link || "/account",
      amountLi: amountLi || 0,
      date: new Date().toISOString(),
      read: false
    };

    // 1. Déclenchement Pusher pour le temps réel
    const channel = `user-${userFileId}`;
    await pusher.trigger(channel, "new-alert", newNotif);

    // 2. Persistance dans GitHub
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      let user = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      
      if (!user.notifications) user.notifications = [];
      
      // Ajout en haut de liste
      user.notifications.unshift(newNotif);
      
      // Limitation à 30 notifications
      user.notifications = user.notifications.slice(0, 30); 

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          message: `🔔 Notification : ${message.substring(0, 30)}...`,
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: fileData.sha,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, notifId: newNotif.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erreur Notification:", error);
    return new Response(JSON.stringify({ error: "Échec de l'envoi de la notification" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

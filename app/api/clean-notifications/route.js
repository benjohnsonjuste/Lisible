// app/api/clean-notifications/route.js
import { Buffer } from "buffer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    
    // Normalisation de l'ID utilisateur
    const userFileId = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
    const path = `data/users/${userFileId}.json`;

    // 1. Récupération du profil sur GitHub
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!getRes.ok) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileData = await getRes.json();
    let user = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    if (!user.notifications || user.notifications.length === 0) {
      return new Response(JSON.stringify({ message: "Rien à nettoyer" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Filtrage : On ne garde que les notifications de moins de 30 jours
    const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;
    const maintenant = Date.now();

    const initialCount = user.notifications.length;
    user.notifications = user.notifications.filter(notif => {
      const dateNotif = new Date(notif.date).getTime();
      const estAncienne = (maintenant - dateNotif) > TRENTE_JOURS_MS;
      return !estAncienne; 
    });

    // 3. Mise à jour si nécessaire
    if (user.notifications.length !== initialCount) {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          message: "🧹 Nettoyage auto des notifications",
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: fileData.sha,
        }),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        supprimees: initialCount - user.notifications.length 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Cleanup Error:", error);
    return new Response(JSON.stringify({ error: "Erreur cleanup" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

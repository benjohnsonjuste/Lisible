// app/api/handle-subscription/route.js
import { Octokit } from "@octokit/rest";
import { Buffer } from "buffer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { subscriberEmail, subscriberName, targetEmail, type } = body;

    if (!targetEmail || !subscriberEmail) {
      return new Response(JSON.stringify({ error: "Emails manquants" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    // UNIFICATION : On utilise l'email en minuscules comme nom de fichier
    const fileName = `${targetEmail.toLowerCase().trim()}.json`;
    const path = `data/users/${fileName}`;

    // 1. Récupérer le profil de l'auteur cible sur GitHub
    let fileData;
    try {
      const { data } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path
      });
      fileData = data;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Profil auteur introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userProfile = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
    let subs = userProfile.subscribers || [];

    // 2. Modifier la liste des abonnés (évite les doublons)
    const cleanSubEmail = subscriberEmail.toLowerCase().trim();
    if (type === "subscribe") {
      if (!subs.includes(cleanSubEmail)) {
        subs.push(cleanSubEmail);
      }
    } else {
      subs = subs.filter(email => email !== cleanSubEmail);
    }

    // 3. Sauvegarde de la nouvelle liste sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `👥 ${type === 'subscribe' ? 'Nouvel abonné' : 'Désabonnement'} : ${subscriberName}`,
      content: Buffer.from(JSON.stringify({ ...userProfile, subscribers: subs }, null, 2)).toString("base64"),
      sha: fileData.sha
    });

    // 4. Notification Automatique
    if (type === "subscribe") {
      try {
        const { origin } = new URL(req.url);

        await fetch(`${origin}/api/create-notif`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "subscription",
            targetEmail: targetEmail,
            message: `${subscriberName} vient de s'abonner à vous !`,
            link: `/auteur/${encodeURIComponent(cleanSubEmail)}`
          }),
        });
      } catch (e) { 
        console.error("Échec de l'envoi de la notification Pusher:", e); 
      }
    }

    return new Response(JSON.stringify({ success: true, count: subs.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Subscription Error:", error);
    return new Response(JSON.stringify({ error: "Impossible de modifier l'abonnement sur GitHub" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

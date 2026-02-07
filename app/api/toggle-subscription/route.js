// app/api/toggle-subscription/route.js
import { Octokit } from "@octokit/rest";
import { Buffer } from "buffer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { followerEmail, targetEmail, subscriberEmail } = body;
    
    // Unification des variables
    const fEmail = (followerEmail || subscriberEmail)?.toLowerCase().trim();
    const tEmail = targetEmail?.toLowerCase().trim();

    if (!fEmail || !tEmail) {
      return new Response(JSON.stringify({ error: "Emails manquants." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN,
    });

    const owner = process.env.GITHUB_OWNER || "benjohnsonjuste";
    const repo = process.env.GITHUB_REPO || "Lisible";
    
    // Chemin vers le fichier de l'auteur cible
    // Note : Si vos fichiers sont en base64, utilisez getEmailId(tEmail) ici
    const path = `data/users/${tEmail}.json`;
    
    let contentData = {};
    let sha = undefined;

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      contentData = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
      sha = data.sha;
    } catch (err) {
      // Si l'utilisateur n'existe pas encore en fichier, on l'initialise
      contentData = {
        email: tEmail,
        subscribers: [],
        wallet: { balance: 0, history: [] }
      };
    }

    if (!Array.isArray(contentData.subscribers)) contentData.subscribers = [];

    // Logique de bascule (Toggle)
    const alreadyFollowing = contentData.subscribers.includes(fEmail);
    const updatedSubscribers = alreadyFollowing
      ? contentData.subscribers.filter(e => e !== fEmail)
      : [...contentData.subscribers, fEmail];

    contentData.subscribers = updatedSubscribers;

    // Mise à jour GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `👥 ${alreadyFollowing ? "Unfollow" : "Follow"} : ${fEmail} -> ${tEmail}`,
      content: Buffer.from(JSON.stringify(contentData, null, 2)).toString("base64"),
      sha,
    });

    // Notification Automatique si c'est un nouvel abonnement
    if (!alreadyFollowing) {
      try {
        const { origin } = new URL(req.url);
        await fetch(`${origin}/api/create-notif`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "subscription",
            targetEmail: tEmail,
            message: `${fEmail} vient de s'abonner à vous !`,
            link: `/auteur/${encodeURIComponent(fEmail)}`
          }),
        });
      } catch (e) { 
        console.error("Notif error:", e); 
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        isSubscribed: !alreadyFollowing,
        followersCount: updatedSubscribers.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Action impossible" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

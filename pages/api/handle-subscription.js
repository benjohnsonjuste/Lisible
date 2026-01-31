import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { subscriberEmail, subscriberName, targetEmail, type } = req.body;
  if (!targetEmail || !subscriberEmail) return res.status(400).json({ error: "Emails manquants" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  // UNIFICATION : On utilise l'email direct comme dans save-user-github.js
  const fileName = `${targetEmail.toLowerCase().trim()}.json`;
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupérer le profil de l'auteur cible
    const { data: fileData } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path
    });

    const userProfile = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
    let subs = userProfile.subscribers || [];

    // 2. Modifier la liste (vériﬁcation doublon)
    if (type === "subscribe") {
      if (!subs.includes(subscriberEmail.toLowerCase())) {
        subs.push(subscriberEmail.toLowerCase());
      }
    } else {
      subs = subs.filter(email => email !== subscriberEmail.toLowerCase());
    }

    // 3. Sauvegarde sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `👥 ${type === 'subscribe' ? 'Nouvel abonné' : 'Désabonnement'} : ${subscriberName}`,
      content: Buffer.from(JSON.stringify({ ...userProfile, subscribers: subs }, null, 2)).toString("base64"),
      sha: fileData.sha
    });

    // 4. Notification Automatique (Temps Réel)
    if (type === "subscribe") {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "new_follower",
            targetEmail: targetEmail,
            message: `${subscriberName} suit désormais vos œuvres !`,
            link: "/dashboard"
          }),
        });
      } catch (e) { console.error("Notif Error:", e); }
    }

    res.status(200).json({ success: true, count: subs.length });
  } catch (error) {
    console.error("Subscription Error:", error);
    res.status(500).json({ error: "Impossible de modifier l'abonnement" });
  }
}

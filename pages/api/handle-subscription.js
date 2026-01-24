import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { subscriberEmail, subscriberName, targetEmail, type } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const fileName = Buffer.from(targetEmail).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupérer le profil de l'auteur cible
    const { data } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path
    });

    const userProfile = JSON.parse(Buffer.from(data.content, "base64").toString());
    let subs = userProfile.subscribers || [];

    // 2. Modifier la liste des abonnés
    if (type === "subscribe") {
      if (!subs.includes(subscriberEmail)) subs.push(subscriberEmail);
    } else {
      subs = subs.filter(email => email !== subscriberEmail);
    }

    // 3. Mettre à jour GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `Abonnement: ${subscriberName} -> ${userProfile.name}`,
      content: Buffer.from(JSON.stringify({ ...userProfile, subscribers: subs }, null, 2)).toString("base64"),
      sha: data.sha
    });

    // 4. Envoyer une notification si c'est un nouvel abonné
    if (type === "subscribe") {
      await fetch(`${req.headers.origin}/api/push-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_follower",
          message: `${subscriberName} s'est abonné à votre profil !`,
          targetEmail: targetEmail,
          link: "/users"
        })
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

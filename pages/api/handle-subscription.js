import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { subscriberEmail, subscriberName, targetEmail, type } = req.body;
  if (!targetEmail || !subscriberEmail) return res.status(400).json({ error: "Emails manquants" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  // UNIFICATION : On utilise l'email en minuscules comme nom de fichier
  const fileName = `${targetEmail.toLowerCase().trim()}.json`;
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupérer le profil de l'auteur cible sur GitHub
    const { data: fileData } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path
    });

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

    // 4. Notification Automatique via le nouveau système create-notif
    if (type === "subscribe") {
      try {
        // On détermine l'URL de base dynamiquement
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const baseUrl = `${protocol}://${req.headers.host}`;

        await fetch(`${baseUrl}/api/create-notif`, {
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

    res.status(200).json({ success: true, count: subs.length });
  } catch (error) {
    console.error("Subscription Error:", error);
    res.status(500).json({ error: "Impossible de modifier l'abonnement sur GitHub" });
  }
}

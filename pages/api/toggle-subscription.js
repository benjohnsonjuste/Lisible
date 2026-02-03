import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { followerEmail, targetEmail, subscriberEmail } = req.body;
    
    // Unification des variables (compatible avec tous vos composants)
    const fEmail = (followerEmail || subscriberEmail)?.toLowerCase().trim();
    const tEmail = targetEmail?.toLowerCase().trim();

    if (!fEmail || !tEmail) {
      return res.status(400).json({ error: "Emails manquants." });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN,
    });

    // --- CORRECTION DU CHEMIN ---
    // On utilise l'email direct (plus simple et correspond à votre handle-subscription précédent)
    const path = `data/users/${tEmail}.json`;
    
    let contentData = {};
    let sha = undefined;

    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER || "benjohnsonjuste",
        repo: process.env.GITHUB_REPO || "Lisible",
        path,
      });

      contentData = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
      sha = data.sha;
    } catch (err) {
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
      owner: process.env.GITHUB_OWNER || "benjohnsonjuste",
      repo: process.env.GITHUB_REPO || "Lisible",
      path,
      message: `👥 ${alreadyFollowing ? "Unfollow" : "Follow"} : ${fEmail} -> ${tEmail}`,
      content: Buffer.from(JSON.stringify(contentData, null, 2)).toString("base64"),
      sha,
    });

    // 4. Notification Automatique (Pusher/Internal)
    if (!alreadyFollowing) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const baseUrl = `${protocol}://${req.headers.host}`;
        await fetch(`${baseUrl}/api/create-notif`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "subscription",
            targetEmail: tEmail,
            message: `${fEmail} vient de s'abonner à vous !`,
            link: `/auteur/${encodeURIComponent(fEmail)}`
          }),
        });
      } catch (e) { console.error("Notif error:", e); }
    }

    return res.status(200).json({
      success: true,
      isSubscribed: !alreadyFollowing,
      followersCount: updatedSubscribers.length,
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Action impossible" });
  }
}

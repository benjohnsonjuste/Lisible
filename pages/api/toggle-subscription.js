import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { follower, author } = req.body;

    // On s'assure d'avoir l'UID ou l'email pour identifier les parties
    if (!follower?.email || !author?.email) {
      return res.status(400).json({ error: "Données d'abonnement incomplètes (email requis)." });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    // On utilise l'email comme identifiant de fichier si l'UID n'est pas disponible
    const userIdentifier = author.uid || author.email.replace(/[.@]/g, '_');
    const path = `data/users/${userIdentifier}.json`;
    let contentData = {};
    let sha = undefined;

    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      });

      contentData = JSON.parse(
        Buffer.from(data.content, "base64").toString("utf-8")
      );
      sha = data.sha;
    } catch (err) {
      contentData = {
        uid: author.uid || userIdentifier,
        authorName: author.displayName || author.penName || author.email,
        authorEmail: author.email,
        subscribers: [],
      };
    }

    if (!Array.isArray(contentData.subscribers)) {
      contentData.subscribers = [];
    }

    // Vérification basée sur l'email pour plus de fiabilité
    const alreadyFollowing = contentData.subscribers.some(
      (sub) => sub.email.toLowerCase() === follower.email.toLowerCase()
    );

    let updatedSubscribers;
    if (alreadyFollowing) {
      updatedSubscribers = contentData.subscribers.filter(
        (sub) => sub.email.toLowerCase() !== follower.email.toLowerCase()
      );
    } else {
      updatedSubscribers = [
        ...contentData.subscribers,
        {
          uid: follower.uid || follower.email.replace(/[.@]/g, '_'),
          name: follower.displayName || follower.penName || follower.email,
          email: follower.email.toLowerCase(),
          date: new Date().toISOString(),
        },
      ];
    }

    contentData.subscribers = updatedSubscribers;

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `${alreadyFollowing ? "Unfollow" : "Follow"} : ${follower.email} -> ${author.email}`,
      content: Buffer.from(JSON.stringify(contentData, null, 2)).toString("base64"),
      sha,
    });

    return res.status(200).json({
      success: true,
      isFollowing: !alreadyFollowing,
      followersCount: updatedSubscribers.length,
    });
  } catch (error) {
    console.error("Erreur /api/toggle-subscription :", error);
    return res.status(500).json({
      error: "Impossible de modifier l'abonnement.",
      details: error.message,
    });
  }
}

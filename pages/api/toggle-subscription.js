import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { follower, author } = req.body;

    if (!follower?.uid || !author?.uid) {
      return res.status(400).json({ error: "Données d'abonnement invalides." });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/users/${author.uid}.json`;
    let contentData = {};
    let sha = undefined;

    // Vérifier si le fichier utilisateur existe déjà
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
        uid: author.uid,
        authorName: author.displayName || author.email || "Auteur inconnu",
        authorEmail: author.email || "",
        subscribers: [],
      };
    }

    // Initialiser la liste d'abonnés
    if (!Array.isArray(contentData.subscribers)) {
      contentData.subscribers = [];
    }

    const alreadyFollowing = contentData.subscribers.some(
      (sub) => sub.uid === follower.uid
    );

    let updatedSubscribers;
    if (alreadyFollowing) {
      // 🔹 Se désabonner
      updatedSubscribers = contentData.subscribers.filter(
        (sub) => sub.uid !== follower.uid
      );
    } else {
      // 🔹 S’abonner
      updatedSubscribers = [
        ...contentData.subscribers,
        {
          uid: follower.uid,
          name: follower.displayName || follower.email,
          email: follower.email,
          date: new Date().toISOString(),
        },
      ];
    }

    contentData.subscribers = updatedSubscribers;

    // Sauvegarde sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `${alreadyFollowing ? "Désabonnement" : "Nouvel abonné"} : ${
        follower.email
      }`,
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
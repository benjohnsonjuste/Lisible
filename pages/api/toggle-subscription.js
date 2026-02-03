import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    // Adaptation automatique aux noms de variables envoyés par le frontend
    const { followerEmail, targetEmail, follower, author } = req.body;

    // On récupère les emails peu importe le format envoyé
    const fEmail = followerEmail || follower?.email;
    const tEmail = targetEmail || author?.email;

    if (!fEmail || !tEmail) {
      return res.status(400).json({ error: "Emails de l'abonné et de la cible requis." });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    // Identification du fichier de l'auteur cible
    const userIdentifier = tEmail.replace(/[.@]/g, '_');
    const path = `data/users/${userIdentifier}.json`;
    
    let contentData = {};
    let sha = undefined;

    // 1. Récupération des données de l'auteur
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
      // Si l'utilisateur n'existe pas encore en JSON, on l'initialise
      contentData = {
        email: tEmail.toLowerCase(),
        subscribers: [],
        wallet: { balance: 0, history: [] }
      };
    }

    // Sécurité : s'assurer que subscribers est un tableau
    if (!Array.isArray(contentData.subscribers)) {
      contentData.subscribers = [];
    }

    // 2. Logique Toggle (Abonner/Désabonner)
    // On vérifie si l'email est déjà présent (stocké soit en string soit en objet)
    const alreadyFollowing = contentData.subscribers.some(sub => {
      const subEmail = typeof sub === 'string' ? sub : sub.email;
      return subEmail?.toLowerCase() === fEmail.toLowerCase();
    });

    let updatedSubscribers;
    if (alreadyFollowing) {
      // Désabonnement
      updatedSubscribers = contentData.subscribers.filter(sub => {
        const subEmail = typeof sub === 'string' ? sub : sub.email;
        return subEmail?.toLowerCase() !== fEmail.toLowerCase();
      });
    } else {
      // Abonnement : On stocke l'email (format simple pour la cohérence des listes)
      updatedSubscribers = [...contentData.subscribers, fEmail.toLowerCase()];
    }

    contentData.subscribers = updatedSubscribers;

    // 3. Mise à jour sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `🔄 Action Sociale : ${fEmail} ${alreadyFollowing ? "unfollowed" : "followed"} ${tEmail}`,
      content: Buffer.from(JSON.stringify(contentData, null, 2)).toString("base64"),
      sha,
    });

    return res.status(200).json({
      success: true,
      isSubscribed: !alreadyFollowing, // Retourne l'état final pour le toast
      followersCount: updatedSubscribers.length,
    });

  } catch (error) {
    console.error("Erreur API Subscription:", error);
    return res.status(500).json({
      error: "Erreur serveur lors de l'abonnement.",
      details: error.message,
    });
  }
}

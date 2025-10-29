// pages/api/payment.js
import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Token GitHub avec accès au repo
const REPO_OWNER = process.env.GITHUB_OWNER; // Nom du propriétaire du repo
const REPO_NAME = process.env.GITHUB_REPO; // Nom du repo
const BRANCH = "main"; // Branche principale

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { uid, paymentMethod, paypalEmail, wuMoneyGram } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "Utilisateur non identifié" });
    }

    const path = `users/${uid}.json`;
    const contentObj = {
      paymentMethod,
      paypalEmail,
      wuMoneyGram,
      updatedAt: new Date().toISOString(),
    };

    // Vérifier si le fichier existe déjà pour récupérer le SHA
    let sha;
    try {
      const existingFile = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
        ref: BRANCH,
      });
      sha = existingFile.data.sha;
    } catch (err) {
      // Si le fichier n'existe pas, sha reste undefined pour créer un nouveau fichier
    }

    // Convertir en Base64
    const content = Buffer.from(JSON.stringify(contentObj, null, 2)).toString(
      "base64"
    );

    // Créer ou mettre à jour le fichier sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      message: sha
        ? `Mise à jour infos paiement de l'utilisateur ${uid}`
        : `Création infos paiement de l'utilisateur ${uid}`,
      content,
      sha,
      branch: BRANCH,
    });

    return res.status(200).json({ success: true, message: "Infos paiement sauvegardées sur GitHub !" });
  } catch (err) {
    console.error("Erreur API GitHub:", err);
    return res.status(500).json({ error: "Impossible de sauvegarder les informations sur GitHub" });
  }
}
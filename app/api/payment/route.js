// app/api/payment/route.js
import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_OWNER;
const REPO_NAME = process.env.GITHUB_REPO;
const BRANCH = "main";

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { uid, paymentMethod, paypalEmail, wuMoneyGram } = body;

    if (!uid) {
      return new Response(JSON.stringify({ error: "Utilisateur non identifié" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const path = `users/${uid}.json`;
    const contentObj = {
      paymentMethod,
      paypalEmail,
      wuMoneyGram,
      updatedAt: new Date().toISOString(),
    };

    // 1. Vérifier si le fichier existe déjà pour récupérer le SHA
    let sha;
    try {
      const existingFile = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
        ref: BRANCH,
      });
      sha = existingFile.data.sha;
      
      // Optionnel : On peut fusionner avec les données existantes si nécessaire
      // ici on remplace comme dans ton code original.
    } catch (err) {
      // Si le fichier n'existe pas, sha reste undefined
    }

    // 2. Préparation du contenu en Base64
    const content = Buffer.from(JSON.stringify(contentObj, null, 2)).toString(
      "base64"
    );

    // 3. Créer ou mettre à jour le fichier sur GitHub
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

    return new Response(
      JSON.stringify({ success: true, message: "Infos paiement sauvegardées sur GitHub !" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("Erreur API GitHub:", err);
    return new Response(
      JSON.stringify({ error: "Impossible de sauvegarder les informations sur GitHub" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// pages/api/author/[userId]/metrics.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  if (!userId) {
    return res.status(400).json({ error: "userId requis" });
  }

  try {
    // Supposons que tu as un fichier JSON pour chaque utilisateur dans data/users/{uid}.json
    const path = `data/users/${userId}.json`;

    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
      ref: BRANCH,
    });

    // Le contenu est en base64
    const content = Buffer.from(data.content, "base64").toString("utf‑8");
    const userData = JSON.parse(content);

    // Récupérer les métriques à partir de l’objet userData
    const subscribers = Array.isArray(userData.subscribers)
      ? userData.subscribers.length
      : userData.subscribers || 0;

    const textsPublished = Array.isArray(userData.textsPublishedList)
      ? userData.textsPublishedList.length
      : userData.textsPublished || 0;

    // Pour les vues totales, supposons qu’on stocke userData.totalViews ou on doit sommer tous les textes
    let totalViews = 0;
    if (typeof userData.totalViews === "number") {
      totalViews = userData.totalViews;
    } else if (Array.isArray(userData.textsPublishedList)) {
      totalViews = userData.textsPublishedList
        .reduce((sum, t) => sum + (t.views || 0), 0);
    }

    return res.status(200).json({
      subscribers,
      totalViews,
      textsPublished,
    });
  } catch (err) {
    console.error("Erreur fetching metrics:", err);
    return res.status(500).json({ error: "Impossible de récupérer les métriques" });
  }
      }

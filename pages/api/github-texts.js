// pages/api/github-texts.js
import { NextApiRequest, NextApiResponse } from "next";

const GITHUB_REPO = process.env.GITHUB_REPO; // ex: "username/repo"
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  try {
    const indexPath = "data/texts/index.json";

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${indexPath}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API error: ${text}`);
    }

    const indexData = await response.json();

    // indexData doit être un tableau d'objets texte
    res.status(200).json({ data: indexData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les textes depuis GitHub" });
  }
}

// pages/api/get-user.js
import { getUserFromGithub, getTextsFromGithub } from "@/lib/githubClient";

export default async function handler(req, res) {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "UID manquant" });

  try {
    const user = await getUserFromGithub(uid);
    const texts = await getTextsFromGithub(uid);
    res.status(200).json({ user, texts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les données utilisateur" });
  }
}
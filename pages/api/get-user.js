import { getUserFromGithub } from "@/lib/githubClient";

export default async function handler(req, res) {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "UID manquant" });

  try {
    const user = await getUserFromGithub(uid);
    if (!user) return res.status(404).json({ error: "Auteur introuvable" });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer l'auteur" });
  }
}
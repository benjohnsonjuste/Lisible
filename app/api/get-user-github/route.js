import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email manquant" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
    });

    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const userData = JSON.parse(content);

    // Sécurité : Ne jamais renvoyer le mot de passe
    const { password, ...safeUser } = userData;
    return res.status(200).json(safeUser);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: "Utilisateur non trouvé" });
    return res.status(500).json({ error: "Erreur serveur GitHub" });
  }
}

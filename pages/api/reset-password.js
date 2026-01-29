import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { email } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const fileName = Buffer.from(email.toLowerCase()).toString('base64').replace(/=/g, "") + ".json";

  try {
    const { data } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: `data/users/${fileName}`,
    });

    const user = JSON.parse(Buffer.from(data.content, "base64").toString());
    
    // Ici, on retourne le mot de passe (simulé)
    return res.status(200).json({ password: user.password });
  } catch (error) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }
}

import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "L'adresse email est requise" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  const emailClean = email.toLowerCase().trim();
  const fileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    // On ne renvoie plus d'indice car le mot de passe est crypté/haché
    
    return res.status(200).json({ 
      success: true, 
      message: "Compte vérifié. Contactez le support pour réinitialiser si vous avez perdu votre accès."
    });

  } catch (error) {
    return res.status(404).json({ error: "Aucun compte associé à cet email" });
  }
}

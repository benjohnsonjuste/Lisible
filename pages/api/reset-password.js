import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "L'adresse email est requise" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  const emailClean = email.toLowerCase().trim();
  const fileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupération des données utilisateur
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    const user = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    
    // 2. Génération de l'indice de sécurité
    const pass = user.password;
    const hint = pass.substring(0, 2) + "*".repeat(Math.max(0, pass.length - 2));
    
    // 3. Création d'une notification d'alerte de sécurité
    // On appelle ton API interne create-notif (ou on simule l'insertion)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/create-notif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "securite",
          targetEmail: emailClean,
          message: `⚠️ Une demande d'indice de mot de passe a été effectuée. Si ce n'est pas vous, changez votre secret immédiatement.`,
          link: "/account"
        })
      });
    } catch (e) {
      console.error("Échec de l'envoi de la notification de sécurité");
      // On ne bloque pas le processus si la notification échoue
    }

    return res.status(200).json({ 
      success: true, 
      hint: hint,
      message: "Indice récupéré. Une alerte de sécurité a été envoyée sur votre compte."
    });

  } catch (error) {
    return res.status(404).json({ error: "Aucun compte associé à cet email" });
  }
}

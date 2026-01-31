import { Buffer } from "buffer";

export default async function handler(req, res) {
  // On n'autorise que le PATCH pour la mise à jour partielle
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { email, userData } = req.body;

  if (!email || !userData) {
    return res.status(400).json({ message: "Données manquantes" });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = `data/users/${email.toLowerCase().trim()}.json`;

  try {
    // 1. Récupérer le fichier actuel pour obtenir le SHA (obligatoire pour GitHub)
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      },
      cache: 'no-store'
    });

    if (!getRes.ok) {
      return res.status(404).json({ message: "Utilisateur non trouvé sur le registre" });
    }

    const fileData = await getRes.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // 2. Fusionner les anciennes données avec les nouvelles
    // On garde précieusement le wallet et les emails, on ne change que le profil
    const updatedContent = {
      ...currentContent,
      ...userData,
      wallet: currentContent.wallet, // Sécurité : on ne laisse pas l'utilisateur modifier son solde ici
      email: currentContent.email,   // Sécurité : l'email reste l'identifiant unique
      updatedAt: new Date().toISOString()
    };

    // 3. Renvoyer le fichier mis à jour vers GitHub
    const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `👤 Mise à jour profil : ${email}`,
        content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString("base64"),
        sha: fileData.sha
      })
    });

    if (updateRes.ok) {
      return res.status(200).json({ 
        success: true, 
        user: updatedContent 
      });
    } else {
      const errorData = await updateRes.json();
      throw new Error(errorData.message || "Erreur GitHub");
    }

  } catch (error) {
    console.error("API Update Error:", error);
    return res.status(500).json({ message: error.message });
  }
}

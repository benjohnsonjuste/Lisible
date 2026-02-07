// app/api/update-password/route.js
import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import { Buffer } from "buffer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: "Tous les champs sont requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    
    // Génération de l'ID de fichier Base64
    const fileName = Buffer.from(email.toLowerCase().trim()).toString('base64').replace(/=/g, "") + ".json";
    const path = `data/users/${fileName}`;

    // 1. Récupération du profil actuel
    let fileData;
    try {
      const response = await octokit.repos.getContent({ owner, repo, path });
      fileData = response.data;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userContent = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // 2. VÉRIFICATION SÉCURISÉE (Hash)
    const currentInputHash = crypto.createHash("sha256").update(currentPassword).digest("hex");
    
    // On accepte le hash OU l'ancien mot de passe (si pas encore migré)
    if (userContent.password !== currentInputHash && userContent.password !== currentPassword) {
      return new Response(JSON.stringify({ error: "L'ancien mot de passe est incorrect" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. GÉNÉRATION DU NOUVEAU HASH
    const newHashedPassword = crypto.createHash("sha256").update(newPassword).digest("hex");

    const updatedUser = {
      ...userContent,
      password: newHashedPassword, 
      updatedAt: new Date().toISOString()
    };

    // 4. SAUVEGARDE SUR GITHUB
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `🔐 Sécurité : Mise à jour mot de passe haché [${email}]`,
      content: Buffer.from(JSON.stringify(updatedUser, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Mot de passe sécurisé et modifié !" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Update Password Error:", error);
    return new Response(JSON.stringify({ error: "Serveur indisponible" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

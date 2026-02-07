// app/api/reset-password/route.js
import { Octokit } from "@octokit/rest";
import { Buffer } from "buffer";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, newPassword, adminToken } = body;

    // Sécurité : On peut ajouter un token admin si on veut restreindre l'usage
    // ou simplement vérifier l'email et le nouveau password
    if (!email || !newPassword) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    
    const emailClean = email.toLowerCase().trim();
    const fileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
    const path = `data/users/${fileName}`;

    // 1. Récupérer l'utilisateur actuel
    let fileData;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      fileData = data;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // 2. Hacher le nouveau mot de passe
    const hashedPassword = crypto.createHash("sha256").update(newPassword).digest("hex");

    // 3. Mettre à jour l'objet utilisateur
    user.password = hashedPassword;
    user.updatedAt = new Date().toISOString();

    // 4. Sauvegarder sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `🔐 Réinitialisation du mot de passe pour ${emailClean}`,
      content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Mot de passe mis à jour avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Reset Password Error:", error);
    return new Response(JSON.stringify({ error: "Erreur lors de la réinitialisation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

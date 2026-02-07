import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

// Route: DELETE /api/user/delete (ou le nom de ton fichier)
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    const emailClean = email.toLowerCase().trim();
    
    // Nom du fichier utilisateur (Email en Base64 pour le stockage)
    const userFileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
    const userPath = `data/users/${userFileName}`;

    // 1. SUPPRESSION DU PROFIL UTILISATEUR
    let userData;
    try {
      const response = await octokit.repos.getContent({ owner, repo, path: userPath });
      userData = response.data;
    } catch (e) {
      if (e.status === 404) {
        return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
      }
      throw e;
    }

    await octokit.repos.deleteFile({
      owner, 
      repo, 
      path: userPath,
      message: `🗑️ Profil supprimé : ${emailClean}`,
      sha: userData.sha,
    });

    // 2. NETTOYAGE AUTOMATIQUE DES TEXTES
    try {
      // On cherche dans publications ou posts selon ta structure actuelle
      const { data: posts } = await octokit.repos.getContent({ owner, repo, path: "data/publications" });
      
      if (Array.isArray(posts)) {
        const deletePromises = posts.map(async (file) => {
          // On ignore l'index.json s'il existe
          if (file.name === "index.json") return;

          const { data: fileContent } = await octokit.repos.getContent({ owner, repo, path: file.path });
          const content = JSON.parse(Buffer.from(fileContent.content, 'base64').toString());
          
          if (content.authorEmail?.toLowerCase() === emailClean) {
            return octokit.repos.deleteFile({
              owner, 
              repo, 
              path: file.path,
              message: `🗑️ Texte orphelin supprimé : ${file.name}`,
              sha: fileContent.sha
            });
          }
        });

        await Promise.all(deletePromises);
      }
    } catch (err) {
      console.error("Erreur lors du nettoyage des textes:", err);
      // On ne bloque pas la réponse globale si seuls les textes échouent
    }

    return NextResponse.json({ 
      success: true, 
      message: "Compte et écrits associés effacés du sanctuaire" 
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur suppression globale:", error);
    return NextResponse.json({ error: "Le protocole de suppression a échoué" }, { status: 500 });
  }
}

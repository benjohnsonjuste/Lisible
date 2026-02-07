import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

/**
 * PROTOCOLE DE SUPPRESSION GLOBALE
 * Supprime le profil utilisateur et tous les écrits associés sur GitHub.
 */
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis pour l'effacement." }, { status: 400 });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    const emailClean = email.toLowerCase().trim();
    
    // Encodage Base64 pour correspondre à ta structure de stockage
    const userFileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
    const userPath = `data/users/${userFileName}`;

    // 1. PHASE DE SUPPRESSION DU PROFIL
    let userData;
    try {
      const response = await octokit.repos.getContent({ owner, repo, path: userPath });
      userData = response.data;
    } catch (e) {
      if (e.status === 404) {
        return NextResponse.json({ error: "Profil introuvable dans le sanctuaire." }, { status: 404 });
      }
      throw e;
    }

    await octokit.repos.deleteFile({
      owner, 
      repo, 
      path: userPath,
      message: `🗑️ Profil supprimé définitivement : ${emailClean}`,
      sha: userData.sha,
    });

    // 2. PHASE DE NETTOYAGE DES ÉCRITS (PUBLICAIONS)
    try {
      const { data: posts } = await octokit.repos.getContent({ owner, repo, path: "data/publications" });
      
      if (Array.isArray(posts)) {
        const deletePromises = posts.map(async (file) => {
          // Sécurité : ne pas supprimer le fichier d'indexation
          if (file.name === "index.json") return;

          const { data: fileContent } = await octokit.repos.getContent({ owner, repo, path: file.path });
          const content = JSON.parse(Buffer.from(fileContent.content, 'base64').toString());
          
          if (content.authorEmail?.toLowerCase() === emailClean) {
            return octokit.repos.deleteFile({
              owner, 
              repo, 
              path: file.path,
              message: `🗑️ Nettoyage post-suppression : ${file.name}`,
              sha: fileContent.sha
            });
          }
        });

        await Promise.all(deletePromises);
      }
    } catch (err) {
      console.error("Échec partiel (nettoyage textes):", err);
      // On continue car le compte principal est déjà supprimé
    }

    return NextResponse.json({ 
      success: true, 
      message: "Toutes vos traces ont été effacées avec succès." 
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur fatale lors de la suppression globale:", error);
    return NextResponse.json({ error: "Le protocole de suppression a rencontré une erreur serveur." }, { status: 500 });
  }
}

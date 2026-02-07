// app/api/works/[id]/route.js
import { NextResponse } from "next/server";

/**
 * SUPPRESSION D'UNE ŒUVRE
 * Route: DELETE /api/works/[id]
 */
export async function DELETE(req, { params }) {
  // Récupération sécurisée de l'ID depuis l'URL dynamique
  const { id } = params; 

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  // Préparation du chemin vers GitHub (data/publications/ ou data/posts/)
  // Assure-toi que le dossier correspond bien à ta structure GitHub actuelle
  const fileName = id.endsWith(".json") ? id : `${id}.json`;
  const repoPath = `data/publications/${fileName}`; 

  try {
    // 1. Récupérer le SHA du fichier sur GitHub (obligatoire pour supprimer)
    const getFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Cache-Control": "no-cache", // Évite de récupérer un SHA expiré en cache
        },
      }
    );

    if (!getFileRes.ok) {
      return NextResponse.json(
        { error: "L'œuvre n'existe plus ou est introuvable sur le serveur." }, 
        { status: 404 }
      );
    }

    const fileData = await getFileRes.json();
    const sha = fileData.sha;

    // 2. Requête de suppression définitive sur GitHub
    const deleteRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Suppression définitive de l'œuvre : ${id}`,
          sha: sha,
        }),
      }
    );

    if (deleteRes.ok) {
      return NextResponse.json(
        { message: "L'œuvre a été retirée du sanctuaire avec succès." }, 
        { status: 200 }
      );
    } else {
      const errorData = await deleteRes.json();
      return NextResponse.json(
        { error: errorData.message || "Échec de la suppression sur GitHub." }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur fatale lors de la suppression:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la communication avec GitHub." }, 
      { status: 500 }
    );
  }
}

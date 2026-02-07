import { NextResponse } from "next/server";

// On exporte uniquement la méthode DELETE
export async function DELETE(req, { params }) {
  const { id } = params; 

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const fileName = id.endsWith(".json") ? id : `${id}.json`;
  const repoPath = `data/publications/${fileName}`; 

  try {
    // 1. Récupérer le SHA
    const getFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!getFileRes.ok) {
      return NextResponse.json({ error: "Œuvre introuvable" }, { status: 404 });
    }

    const fileData = await getFileRes.json();
    const sha = fileData.sha;

    // 2. Suppression GitHub
    const deleteRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Suppression : ${id}`,
          sha: sha,
        }),
      }
    );

    if (deleteRes.ok) {
      return NextResponse.json({ message: "Succès" }, { status: 200 });
    } else {
      const errorData = await deleteRes.json();
      return NextResponse.json({ error: errorData.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

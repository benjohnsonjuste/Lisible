import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 1. Récupérer tout l'index via GitHub
    const githubRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/index.json`, {
      headers: { 
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      },
      cache: 'no-store'
    });

    if (!githubRes.ok) {
      return NextResponse.json({ error: "Impossible de lire l'index" }, { status: 500 });
    }

    const fileData = await githubRes.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const allTexts = JSON.parse(content);

    // 2. Logique de Pagination
    const limit = parseInt(searchParams.get("limit")) || 10;
    const cursor = searchParams.get("cursor"); // ID du dernier texte chargé
    
    let startIndex = 0;
    if (cursor) {
      startIndex = allTexts.findIndex(t => t.id === cursor) + 1;
      // Si le curseur n'est pas trouvé, on repart du début
      if (startIndex === 0) startIndex = 0;
    }

    const paginatedTexts = allTexts.slice(startIndex, startIndex + limit);
    const nextCursor = paginatedTexts.length === limit ? paginatedTexts[paginatedTexts.length - 1].id : null;

    return NextResponse.json({
      data: paginatedTexts,
      nextCursor,
      total: allTexts.length
    }, { status: 200 });

  } catch (e) {
    console.error("Pagination error:", e);
    return NextResponse.json({ error: "Erreur de chargement" }, { status: 500 });
  }
}

// Pour tes futures méthodes (Like, Comment), tu ajouteras :
// export async function PATCH(req) { ... }

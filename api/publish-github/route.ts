// api/publish-github.ts
import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // Vérification du token Firebase
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const { title, content, imageBase64, imageName, authorName, authorEmail } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
    }

    // Préparer le contenu pour GitHub (Markdown + image si existante)
    let markdown = `# ${title}\n\n${content}\n\n_Auteur : ${authorName}`;
    if (authorEmail) markdown += ` <${authorEmail}>`;

    const filePath = `posts/${Date.now()}-${title.replace(/\s+/g, "_")}.md`;

    // Ajouter image si fournie
    if (imageBase64 && imageName) {
      const imagePath = `posts/images/${Date.now()}-${imageName}`;
      await githubUploadFile(imagePath, imageBase64);
      markdown += `\n\n![${imageName}](./images/${Date.now()}-${imageName})`;
    }

    // Publier le texte sur GitHub
    await githubUploadFile(filePath, Buffer.from(markdown).toString("base64"));

    const fileUrl = `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/blob/main/${filePath}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error("Erreur /api/publish-github:", err);
    return NextResponse.json({ error: "Erreur serveur ou token invalide" }, { status: 500 });
  }
}

// Fonction utilitaire pour uploader sur GitHub via API REST
async function githubUploadFile(path: string, contentBase64: string) {
  const repoOwner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;
  const token = process.env.GITHUB_TOKEN;

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Publication automatique: ${path}`,
      content: contentBase64,
      branch: "main",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub upload error: ${text}`);
  }
}
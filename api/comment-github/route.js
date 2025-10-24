import { NextResponse } from "next/server";

const GITHUB_REPO = "benjohnsonjuste/Lisible";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function POST(req) {
  try {
    const { textId, userId, userName, comment } = await req.json();
    const filePath = `data/comments/${textId}.json`;

    // Récupérer ou créer le fichier de commentaires
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    let comments = [];
    let sha = null;

    if (res.ok) {
      const json = await res.json();
      sha = json.sha;
      const content = Buffer.from(json.content, "base64").toString();
      comments = JSON.parse(content);
    }

    const newComment = {
      id: Date.now().toString(),
      textId,
      userId,
      userName,
      comment,
      date: new Date().toISOString(),
    };

    comments.push(newComment);

    const updatedContent = Buffer.from(JSON.stringify(comments, null, 2)).toString("base64");

    // Écriture GitHub
    const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `💬 Nouveau commentaire sur ${textId}`,
        content: updatedContent,
        sha,
      }),
    });

    if (!updateRes.ok) throw new Error("Erreur mise à jour GitHub");

    return NextResponse.json({ ok: true, comment: newComment });
  } catch (err) {
    console.error("comment error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

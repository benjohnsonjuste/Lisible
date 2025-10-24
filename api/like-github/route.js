import { NextResponse } from "next/server";

const GITHUB_REPO = "benjohnsonjuste/Lisible"; // ton repo
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // dans ton .env

export async function POST(req) {
  try {
    const { textId, userId } = await req.json();
    const filePath = `data/texts/${textId}.json`;

    // Récupérer le texte actuel
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    if (!res.ok) throw new Error("Fichier non trouvé");

    const json = await res.json();
    const content = Buffer.from(json.content, "base64").toString();
    const textData = JSON.parse(content);

    // Initialiser le compteur et la liste des likes
    if (!textData.likes) textData.likes = [];
    if (!textData.likes.includes(userId)) {
      textData.likes.push(userId);
    } else {
      // Si déjà liké → on retire (toggle)
      textData.likes = textData.likes.filter((id) => id !== userId);
    }

    // Mise à jour du fichier GitHub
    const updatedContent = Buffer.from(JSON.stringify(textData, null, 2)).toString("base64");
    const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `🔁 Update likes for ${textId}`,
        content: updatedContent,
        sha: json.sha,
      }),
    });

    if (!updateRes.ok) throw new Error("Erreur mise à jour GitHub");

    return NextResponse.json({ ok: true, likes: textData.likes.length });
  } catch (err) {
    console.error("like error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
      }

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, content, authorName, authorEmail, imageBase64, imageName } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    const branch = "main";

    if (!token) throw new Error("GITHUB_TOKEN manquant");

    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const textPath = `data/texts/${timestamp}-${slug}.json`;

    const textData = {
      id: timestamp.toString(),
      title,
      content,
      authorName,
      authorEmail,
      createdAt: new Date().toISOString(),
      image: imageName ? `images/${timestamp}-${imageName}` : null,
      views: 0,
      likes: 0,
      comments: [],
    };

    // 1. Commit du texte
    const textResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `📚 Nouveau texte : ${title}`,
        content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
        branch,
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.json();
      throw new Error(`GitHub Text Error: ${errorData.message}`);
    }

    // 2. Commit de l’image
    if (imageBase64 && imageName) {
      const imagePath = `public/images/${timestamp}-${imageName}`;
      const base64Data = imageBase64.split(",")[1];
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${imagePath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          message: `🖼 Image pour : ${title}`,
          content: base64Data,
          branch,
        }),
      });
    }

    // ⚡ AUTOMATISME : Revalidation ISR (App Router Style)
    try {
      revalidatePath('/bibliotheque');
      revalidatePath('/communaute'); 
    } catch (err) {
      console.warn("ISR Revalidation failed:", err);
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error("GitHub commit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

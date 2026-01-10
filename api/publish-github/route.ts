import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, authorName, authorEmail, imageBase64, imageName } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
    }

    // Nom de fichier texte
    const date = new Date().toISOString().split("T")[0];
    const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    let mdContent = `# ${title}\n\n${content}\n\n---\nAuteur: ${authorName}${
      authorEmail ? ` <${authorEmail}>` : ""
    }`;

    // Publier texte sur GitHub
    const textFileName = `${date}_${safeTitle}.md`;
    const resText = await fetch(
      `${GITHUB_API}/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${textFileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Ajout du texte: ${title}`,
          content: Buffer.from(mdContent).toString("base64"),
        }),
      }
    );

    if (!resText.ok) {
      const err = await resText.text();
      throw new Error("Erreur GitHub texte: " + err);
    }

    const textData = await resText.json();
    let imageUrl = null;

    // Publier image si présente
    if (imageBase64 && imageName) {
      const resImage = await fetch(
        `${GITHUB_API}/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/images/${imageName}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Ajout image: ${imageName}`,
            content: imageBase64.split(",")[1], // retirer le prefix data:image/...
          }),
        }
      );

      if (!resImage.ok) {
        const err = await resImage.text();
        throw new Error("Erreur GitHub image: " + err);
      }

      const imageData = await resImage.json();
      imageUrl = imageData.content.download_url;

      // Ajouter image dans le Markdown
      mdContent += `\n\n![${imageName}](${imageUrl})`;

      // Mettre à jour le fichier texte avec image insérée
      await fetch(
        `${GITHUB_API}/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${textFileName}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Ajout image dans ${textFileName}`,
            content: Buffer.from(mdContent).toString("base64"),
            sha: textData.content.sha,
          }),
        }
      );
    }

    return NextResponse.json({
      url: textData.content.html_url,
      imageUrl,
    });
  } catch (err: any) {
    console.error("publish-github error", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
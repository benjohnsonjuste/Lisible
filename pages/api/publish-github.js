import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      title,
      content,
      authorName,
      authorEmail,
      imageBase64,
      imageName
    } = req.body;

    if (!title?.trim() || !content?.trim() || !authorName?.trim()) {
      return res.status(400).json({ error: "Titre, contenu et auteur requis" });
    }

    // Vérification token GitHub
    const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    const OWNER = process.env.GITHUB_OWNER;
    const REPO = process.env.GITHUB_REPO;

    if (!TOKEN || !OWNER || !REPO) {
      return res.status(500).json({
        error: "Variables GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_OWNER ou GITHUB_REPO manquantes"
      });
    }

    const octokit = new Octokit({ auth: TOKEN });

    // ID unique
    const id = Date.now().toString();

    // 1️⃣ Upload image si présente
    let imagePath = null;
    if (imageBase64 && imageName) {
      const base64Data = imageBase64.split(",")[1]; // enlever le header data:image/...

      imagePath = `data/images/${id}-${imageName}`;

      await octokit.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: imagePath,
        message: `Upload image for text ${id}`,
        content: base64Data
      });
    }

    // 2️⃣ créer le fichier texte dans GitHub
    const textPath = `data/texts/${id}.json`;

    const body = {
      id,
      title,
      content,
      authorName,
      authorEmail,
      image: imagePath || null,
      createdAt: new Date().toISOString()
    };

    const contentBase64 = Buffer.from(JSON.stringify(body, null, 2)).toString("base64");

    const createRes = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: textPath,
      message: `Publish text ${id}`,
      content: contentBase64
    });

    const githubUrl = createRes.data?.content?.html_url;

    return res.status(200).json({
      ok: true,
      id,
      url: githubUrl || null
    });

  } catch (err) {
    console.error("publish error", err);
    return res.status(500).json({ error: err.message });
  }
}
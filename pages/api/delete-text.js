import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

const OWNER = "benjohnsonjuste";
const REPO = "Lisible";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "Méthode non autorisée" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID manquant" });

  try {
    // 1️⃣ Charger index.json
    const indexPath = "public/data/texts/index.json";
    const indexData = await getFileContent({
      owner: OWNER,
      repo: REPO,
      path: indexPath,
      branch: BRANCH,
      token: TOKEN,
    });
    const index = JSON.parse(
      Buffer.from(indexData.content, "base64").toString("utf-8")
    );

    // 2️⃣ Retirer le texte de l’index
    const newIndex = index.filter((t) => String(t.id) !== String(id));

    // 3️⃣ Sauvegarder le nouvel index
    await createOrUpdateFile({
      path: indexPath,
      content: JSON.stringify(newIndex, null, 2),
      message: `🗑️ Suppression texte ${id}`,
    });

    // 4️⃣ Supprimer aussi le fichier individuel s’il existe
    const textFilePath = `public/data/texts/${id}.json`;
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${textFilePath}`, {
      method: "DELETE",
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `🗑️ Suppression du texte ${id}`,
        sha: indexData.sha, // tu peux aussi obtenir le SHA du fichier individuel
        branch: BRANCH,
      }),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur suppression texte:", err);
    res.status(500).json({ error: "Erreur suppression texte" });
  }
}
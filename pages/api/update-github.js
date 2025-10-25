import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  const { id, field, value } = req.body;
  const owner = "ton-nom-utilisateur";
  const repo = "Lisible";
  const token = process.env.GITHUB_TOKEN;
  const path = "texts/index.json";

  try {
    const file = await getFileContent({ owner, repo, path, token });
    const texts = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));

    const index = texts.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: "Texte introuvable" });

    if (field === "comments") {
      texts[index].comments.push(value);
    } else {
      texts[index][field] = (texts[index][field] || 0) + 1;
    }

    await createOrUpdateFile({
      owner,
      repo,
      path,
      content: JSON.stringify(texts, null, 2),
      commitMessage: `🔁 Mise à jour ${field} pour ${id}`,
      token,
    });

    res.status(200).json({ success: true, data: texts[index] });
  } catch (err) {
    console.error("Erreur update:", err);
    res.status(500).json({ error: err.message });
  }
}
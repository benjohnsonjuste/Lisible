import { getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  const owner = "ton-nom-utilisateur";
  const repo = "Lisible";
  const token = process.env.GITHUB_TOKEN;
  const path = "texts/index.json";

  try {
    const file = await getFileContent({ owner, repo, path, token });
    if (!file) return res.status(404).json({ error: "Aucun texte trouvé." });

    const texts = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    res.status(200).json({ data: texts });
  } catch (err) {
    console.error("Erreur lecture:", err);
    res.status(500).json({ error: err.message });
  }
}
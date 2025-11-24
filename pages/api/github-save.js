import { saveFileToGitHub } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  const { id, data } = req.body;

  try {
    await saveFileToGitHub(`data/texts/${id}.json`, JSON.stringify(data, null, 2));

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Échec GitHub", details: err });
  }
}
import { getFileContent } from "@/lib/githubClient";

const USERS_DIR = "data/users";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID manquant" });

  try {
    const path = `${USERS_DIR}/${id}.json`;
    const content = await getFileContent({ path });
    const data = JSON.parse(content);
    res.status(200).json({ subscribers: data.subscribers || [] });
  } catch (err) {
    console.error("Erreur récupération abonnés:", err);
    res.status(200).json({ subscribers: [] }); // pas d’erreur bloquante
  }
}
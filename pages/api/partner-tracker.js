import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { partnerId, action } = req.body;
  const path = "data/marketing/partners.json";

  try {
    const file = await getFile(path) || { content: {}, sha: null };
    const content = file.content;

    if (!content[partnerId]) content[partnerId] = { views: 0, clicks: 0 };
    if (action === 'view') content[partnerId].views += 1;
    if (action === 'click') content[partnerId].clicks += 1;

    await updateFile(path, content, file.sha, `📈 Stat Marketing : ${partnerId}`);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur tracking" });
  }
}

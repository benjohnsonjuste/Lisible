export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { textId, uniqueId } = req.body;
  if (!textId || !uniqueId) return res.status(400).json({ error: "Paramètres manquants" });

  try {
    const key = `viewers-${textId}`;
    let viewers = JSON.parse(localStorage.getItem(key) || "[]");
    if (!viewers.includes(uniqueId)) {
      viewers.push(uniqueId);
      localStorage.setItem(key, JSON.stringify(viewers));
    }
    res.status(200).json({ views: viewers.length });
  } catch (error) {
    console.error("Erreur views API:", error);
    res.status(500).json({ error: error.message });
  }
}
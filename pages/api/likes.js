export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { textId, userId } = req.body;
  if (!textId || !userId) return res.status(400).json({ error: "Paramètres manquants" });

  try {
    const key = `likes-${textId}`;
    let likes = JSON.parse(localStorage.getItem(key) || "[]");
    if (!likes.includes(userId)) likes.push(userId);
    localStorage.setItem(key, JSON.stringify(likes));

    res.status(200).json({ likes: likes.length });
  } catch (error) {
    console.error("Erreur likes API:", error);
    res.status(500).json({ error: error.message });
  }
}
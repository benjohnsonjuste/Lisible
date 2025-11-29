export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const user = req.body;

    const githubRes = await fetch(process.env.GITHUB_USERS_FILE_URL, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (!githubRes.ok) {
      return res.status(500).json({ error: "Erreur enregistrement GitHub" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur API save-user-github:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
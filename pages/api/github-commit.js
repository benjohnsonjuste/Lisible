// /api/github-commit.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const token = process.env.GITHUB_TOKEN;       // Ton token GitHub (serveur)
  const repo = process.env.GITHUB_REPO;         // "owner/nom-du-repo"
  const branch = process.env.GITHUB_BRANCH || "main";
  const filePath = process.env.GITHUB_PATH || "data/events.json";

  if (!token || !repo) {
    return res.status(500).json({
      error: "Variables d'environnement GitHub manquantes",
    });
  }

  const payload = req.body;

  const API = "https://api.github.com";

  // Étape 1 : récupérer le fichier existant (events.json)
  const getUrl = `${API}/repos/${repo}/contents/${filePath}?ref=${branch}`;
  let sha = null;
  let events = [];

  const getRes = await fetch(getUrl, {
    headers: { Authorization: `token ${token}` },
  });

  if (getRes.status === 200) {
    const file = await getRes.json();
    sha = file.sha;

    const content = Buffer.from(file.content, "base64").toString();
    try {
      events = JSON.parse(content);
    } catch {
      events = [];
    }
  }

  // Étape 2 : ajouter le nouvel event
  events.push({
    ...payload,
    ts: new Date().toISOString(),
  });

  // Étape 3 : commit vers GitHub
  const newContent = Buffer.from(JSON.stringify(events, null, 2)).toString(
    "base64"
  );

  const commitRes = await fetch(
    `${API}/repos/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Event update (TextPage)",
        content: newContent,
        sha: sha || undefined,
        branch,
      }),
    }
  );

  const commitJson = await commitRes.json();

  if (commitRes.status >= 200 && commitRes.status < 300) {
    return res.status(200).json({ ok: true, commit: commitJson });
  }

  return res.status(500).json({ error: commitJson });
}
// pages/api/save-user-github.js
// Ajoute/merge un user dans data/users.json via lib/githubClient
import { getFileContent, createOrUpdateFile } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const payload = req.body;
    if (!payload || !payload.uid) return res.status(400).json({ error: "Invalid payload" });

    const path = "data/users.json";

    // 1) Récupérer le fichier existant (s'il existe)
    let users = [];
    try {
      const raw = await getFileContent({ path });
      users = JSON.parse(raw);
      if (!Array.isArray(users)) users = [];
    } catch (err) {
      // si fichier pas trouvé -> on créé un nouveau tableau
      users = [];
    }

    // 2) chercher si user existe
    const existingIndex = users.findIndex((u) => u.uid === payload.uid);
    const now = new Date().toISOString();

    const userEntry = {
      uid: payload.uid,
      fullName: payload.fullName || payload.authorName || "",
      email: payload.email || payload.authorEmail || "",
      createdAt: payload.createdAt || now,
    };

    if (existingIndex >= 0) {
      // merge fields
      users[existingIndex] = { ...users[existingIndex], ...userEntry };
    } else {
      users.push(userEntry);
    }

    // 3) Sauvegarder sur GitHub
    await createOrUpdateFile({
      path,
      content: JSON.stringify(users, null, 2),
      message: existingIndex >= 0 ? `Update user ${userEntry.uid}` : `Add user ${userEntry.uid}`,
    });

    return res.status(200).json({ ok: true, user: userEntry });
  } catch (err) {
    console.error("save-user-github error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
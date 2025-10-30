import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

const USERS_DIR = "data/users"; // Dossier dans ton repo GitHub

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { authorId, followerId, followerName, followerEmail } = req.body;

  if (!authorId || !followerId)
    return res.status(400).json({ error: "Identifiants manquants" });

  const path = `${USERS_DIR}/${authorId}.json`;

  try {
    // 🔹 Récupère le profil de l’auteur sur GitHub
    let userData = {};
    try {
      const content = await getFileContent({ path });
      userData = JSON.parse(content);
    } catch {
      userData = { id: authorId, subscribers: [] };
    }

    if (!userData.subscribers) userData.subscribers = [];

    // 🔹 Vérifie si l’utilisateur suit déjà l’auteur
    const existing = userData.subscribers.find((s) => s.id === followerId);
    if (existing) {
      // Désabonnement
      userData.subscribers = userData.subscribers.filter((s) => s.id !== followerId);
    } else {
      // Abonnement
      userData.subscribers.push({
        id: followerId,
        name: followerName || "Abonné",
        email: followerEmail || "",
        date: new Date().toISOString(),
      });
    }

    // 🔹 Sauvegarde mise à jour dans GitHub
    await createOrUpdateFile({
      path,
      content: JSON.stringify(userData, null, 2),
      message: existing
        ? `🔄 Désabonnement de ${followerName || "inconnu"}`
        : `✨ Nouvel abonné : ${followerName || "inconnu"}`,
    });

    res.status(200).json({
      success: true,
      isFollowing: !existing,
      subscribersCount: userData.subscribers.length,
    });
  } catch (err) {
    console.error("Erreur follow GitHub:", err);
    res.status(500).json({ error: "Impossible de mettre à jour l'abonnement." });
  }
}
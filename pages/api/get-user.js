import { getUserFromGithub, saveUserToGithub } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { uidToFollow, followerUid, followerName, followerEmail } = req.body;

  if (!uidToFollow || !followerUid) {
    return res.status(400).json({ error: "UID manquant" });
  }

  try {
    const user = await getUserFromGithub(uidToFollow);
    if (!user) {
      return res.status(404).json({ error: "Auteur introuvable" });
    }

    // ✅ S'assurer que la propriété subscribers est un tableau
    user.subscribers = Array.isArray(user.subscribers) ? user.subscribers : [];

    // ✅ Vérifier si le follower n'est pas déjà abonné
    const alreadySubscribed = user.subscribers.some(
      (sub) => sub.uid === followerUid
    );

    if (!alreadySubscribed) {
      user.subscribers.push({
        uid: followerUid,
        name: followerName || "Utilisateur inconnu",
        email: followerEmail || "",
        date: new Date().toISOString(),
      });
    }

    // ✅ Sauvegarder la mise à jour sur GitHub
    await saveUserToGithub(user);

    res.status(200).json({ message: "✅ Abonné ajouté avec succès !" });
  } catch (err) {
    console.error("Erreur dans follow-user.js:", err);
    res.status(500).json({ error: "❌ Impossible d'ajouter l'abonné" });
  }
}
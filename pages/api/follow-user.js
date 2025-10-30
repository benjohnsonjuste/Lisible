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
    if (!user) return res.status(404).json({ error: "Auteur introuvable" });

    user.subscribers = Array.isArray(user.subscribers) ? user.subscribers : [];

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

    await saveUserToGithub(user);
    res.status(200).json({ message: "Abonné ajouté !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur d'abonnement" });
  }
}
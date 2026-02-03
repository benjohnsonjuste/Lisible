import { getFile, updateFile, getEmailId } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { token, email } = req.query;
  if (!token || !email) return res.status(400).send("Données manquantes");

  try {
    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);

    if (!userRes) return res.status(404).send("Utilisateur introuvable");
    let user = userRes.content;

    // Vérification du token
    if (!user.deletionToken || user.deletionToken.token !== token) {
      return res.status(400).send("Lien invalide");
    }

    if (new Date(user.deletionToken.expiresAt) < new Date()) {
      return res.status(400).send("Lien expiré");
    }

    // Soft-delete : On marque comme supprimé et on vide les infos sensibles
    user.status = "deleted";
    user.deletedAt = new Date().toISOString();
    delete user.deletionToken;
    user.wallet.balance = 0; // On remet à zéro pour éviter les abus

    await updateFile(path, user, userRes.sha, `🚫 Compte supprimé : ${email}`);

    // Redirection vers une page de confirmation sur ton site
    res.redirect("/login?message=account_deleted");
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression");
  }
}

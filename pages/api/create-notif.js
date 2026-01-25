import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Extraction des données du corps de la requête
  const { type, message, targetEmail, link, date, id } = req.body;

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  try {
    // 1. Récupération du fichier actuel sur GitHub
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
    const content = Buffer.from(fileData.content, "base64").toString();
    const notifications = JSON.parse(content);

    // 2. Création de la nouvelle notification avec des valeurs par défaut sécurisées
    const newNotif = {
      id: id || Date.now(), // Utilise l'ID envoyé ou en génère un
      type: type || "info",
      message: message || "Nouvelle mise à jour",
      targetEmail: targetEmail !== undefined ? targetEmail : null, // Important pour le filtrage Public
      link: link || "#",
      date: date || new Date().toISOString() // Utilise la date envoyée ou celle du serveur
    };

    // 3. Mise à jour du fichier (on garde les 50 dernières notifications)
    const updatedNotifications = [newNotif, ...notifications].slice(0, 50);
    const updatedContent = Buffer.from(
      JSON.stringify(updatedNotifications, null, 2)
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `📢 Notification: ${type} - ${new Date().toLocaleDateString()}`,
      content: updatedContent,
      sha: fileData.sha
    });

    return res.status(200).json({ success: true, notification: newNotif });
  } catch (error) {
    console.error("Erreur API Notification:", error.message);
    return res.status(500).json({ error: "Échec de la mise à jour des notifications" });
  }
}

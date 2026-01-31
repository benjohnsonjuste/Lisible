import { Buffer } from "buffer";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: "1931362",
  key: "1da55287e2911ceb01dd",
  secret: "f07d3b5b15be62507850",
  cluster: "us2",
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Non autorisé" });

  // Ajout de 'systemAction' pour gérer les mises à jour de stats ou wallet en arrière-plan
  const { type, message, targetEmail, link, amountLi, systemAction } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  // --- 1. CONSTRUCTION DE LA NOTIFICATION RICHE ---
  const newNotif = {
    id: `notif-${Date.now()}`,
    type: type || "info", // 'gain', 'badge', 'anniversaire', 'system', 'info'
    message: message || "Nouvelle activité sur Lisible",
    targetEmail: targetEmail?.toLowerCase() || "all",
    link: link || "/account",
    amountLi: amountLi || 0, // Si c'est un gain de lecture
    systemAction: systemAction || null, // ex: { action: "ADD_BADGE", value: "Plume de la semaine" }
    date: new Date().toISOString(),
    read: false
  };

  try {
    // --- 2. PUSHER : ALERTE TEMPS RÉEL ---
    // On envoie sur un canal global ou privé selon la cible
    const channel = targetEmail === "all" ? "global-notifications" : `user-${Buffer.from(targetEmail).toString('base64').replace(/=/g, "")}`;
    await pusher.trigger(channel, "new-alert", newNotif);

    // --- 3. GITHUB : MISE À JOUR DU REGISTRE DES NOTIFICATIONS ---
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });

    let currentNotifs = [];
    let sha = null;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      currentNotifs = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
    }

    // On garde les 100 dernières notifications
    const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 100);

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `🔔 Notification Système : ${type} pour ${targetEmail}`,
        content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
        sha: sha,
      }),
    });

    // --- 4. LOGIQUE SPÉCIALE : GAINS AUTOMATIQUES ---
    // Si la notification contient un 'amountLi', on pourrait ici appeler une fonction 
    // qui met à jour le fichier wallet de l'utilisateur (en option, via une autre API).

    return res.status(200).json({ 
      success: true, 
      notification: newNotif,
      targetChannel: channel 
    });

  } catch (error) {
    console.error("Notif Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

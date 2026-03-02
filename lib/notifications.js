// lib/notifications.js
export function addNotification(notification) {
  const key = "notifications";
  const stored = JSON.parse(localStorage.getItem(key) || "[]");

  const newNotification = {
    id: crypto.randomUUID(),
    ...notification,
    date: new Date().toISOString(),
  };

  const updated = [newNotification, ...stored].slice(0, 100); // On garde les 100 dernières
  localStorage.setItem(key, JSON.stringify(updated));
  return newNotification;
}

// 🔹 Pour tout le monde (nouveaux textes & annonces de duels)
export function getPublicNotifications() {
  const all = JSON.parse(localStorage.getItem("notifications") || "[]");
  return all.filter((n) => n.type === "new_text" || n.type === "duel_alert" || n.type === "duel_winner");
}

// 🔹 Pour un utilisateur (likes, commentaires & victoires de duel)
export function getUserNotifications(uid) {
  const all = JSON.parse(localStorage.getItem("notifications") || "[]");
  return all.filter(
    (n) => n.targetUid === uid && (n.type === "like" || n.type === "comment" || n.type === "duel_winner")
  );
}

// 🔹 Tout (pour debug/admin)
export function getAllNotifications() {
  return JSON.parse(localStorage.getItem("notifications") || "[]");
}

/**
 * 🔹 AJOUTS POUR LE SYSTÈME DE JEU (DUELS)
 */

// Annoncer un duel programmé (Public)
export function notifyNewDuel(p1Name, p2Name, duelId) {
  return addNotification({
    type: "duel_alert",
    title: "⚔️ Duel de Plume !",
    message: `${p1Name} affronte ${p2Name} ce dimanche. Préparez vos Li !`,
    link: `/club/duel/${duelId}`,
    importance: "high"
  });
}

// Annoncer le gagnant et le badge Haute Classe (Public + Cible)
export function notifyDuelWinner(winnerName, winnerEmail, duelId) {
  return addNotification({
    type: "duel_winner",
    targetUid: winnerEmail, // Notifie spécifiquement le gagnant dans son flux
    title: "🏆 Nouveau Champion !",
    message: `${winnerName} a remporté le duel et porte désormais le badge Haute Classe.`,
    link: `/club/duel/${duelId}`,
    isVictory: true
  });
}
}
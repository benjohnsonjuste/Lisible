// lib/notifications.js
export function addNotification(notification) {
  const key = "notifications";
  const stored = JSON.parse(localStorage.getItem(key) || "[]");

  const newNotification = {
    id: crypto.randomUUID(),
    ...notification,
    date: new Date().toISOString(),
  };

  const updated = [newNotification, ...stored];
  localStorage.setItem(key, JSON.stringify(updated));
  return newNotification;
}

// 🔹 Pour tout le monde (nouveaux textes)
export function getPublicNotifications() {
  const all = JSON.parse(localStorage.getItem("notifications") || "[]");
  return all.filter((n) => n.type === "new_text");
}

// 🔹 Pour un utilisateur (likes & commentaires)
export function getUserNotifications(uid) {
  const all = JSON.parse(localStorage.getItem("notifications") || "[]");
  return all.filter(
    (n) => n.targetUid === uid && (n.type === "like" || n.type === "comment")
  );
}

// 🔹 Tout (pour debug/admin)
export function getAllNotifications() {
  return JSON.parse(localStorage.getItem("notifications") || "[]");
}
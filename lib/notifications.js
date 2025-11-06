// 🔹 lib/notifications.js
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

export function getNotifications() {
  return JSON.parse(localStorage.getItem("notifications") || "[]");
}

export function clearNotifications() {
  localStorage.removeItem("notifications");
}
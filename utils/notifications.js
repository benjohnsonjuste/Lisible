// utils/notifications.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

/**
 * Ajoute une notification pour un utilisateur donné
 * @param {string} userId
 * @param {object} notification { type, title, message, link? }
 */
export async function addNotification(userId, notification) {
  if (!userId) return;

  await addDoc(collection(db, "users", userId, "notifications"), {
    ...notification,
    createdAt: serverTimestamp(),
    read: false,
  });
}
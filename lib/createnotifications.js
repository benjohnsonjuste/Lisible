import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Crée une nouvelle notification
 */
export const createNotification = async ({
  type,
  title,
  message,
  recipientId,
  senderId = null,
  resourceId = null,
  resourceType = null
}) => {
  try {
    await addDoc(collection(db, "notifications"), {
      type,
      title,
      message,
      recipientId,
      senderId,
      resourceId,
      resourceType,
      createdAt: serverTimestamp(),
      isRead: false,
    });
    console.log("Notification créée avec succès !");
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
  }
};
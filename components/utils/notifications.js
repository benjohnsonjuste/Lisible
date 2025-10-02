import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function createNotification(recipientId, title, body, type = "new_post") {
  await addDoc(collection(db, "notifications"), {
    recipientId,
    title,
    body,
    type,
    createdAt: serverTimestamp(),
    read: false
  });
}

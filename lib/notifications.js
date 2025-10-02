import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export async function requestNotificationPermission(userId) {
  const messaging = getMessaging(app);
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    if (token) {
      await setDoc(doc(db, "userTokens", userId), { token }, { merge: true });
      console.log("✅ FCM Token:", token);
    }
  } catch (err) {
    console.error("Erreur permission notifications:", err);
  }
}

export function listenToMessages() {
  const messaging = getMessaging(app);
  onMessage(messaging, (payload) => {
    console.log("📩 Message reçu:", payload);
    alert(payload.notification.title + "\n" + payload.notification.body);
  });
}

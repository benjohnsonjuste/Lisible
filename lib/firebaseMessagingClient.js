import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, NEXT_PUBLIC_VAPID_KEY, db } from "./firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

/**
 * Obtenir le token FCM pour l'utilisateur
 */
export const getFCMToken = async (userId) => {
  try {
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { vapidKey: NEXT_PUBLIC_VAPID_KEY });

    if (currentToken) {
      console.log("FCM Token obtenu:", currentToken);
      // Stocker le token dans Firestore pour notifications
      await setDoc(doc(db, "userTokens", userId), { token: currentToken }, { merge: true });
      return currentToken;
    } else {
      console.log("Aucun token disponible. Demander la permission de notification.");
      return null;
    }
  } catch (err) {
    console.error("Erreur getFCMToken:", err);
    return null;
  }
};

/**
 * Écoute les messages entrants
 */
export const onMessageListener = (callback) => {
  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log("Message reçu:", payload);
      callback(payload);
    });
  } catch (err) {
    console.error("Erreur onMessageListener:", err);
  }
};
// lib/firebaseMessagingClient.js
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebaseConfig";

export const messaging = getMessaging(app);

export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "TA_CLE_VAPID_PUBLIC" // à remplacer par ta clé VAPID
    });
    return token;
  } catch (e) {
    console.error("Erreur getFCMToken :", e);
    return null;
  }
};

export const onMessageListener = (callback) => {
  onMessage(messaging, callback);
};
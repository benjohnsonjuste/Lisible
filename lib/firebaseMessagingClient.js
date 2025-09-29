// lib/firebaseMessagingClient.js
import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirestore, doc, setDoc } from "firebase/firestore";

/* 🔹 Configuration Firebase côté client */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/* 🔹 Initialisation Firebase si nécessaire */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

/**
 * Obtenir le FCM token pour l'utilisateur
 * @param {string} userId - UID de l'utilisateur
 */
export const getFCMToken = async (userId) => {
  try {
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    });

    if (currentToken) {
      console.log("✅ FCM Token obtenu :", currentToken);
      // Stocker le token dans Firestore pour notifications
      await setDoc(doc(db, "userTokens", userId), { token: currentToken }, { merge: true });
      return currentToken;
    } else {
      console.warn("⚠️ Aucun token disponible. Demander la permission de notification.");
      return null;
    }
  } catch (err) {
    console.error("❌ Erreur getFCMToken :", err);
    return null;
  }
};

/**
 * Écoute les messages entrants FCM
 * @param {function} callback - fonction appelée à la réception d'un message
 */
export const onMessageListener = (callback) => {
  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log("📩 Message reçu :", payload);
      callback(payload);
    });
  } catch (err) {
    console.error("❌ Erreur onMessageListener :", err);
  }
};

/**
 * S'abonner au topic "clubPosts" (ou récupérer simplement le token)
 */
export const subscribeToClubPosts = async (userId) => {
  try {
    const token = await getFCMToken(userId);
    if (token) {
      console.log("✅ Abonnement au topic clubPosts prêt avec token :", token);
      // Ici tu peux appeler ton backend pour abonner l'utilisateur au topic
    }
  } catch (err) {
    console.error("❌ Erreur subscribeToClubPosts :", err);
  }
};
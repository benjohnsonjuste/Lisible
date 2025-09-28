// lib/sendLiveNotification.js
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const sendLiveNotification = async (authorName, streamType) => {
  try {
    // Récupérer tous les tokens utilisateurs
    const snapshot = await getDocs(collection(db, "userTokens"));
    const tokens = snapshot.docs.map((doc) => doc.data().token);

    if (tokens.length === 0) {
      console.warn("Aucun token FCM trouvé.");
      return;
    }

    // Préparer le message
    const title = "Live en direct sur Lisible 🎥";
    const body = `${authorName} est en direct (${streamType === "video" ? "Vidéo" : "Audio"}) !`;

    // Envoi via l'API FCM
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "key=TA_CLE_SERVEUR_FIREBASE", // clé serveur Firebase
      },
      body: JSON.stringify({
        notification: {
          title,
          body,
        },
        registration_ids: tokens, // Envoi à plusieurs tokens en même temps
      }),
    });

    console.log("Notification envoyée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification :", error);
  }
};
// hooks/useNotifications.js
import { useEffect } from "react";
import { messaging, db } from "@/lib/firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

export default function useNotifications(user) {
  useEffect(() => {
    if (!user) return;

    const requestPermission = async () => {
      try {
        console.log("Demande de permission pour les notifications...");

        const token = await getToken(messaging, {
          vapidKey: "TA_CLE_VAPID_PUBLIC", // depuis la console Firebase
        });

        if (token) {
          console.log("Token FCM obtenu :", token);

          // Enregistrer le token dans Firestore
          await setDoc(doc(db, "userTokens", user.uid), {
            token,
          });
        } else {
          console.warn("Aucun token disponible, permission refusée.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du token FCM :", error);
      }
    };

    requestPermission();

    // Écouter les notifications en direct (quand l'utilisateur est sur l'app)
    onMessage(messaging, (payload) => {
      console.log("Notification reçue au premier plan :", payload);
      alert(payload.notification.body);
    });
  }, [user]);
}

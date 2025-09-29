import { getMessaging, getToken } from "firebase/messaging";

export async function subscribeToClubPosts() {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    });

    if (token) {
      console.log("✅ FCM Token récupéré :", token);
      // Tu peux éventuellement envoyer ce token à ton backend
      // pour abonner l'utilisateur à un topic.
    } else {
      console.warn("⚠️ Aucun FCM Token généré. L'utilisateur a peut-être refusé les notifications.");
    }
  } catch (err) {
    console.error("❌ Erreur lors de l'abonnement FCM :", err);
  }
}
/**
 * API Route: Broadcast Live Notification via OneSignal
 * Cette route envoie une notification à tous les utilisateurs abonnés.
 */

export default async function handler(req, res) {
  // 1. Protection de la méthode (uniquement POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  // 2. Récupération des données du live
  const { authorName, mode, roomId } = req.body;

  // Validation simple
  if (!authorName || !roomId) {
    return res.status(400).json({ message: "Données manquantes (authorName ou roomId)" });
  }

  // 3. Configuration du corps de la notification OneSignal
  const notificationBody = {
    app_id: process.env.ONESIGNAL_APP_ID,
    included_segments: ["Total Subscriptions"], // "All" ou "Total Subscriptions" selon votre config OneSignal
    headings: { 
      fr: "🚨 DIRECT - Lisible Club", 
      en: "🚨 LIVE - Lisible Club" 
    },
    contents: { 
      fr: `${authorName} a lancé un ${mode === 'video' ? 'live vidéo' : 'podcast'}. Rejoins la plume !`,
      en: `${authorName} started a ${mode === 'video' ? 'live video' : 'podcast'}. Join now!` 
    },
    // L'URL vers laquelle l'utilisateur est redirigé en cliquant sur la notification
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lisible.vercel.app'}/club/live/${roomId}`,
    
    // Design de la notification (optionnel)
    chrome_web_badge: "https://votre-site.com/icon.png",
    chrome_web_icon: "https://votre-site.com/icon.png",
  };

  try {
    // 4. Appel à l'API OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}` // Clé secrète stockée en variable d'environnement
      },
      body: JSON.stringify(notificationBody)
    });
    
    const data = await response.json();

    if (data.errors) {
      throw new Error(JSON.stringify(data.errors));
    }

    // 5. Réponse de succès
    return res.status(200).json({ 
      success: true, 
      message: "Notification envoyée à toute la communauté",
      id: data.id 
    });

  } catch (err) {
    console.error("Erreur OneSignal:", err.message);
    return res.status(500).json({ 
      success: false, 
      error: "Échec de l'envoi de la notification",
      details: err.message 
    });
  }
}

import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  // On autorise uniquement le POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { channel, event, data } = req.body;

    if (!channel || !event || !data) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    // Déclenchement de l'événement Pusher
    await pusher.trigger(channel, event, data);

    return res.status(200).json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error("Erreur Pusher Trigger:", error);
    return res.status(500).json({ error: "Erreur de diffusion en direct" });
  }
}

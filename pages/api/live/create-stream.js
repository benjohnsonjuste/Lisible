export default async function handler(req, res) {
  // 1. On autorise uniquement la méthode POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Vérification de la présence de la clé API dans les variables d'environnement
  if (!process.env.LIVEPEER_API_KEY) {
    console.error("ERREUR: La variable LIVEPEER_API_KEY est manquante sur Vercel.");
    return res.status(500).json({ error: "Configuration serveur incomplète (Clé API manquante)." });
  }

  const { roomName } = req.body;

  try {
    // 2. Appel à l'API Livepeer Studio pour créer le flux
    const response = await fetch("https://livepeer.studio/api/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName || "Club Lisible",
        profiles: [
          { 
            name: "720p", 
            bitrate: 2000000, 
            fps: 30, 
            width: 1280, 
            height: 720 
          },
          { 
            name: "480p", 
            bitrate: 1000000, 
            fps: 30, 
            width: 854, 
            height: 480 
          },
        ],
      }),
    });

    const data = await response.json();

    // 3. Gestion des erreurs renvoyées par Livepeer (Ex: Clé invalide, quota dépassé)
    if (!response.ok) {
      console.error("Livepeer API Error Details:", data);
      return res.status(response.status).json({ 
        error: data.errors ? data.errors[0] : "Erreur lors de la création du flux sur Livepeer." 
      });
    }

    // 4. Succès : On renvoie les identifiants nécessaires au frontend
    // streamKey : sert à l'hôte pour diffuser
    // playbackId : sert au player pour afficher la vidéo
    return res.status(200).json({
      streamKey: data.streamKey,
      playbackId: data.playbackId,
    });

  } catch (error) {
    // Erreur de connexion (Timeout, DNS, etc.)
    console.error("Critical Server Error:", error);
    return res.status(500).json({ error: "Impossible de contacter le serveur vidéo. Vérifiez votre connexion." });
  }
}

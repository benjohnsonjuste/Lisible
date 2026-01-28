export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const apiKey = process.env.LIVEPEER_API_KEY;
  const { roomName } = req.body;

  if (!apiKey) {
    return res.status(500).json({ error: "Configuration API manquante." });
  }

  try {
    // 1. On cherche si le flux existe déjà
    const checkRes = await fetch(`https://livepeer.studio/api/stream?streamsonly=1`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    
    const existingStreams = await checkRes.json();
    let stream = existingStreams?.find(s => s.name === roomName);

    // 2. Si inexistant, on le crée
    if (!stream) {
      const createRes = await fetch("https://livepeer.studio/api/stream", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName || "Club Lisible",
          profiles: [
            { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
            { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
          ],
        }),
      });
      stream = await createRes.json();
    } else {
      // 3. SI EXISTANT : On récupère la version "fraîche" par ID pour avoir le statut isActive réel
      // Livepeer Studio met parfois du temps à mettre à jour la liste globale
      const refreshRes = await fetch(`https://livepeer.studio/api/stream/${stream.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      stream = await refreshRes.json();
    }

    // On renvoie les infos complètes nécessaires au frontend
    return res.status(200).json({
      streamKey: stream.streamKey,
      playbackId: stream.playbackId,
      isActive: stream.isActive, // TRÈS IMPORTANT : Pour savoir si l'hôte émet
      ingestUrl: stream.rtmpIngestUrl // Utile pour certains protocoles de diffusion
    });

  } catch (error) {
    console.error("Critical Server Error:", error);
    return res.status(500).json({ error: "Erreur réseau serveur." });
  }
}

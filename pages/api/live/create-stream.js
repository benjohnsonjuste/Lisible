export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const apiKey = process.env.LIVEPEER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Configuration API manquante." });
  }

  const { roomName } = req.body;

  try {
    // ÉTAPE 1 : Vérifier si un flux avec ce nom existe déjà (Optionnel mais recommandé)
    // Cela évite de recréer un streamKey à chaque clic sur "Ouvrir l'antenne"
    const checkRes = await fetch(`https://livepeer.studio/api/stream?streamsonly=1`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const existingStreams = await checkRes.json();
    const existing = existingStreams.find(s => s.name === roomName);

    if (existing) {
      return res.status(200).json({
        streamKey: existing.streamKey,
        playbackId: existing.playbackId,
      });
    }

    // ÉTAPE 2 : Création si inexistant
    const response = await fetch("https://livepeer.studio/api/stream", {
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erreur Livepeer Studio" });
    }

    // On s'assure de ne renvoyer QUE ce dont le frontend a besoin
    return res.status(200).json({
      streamKey: data.streamKey || null,
      playbackId: data.playbackId || null,
    });

  } catch (error) {
    console.error("Critical Server Error:", error);
    return res.status(500).json({ error: "Erreur réseau serveur." });
  }
}

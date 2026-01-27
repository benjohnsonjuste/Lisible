export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Méthode non autorisée" });

  const API_KEY = process.env.LIVEPEER_API_KEY || "f15e0657-3f95-46f3-8b77-59f0f909162c";

  try {
    // 1. On récupère la liste des flux (streams)
    const response = await fetch("https://livepeer.studio/api/stream?streamsonly=1", {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Erreur Livepeer");

    const data = await response.json();

    // 2. On filtre uniquement les flux qui ont le statut 'isActive' à true
    // Livepeer renvoie un tableau d'objets. isActive signifie que le host émet.
    const activeLives = data
      .filter((stream) => stream.isActive === true)
      .map((stream) => ({
        id: stream.id,
        name: stream.name.replace("Club-", ""), // On nettoie le nom pour l'affichage
        playbackId: stream.playbackId,
        createdAt: stream.createdAt,
      }));

    return res.status(200).json(activeLives);
  } catch (error) {
    console.error("API LIST ERROR:", error);
    return res.status(500).json({ error: "Impossible de récupérer les flux" });
  }
}

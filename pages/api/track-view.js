// pages/api/track-view.js
import { Redis } from "@upstash/redis";

// Initialisation automatique via les variables d'environnement Vercel
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { textId } = req.body;
  if (!textId) return res.status(400).json({ error: "textId requis" });

  try {
    // INCRÉMENTATION INSTANTANÉE
    // On utilise une clé structurée "views:ID_DU_TEXTE"
    const newViewCount = await redis.incr(`views:${textId}`);

    // Optionnel : On peut aussi incrémenter un compteur global pour tes stats d'admin
    await redis.incr("stats:total_views_global");

    return res.status(200).json({ 
      success: true, 
      views: newViewCount,
      source: "cache_redis_ultra_fast"
    });
  } catch (e) {
    console.error("Redis Tracking Error:", e);
    return res.status(500).json({ error: "Erreur lors du tracking via Redis" });
  }
}

// pages/api/track-view.js
import { Redis } from "@upstash/redis";

export const config = {
  runtime: "edge", // <-- C'est ici que tu gagnes les dernières millisecondes
};

const redis = Redis.fromEnv();

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { textId } = await req.json();
    if (!textId) {
      return new Response(JSON.stringify({ error: "textId requis" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Pipeline Redis : on incrémente la vue ET le total global en un seul voyage réseau
    const [newViewCount, totalGlobal] = await redis
      .pipeline()
      .incr(`views:${textId}`)
      .incr("stats:total_views_global")
      .exec();

    return new Response(
      JSON.stringify({ 
        success: true, 
        views: newViewCount,
        global: totalGlobal,
        source: "edge_redis_fast" 
      }), 
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Redis Tracking Error" }), { 
      status: 500 
    });
  }
}

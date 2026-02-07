// app/api/track-view/route.js
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "edge"; // On conserve l'exécution aux frontières pour la vitesse

const redis = Redis.fromEnv();

export async function POST(req) {
  try {
    const { textId } = await req.json();

    if (!textId) {
      return NextResponse.json(
        { error: "textId requis" }, 
        { status: 400 }
      );
    }

    // Pipeline Redis : incrémentation atomique (Vues par texte + Global)
    const [newViewCount, totalGlobal] = await redis
      .pipeline()
      .incr(`views:${textId}`)
      .incr("stats:total_views_global")
      .exec();

    return NextResponse.json({ 
      success: true, 
      views: newViewCount,
      global: totalGlobal,
      source: "edge_redis_fast" 
    }, { status: 200 });

  } catch (e) {
    console.error("Redis Edge Error:", e);
    return NextResponse.json(
      { error: "Redis Tracking Error" }, 
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function POST(req) {
  const { roomName } = await req.json();

  try {
    const response = await fetch("https://livepeer.studio/api/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        profiles: [
          { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
          { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
        ],
      }),
    });

    const data = await response.json();
    
    // On renvoie la StreamKey (pour l'hôte) et le PlaybackId (pour le spectateur)
    return NextResponse.json({
      streamKey: data.streamKey,
      playbackId: data.playbackId,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

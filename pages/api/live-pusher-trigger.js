import { NextResponse } from "next/server";
import Pusher from "pusher";

// Initialisation de Pusher avec les variables d'environnement de Vercel
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  try {
    const { channel, event, data } = await req.json();

    // Validation simple : s'assurer que les données ne sont pas vides
    if (!channel || !event || !data) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // On diffuse le message, le like ou l'animation à tout le monde
    await pusher.trigger(channel, event, data);

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error("Erreur Pusher Trigger:", error);
    return NextResponse.json(
      { error: "Erreur de diffusion en direct" }, 
      { status: 500 }
    );
  }
}

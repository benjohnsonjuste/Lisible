import { NextResponse } from "next/server";
import Pusher from "pusher";

// Ces informations se trouvent sur ton tableau de bord Pusher
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

    // On diffuse le message ou le like à tout le monde via Pusher
    await pusher.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur Pusher Trigger:", error);
    return NextResponse.json({ error: "Erreur de diffusion" }, { status: 500 });
  }
}

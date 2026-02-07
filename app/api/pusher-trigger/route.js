// app/api/pusher-trigger/route.js
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { channel, event, data } = body;

    if (!channel || !event || !data) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Déclenchement de l'événement Pusher
    await pusher.trigger(channel, event, data);

    return new Response(
      JSON.stringify({ success: true, timestamp: Date.now() }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur Pusher Trigger:", error);
    return new Response(
      JSON.stringify({ error: "Erreur de diffusion en direct" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

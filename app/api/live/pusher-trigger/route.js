import { NextResponse } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "us2",
  useTLS: true,
});

export async function POST(req) {
  try {
    const { channel, event, data } = await req.json().catch(() => ({}));
    // Validation : canal et événement doivent être des chaînes non vides.
    if (typeof channel !== "string" || !channel.trim() || typeof event !== "string" || !event.trim()) {
      return NextResponse.json({ success: false, error: "Paramètres « channel » et « event » requis" }, { status: 400 });
    }
    await pusher.trigger(channel.trim(), event.trim(), data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

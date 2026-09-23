// Téléversement audio (podcasts) vers le stockage R2 de Lisible.
// Remplace l'ancien stockage Vercel Blob afin de ne plus dépendre des quotas Vercel.
import { NextResponse } from "next/server";
import { getMediaBucket } from "../../_lib/r2.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 100 * 1024 * 1024; // 100 Mo

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 400 });
    }

    const bucket = getMediaBucket();
    if (!bucket) {
      return NextResponse.json(
        { error: "Stockage média non configuré. Réessayez plus tard." },
        { status: 503 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop lourd (maximum 100 Mo)." },
        { status: 413 }
      );
    }

    const safeName = String(file.name || "audio.mp3").replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `podcasts/${Date.now()}-${safeName}`;
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: file.type || "audio/mpeg" },
    });

    return NextResponse.json({ url: `/api/media/${key}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

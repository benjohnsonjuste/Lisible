// Sert les médias stockés sur R2 : https://lisible.biz/api/media/<clé>
// Les objets R2 sont immuables (clé unique par téléversement) : cache long.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const parts = params.key || [];
    const key = parts.join("/");
    if (!key || key.includes("..") || key.length > 300) {
      return new Response("Not found", { status: 404 });
    }
    let bucket = null;
    try {
      bucket = getCloudflareContext().env.MEDIA_BUCKET || null;
    } catch {}
    if (!bucket) {
      return new Response("Stockage média indisponible", { status: 503 });
    }
    const obj = await bucket.get(key);
    if (!obj) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(obj.body, { headers });
  } catch (e) {
    return new Response("Erreur média", { status: 500 });
  }
}

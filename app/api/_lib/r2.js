// Stockage des médias lourds (images, photos, audio) sur Cloudflare R2.
// Remplace le stockage en base64 dans les fichiers JSON GitHub, qui faisait
// gonfler le dépôt à chaque publication. Sans bucket R2 configuré, les
// fonctions renvoient la valeur d'origine (comportement historique) afin de
// ne jamais casser le site.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getMediaBucket() {
  try {
    const ctx = getCloudflareContext();
    return (ctx && ctx.env && ctx.env.MEDIA_BUCKET) || null;
  } catch {
    return null;
  }
}

export const isDataUrl = (v) =>
  typeof v === "string" && v.startsWith("data:");

function extFromDataUrl(dataUrl) {
  const m = /^data:([^;,]+)?/.exec(dataUrl || "");
  const mime = (m && m[1] && m[1].toLowerCase()) || "image/jpeg";
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return { mime, ext: map[mime] || "bin" };
}

// Téléverse une data URL vers R2. Retourne l'URL publique (/api/media/...).
// Si R2 n'est pas configuré ou en cas d'échec, retourne la valeur d'origine.
export async function uploadDataUrl(dataUrl, prefix) {
  if (!isDataUrl(dataUrl)) return dataUrl;
  const bucket = getMediaBucket();
  if (!bucket) return dataUrl;
  try {
    const { mime, ext } = extFromDataUrl(dataUrl);
    const b64 = (dataUrl.split(",")[1] || "").replace(/\s/g, "");
    if (!b64) return dataUrl;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    // Garde-fou : on ne téléverse que des fichiers raisonnables (<= 25 Mo).
    if (bytes.length > 25 * 1024 * 1024) return dataUrl;
    const key = `${prefix}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: mime } });
    return `/api/media/${key}`;
  } catch (e) {
    console.error("R2 upload échoué:", e && e.message);
    return dataUrl;
  }
}

// Champs susceptibles de contenir une image en data URL.
const IMAGE_FIELDS = [
  "image",
  "imageBase64",
  "photo",
  "photoBase64",
  "avatar",
  "avatarBase64",
  "cover",
  "coverBase64",
  "banner",
  "bannerBase64",
];

// Normalise les champs image d'un objet : les data URLs partent sur R2 et
// les variantes *Base64 sont supprimées (plus de doublons).
export async function storeImagesIn(obj, prefix) {
  if (!obj || typeof obj !== "object") return obj;
  const pairs = [
    ["image", "imageBase64"],
    ["photo", "photoBase64"],
    ["avatar", "avatarBase64"],
    ["cover", "coverBase64"],
    ["banner", "bannerBase64"],
  ];
  for (const [main, alt] of pairs) {
    const raw = obj[main] || obj[alt];
    if (isDataUrl(raw)) {
      obj[main] = await uploadDataUrl(raw, prefix);
    }
    if (alt in obj) delete obj[alt];
  }
  // Champs image isolés éventuels.
  for (const f of IMAGE_FIELDS) {
    if (isDataUrl(obj[f])) {
      try {
        obj[f] = await uploadDataUrl(obj[f], prefix);
      } catch (e) {
        console.error("R2 upload échoué:", e && e.message);
      }
    }
  }
  return obj;
}

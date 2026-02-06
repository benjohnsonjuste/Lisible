import { Buffer } from "buffer";
import DOMPurify from "isomorphic-dompurify";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/* ==============================
   OPTIONS — CORS PREFLIGHT
============================== */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/* ==============================
   GET — RÉCUPÉRATION DE L'INDEX
============================== */
export async function GET(req) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "12");
    const lastId = searchParams.get("lastId");

    const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json?t=${Date.now()}`;
    const res = await fetch(indexUrl, { 
      headers: { Authorization: `token ${token}` },
      next: { revalidate: 0 } // Désactive le cache pour avoir les derniers textes
    });

    if (!res.ok) return NextResponse.json({ data: [], nextCursor: null }, { headers: corsHeaders });

    const fileData = await res.json();
    const allTexts = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    let startIndex = 0;
    if (lastId) {
      startIndex = allTexts.findIndex(t => t.id === lastId) + 1;
    }

    const data = allTexts.slice(startIndex, startIndex + limit);
    const nextCursor = allTexts.length > startIndex + limit ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

/* ==============================
   POST — PUBLICATION
============================== */
export async function POST(req) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  try {
    const textData = await req.json();

    if (!textData?.content) {
      return NextResponse.json({ error: "Contenu requis" }, { status: 400, headers: corsHeaders });
    }

    // 🔒 Sanitation
    const cleanTitle = DOMPurify.sanitize(textData.title || "Sans titre", { ALLOWED_TAGS: [] }).trim();
    const cleanContent = DOMPurify.sanitize(textData.content || "");
    
    const slug = cleanTitle.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-").slice(0, 30) || "manuscrit";
    const id = `${slug}-${Date.now()}`;
    const creationDate = new Date().toISOString();

    const payload = {
      ...textData,
      id,
      title: cleanTitle,
      content: cleanContent,
      date: creationDate,
      views: 0,
      totalLikes: 0
    };

    // 1. Envoi du fichier JSON
    const filePutRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/texts/${id}.json`, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `📖 Publication : ${cleanTitle}`,
        content: Buffer.from(JSON.stringify(payload, null, 2)).toString("base64"),
      }),
    });

    if (!filePutRes.ok) throw new Error("Erreur GitHub (Fichier)");

    // 2. Mise à jour de l'index
    const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json`;
    const indexFetch = await fetch(indexUrl, { 
        headers: { Authorization: `token ${token}` },
        cache: 'no-store' 
    });
    
    let indexContent = [];
    let indexSha = null;

    if (indexFetch.ok) {
      const indexRes = await indexFetch.json();
      indexSha = indexRes.sha;
      indexContent = JSON.parse(Buffer.from(indexRes.content, "base64").toString("utf-8"));
    }

    indexContent.unshift({
      id,
      title: cleanTitle,
      authorName: textData.authorName,
      authorEmail: textData.authorEmail?.toLowerCase().trim(),
      date: creationDate,
      genre: textData.category || "Littérature",
      content: cleanContent.substring(0, 200),
      hasImage: !!textData.imageBase64
    });

    const indexUpdateRes = await fetch(indexUrl, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "🗂 Index Update",
        content: Buffer.from(JSON.stringify(indexContent.slice(0, 1000), null, 2)).toString("base64"),
        sha: indexSha
      }),
    });

    if (!indexUpdateRes.ok) throw new Error("Erreur GitHub (Index)");

    return NextResponse.json({ success: true, id }, { status: 201, headers: corsHeaders });

  } catch (err) {
    console.error("Erreur API:", err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

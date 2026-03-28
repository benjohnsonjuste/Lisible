import { NextResponse } from "next/server";

const GITHUB_API_URL = "https://api.github.com/repos";
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "data/live.json";

const ADMINS = [
  "adm.lablitteraire7@gmail.com", "woolsleypierre01@gmail.com", 
  "jeanpierreborlhaïniedarha@gmail.com", "robergeaurodley97@gmail.com", 
  "jb7management@gmail.com", "cmo.lablitteraire7@gmail.com"
];

// --- NOUVELLE FONCTION GET POUR RÉPONDRE AU POLLING DU COMPOSANT ---
export async function GET() {
  try {
    const res = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
      headers: { 
        Authorization: `Bearer ${TOKEN}`,
        "Cache-Control": "no-cache",
        "Accept": "application/vnd.github.v3+json"
      },
      next: { revalidate: 0 } // Désactive le cache Next.js
    });

    if (!res.ok) return NextResponse.json({ isActive: false });

    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ isActive: false, error: error.message }, { status: 500 });
  }
}

async function updateFile(content, message) {
  const getRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    headers: { 
      Authorization: `Bearer ${TOKEN}`, 
      "Cache-Control": "no-cache",
      "Accept": "application/vnd.github.v3+json"
    },
  });
  
  let sha = null;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const b64Content = Buffer.from(JSON.stringify(content, null, 2)).toString("base64");

  const updateRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: { 
      Authorization: `Bearer ${TOKEN}`, 
      "Content-Type": "application/json",
      "Accept": "application/vnd.github.v3+json"
    },
    body: JSON.stringify({
      message,
      content: b64Content,
      sha: sha || undefined,
    }),
  });

  return updateRes.ok;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, admin, type, title, user, text, avatar, x, playbackId, guestName } = body;

    // A. Action : Démarrer le Live
    if (action === "start") {
      if (!ADMINS.includes(admin?.toLowerCase())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      
      const liveData = {
        isActive: true,
        admin,
        type: type || "podcast",
        title: title || "Nouvel Épisode Podcast",
        startedAt: new Date().toISOString(),
        roomID: Buffer.from(admin + Date.now()).toString('base64').substring(0, 12),
        guest: guestName || null,
        transcript: [] 
      };
      
      const success = await updateFile(liveData, "🎙️ Podcast Studio Started");
      return success ? NextResponse.json(liveData) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // B. Action : ARCHIVER LE PODCAST
    if (action === "archive-podcast") {
      if (!ADMINS.includes(admin?.toLowerCase())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

      const res = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }, cache: 'no-store'
      });
      
      if (!res.ok) return NextResponse.json({ error: "File not found" }, { status: 404 });
      const fileData = await res.json();
      const liveData = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));

      const end = new Date();
      const start = new Date(liveData.startedAt);
      const diffMs = end - start;
      const duration = Math.floor(diffMs / 60000) + " min";

      liveData.isActive = false;
      liveData.endedAt = end.toISOString();
      liveData.playbackId = playbackId;
      liveData.duration = duration;

      const success = await updateFile(liveData, `💾 Podcast Archived: ${liveData.title}`);
      return success ? NextResponse.json({ success: true, playbackId }) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    if (action === "comment" || action === "heart") {
       // Ton code existant ici...
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

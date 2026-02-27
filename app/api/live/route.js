import { NextResponse } from "next/server";

const GITHUB_API_URL = "https://api.github.com/repos";
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "data/live.json";

// Fonction helper pour interagir avec GitHub
async function updateFile(content, message) {
  const getRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Cache-Control": "no-cache" },
  });
  
  let sha = null;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const updateRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha: sha || undefined,
    }),
  });

  return updateRes.ok;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, admin, type, title, targetEmail, user, text, avatar } = body;

    const ADMINS = [
      "adm.lablitteraire7@gmail.com", "woolsleypierre01@gmail.com", 
      "jeanpierreborlhaïniedarha@gmail.com", "robergeaurodley97@gmail.com", 
      "jb7management@gmail.com", "cmo.lablitteraire7@gmail.com"
    ];

    // A. Action : Démarrer le Live
    if (action === "start") {
      if (!ADMINS.includes(admin?.toLowerCase())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      
      const liveData = {
        isActive: true,
        admin,
        type,
        title: title || "Session en direct",
        startedAt: new Date().toISOString(),
        roomID: btoa(admin + Date.now()).substring(0, 12),
        transcript: [] // Initialisation du chat pour le replay
      };
      
      const success = await updateFile(liveData, "🚀 Live started");
      return success ? NextResponse.json(liveData) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // B. Action : Ajouter un commentaire au Transcript (En direct)
    if (action === "comment") {
      const liveRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        cache: 'no-store'
      });
      if (!liveRes.ok) return NextResponse.json({ error: "No live active" }, { status: 404 });
      
      const liveData = JSON.parse(Buffer.from((await liveRes.json()).content, 'base64').toString());
      if (!liveData.isActive) return NextResponse.json({ error: "Live ended" }, { status: 400 });

      const newComment = {
        id: Date.now(),
        user: user || "Anonyme",
        text,
        avatar: avatar || ""
      };

      liveData.transcript = [...(liveData.transcript || []), newComment];
      const success = await updateFile(liveData, "💬 New comment added");
      return success ? NextResponse.json(newComment) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // C. Action : Arrêter le Live
    if (action === "stop") {
      if (!ADMINS.includes(admin?.toLowerCase())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      
      const liveRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const liveData = JSON.parse(Buffer.from((await liveRes.json()).content, 'base64').toString());
      
      liveData.isActive = false;
      liveData.endedAt = new Date().toISOString();
      
      const success = await updateFile(liveData, "🛑 Live ended & archived");
      return success ? NextResponse.json({ isActive: false }) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // D. Action : Inviter un utilisateur
    if (action === "invite") {
      console.log(`Invitation envoyée à ${targetEmail}`);
      return NextResponse.json({ success: true });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store'
    });

    if (!res.ok) return NextResponse.json({ isActive: false });

    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
    
    return NextResponse.json(content);
  } catch (e) {
    return NextResponse.json({ isActive: false });
  }
}

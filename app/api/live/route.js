import { NextResponse } from "next/server";

const GITHUB_API_URL = "https://api.github.com/repos";
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "data/live.json";

// Fonction helper pour interagir avec GitHub
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
    const { action, admin, type, title, targetEmail, user, text, avatar, x } = body;

    const ADMINS = [
      "adm.lablitteraire7@gmail.com", "woolsleypierre01@gmail.com", 
      "jeanpierreborlhaïniedarha@gmail.com", "robergeaurodley97@gmail.com", 
      "jb7management@gmail.com", "cmo.lablitteraire7@gmail.com"
    ];

    // A. Action : Démarrer le Live
    if (action === "start") {
      if (!ADMINS.includes(admin?.toLowerCase())) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      
      const liveData = {
        isActive: true,
        admin,
        type: type || "video",
        title: title || "Session en direct",
        startedAt: new Date().toISOString(),
        roomID: Buffer.from(admin + Date.now()).toString('base64').substring(0, 12),
        transcript: [] 
      };
      
      const success = await updateFile(liveData, "🚀 Live started");
      return success ? NextResponse.json(liveData) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // B. Action : Ajouter un commentaire OU un cœur (Replay synchronisé)
    if (action === "comment" || action === "heart") {
      const liveRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        cache: 'no-store'
      });
      
      if (!liveRes.ok) return NextResponse.json({ error: "No live active" }, { status: 404 });
      
      const data = await liveRes.json();
      const liveData = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
      
      if (!liveData.isActive) return NextResponse.json({ error: "Live ended" }, { status: 400 });

      // Calcul du temps relatif (en secondes) pour le replay
      const startTime = new Date(liveData.startedAt).getTime();
      const relativeTime = (Date.now() - startTime) / 1000;

      const newItem = {
        id: Date.now(),
        type: action, // "comment" ou "heart"
        user: user || "Anonyme",
        text: text || "",
        avatar: avatar || "",
        x: x || Math.random() * 70 + 15, // Position horizontale pour le cœur
        time: relativeTime // Moment exact pour la synchronisation replay
      };

      liveData.transcript = [...(liveData.transcript || []), newItem];
      const success = await updateFile(liveData, `✨ Added ${action} by ${user}`);
      return success ? NextResponse.json(newItem) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // C. Action : Arrêter le Live
    if (action === "stop") {
      if (!ADMINS.includes(admin?.toLowerCase())) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      
      const liveRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        cache: 'no-store'
      });
      
      if (!liveRes.ok) return NextResponse.json({ error: "Live file not found" }, { status: 404 });
      
      const data = await liveRes.json();
      const liveData = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
      
      liveData.isActive = false;
      liveData.endedAt = new Date().toISOString();
      
      const success = await updateFile(liveData, "🛑 Live ended & archived");
      return success ? NextResponse.json({ isActive: false }) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // D. Action : Inviter
    if (action === "invite") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, "Accept": "application/vnd.github.v3+json" },
      cache: 'no-store'
    });

    if (!res.ok) return NextResponse.json({ isActive: false });

    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    
    return NextResponse.json(content);
  } catch (e) {
    return NextResponse.json({ isActive: false });
  }
}

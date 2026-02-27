import { NextResponse } from "next/server";

const GITHUB_API_URL = "https://api.github.com/repos";
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "data/live.json";

// Fonction helper pour interagir avec GitHub
async function updateFile(content, message) {
  // 1. Récupérer le SHA du fichier existant
  const getRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  
  let sha = null;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  // 2. Mettre à jour ou créer le fichier
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

// --- ENDPOINT POST : Gérer le lancement, l'arrêt et l'invitation ---
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, admin, type, title, targetEmail } = body;

    // Liste des emails autorisés (Admins)
    const ADMINS = [
      "adm.lablitteraire7@gmail.com", "woolsleypierre01@gmail.com", 
      "jeanpierreborlhaïniedarha@gmail.com", "robergeaurodley97@gmail.com", 
      "jb7management@gmail.com", "cmo.lablitteraire7@gmail.com"
    ];

    if (!ADMINS.includes(admin?.toLowerCase())) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // A. Action : Démarrer le Live
    if (action === "start") {
      const liveData = {
        isActive: true,
        admin,
        type, // 'audio' | 'video'
        title: title || "Session en direct",
        startedAt: new Date().toISOString(),
        roomID: btoa(admin + Date.now()).substring(0, 12)
      };
      
      const success = await updateFile(liveData, "🚀 Live started");
      return success ? NextResponse.json(liveData) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // B. Action : Arrêter le Live
    if (action === "stop") {
      const success = await updateFile({ isActive: false }, "🛑 Live ended");
      return success ? NextResponse.json({ isActive: false }) : NextResponse.json({ error: "Git Error" }, { status: 500 });
    }

    // C. Action : Inviter un utilisateur
    if (action === "invite") {
      // On récupère d'abord les infos du live actuel
      const liveRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const liveData = JSON.parse(Buffer.from((await liveRes.json()).content, 'base64').toString());

      // Logique simplifiée : On écrit une notification dans un fichier 'invites.json' 
      // ou dans le profil de l'utilisateur. Ici, on simule l'envoi.
      console.log(`Invitation envoyée à ${targetEmail} pour le live ${liveData.roomID}`);
      return NextResponse.json({ success: true });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- ENDPOINT GET : Vérifier l'état du live ---
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

import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// --- HELPERS CORE ---

async function getFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Lisible-App'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Utilisation de TextDecoder pour gérer les caractères spéciaux/accents
    const b64 = data.content.replace(/\s/g, '');
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    const decodedContent = new TextDecoder().decode(bytes);
    
    return { content: JSON.parse(decodedContent), sha: data.sha };
  } catch (err) { 
    console.error(`Fetch error [${path}]:`, err.message);
    return null; 
  }
}

async function updateFile(path, content, sha, message) {
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const encodedContent = btoa(binString);

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 
        'Content-Type': 'application/json',
        'User-Agent': 'Lisible-App'
      },
      body: JSON.stringify({ 
        message: `[DUEL] ${message} [skip ci]`, 
        content: encodedContent, 
        sha 
      })
    });
    return res.ok;
  } catch (err) {
    console.error(`Update error [${path}]:`, err.message);
    return false;
  }
}

const getSafePath = (email) => {
  // Correction de sécurité : vérifie si l'email existe avant le toLowerCase
  if (!email || typeof email !== 'string') return null;
  const safeEmail = email.toLowerCase().trim()
    .replace(/@/g, '_')
    .replace(/\./g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return `data/users/${safeEmail}.json`;
};

const getNextSundayISO = () => {
  const now = new Date();
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
  nextSunday.setHours(21, 0, 0, 0); 
  return nextSunday.toISOString();
};

// --- ROUTE PRINCIPALE ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, duelId } = body;
    
    // Chargement de la base de données des duels
    const duelsFile = await getFile("data/duels.json") || { content: [], sha: null };
    const duels = Array.isArray(duelsFile.content) ? duelsFile.content : [];

    // --- 1. ENVOYER UN DÉFI ---
    if (action === "sendChallenge" || action === "challenge") {
      const { senderEmail, targetEmail, senderName } = body;
      const targetPath = getSafePath(targetEmail);
      
      if (!targetPath) return NextResponse.json({ error: "Email cible invalide" }, { status: 400 });
      const targetFile = await getFile(targetPath);

      if (!targetFile) return NextResponse.json({ error: "Adversaire introuvable" }, { status: 404 });

      const targetData = targetFile.content;
      if (!targetData.duelRequests) targetData.duelRequests = [];
      
      const alreadyChallenged = targetData.duelRequests.some(r => r.senderEmail === senderEmail || r.fromEmail === senderEmail);
      if (alreadyChallenged) return NextResponse.json({ error: "Défi déjà envoyé" }, { status: 400 });

      targetData.duelRequests.push({
        id: `req_${Date.now()}`,
        fromEmail: senderEmail,
        fromName: senderName,
        senderEmail, 
        senderName,
        date: new Date().toISOString()
      });

      await updateFile(targetPath, targetData, targetFile.sha, `⚔️ Défi de ${senderName}`);
      return NextResponse.json({ success: true });
    }

    // --- 2. ACCEPTER UN DUEL ---
    if (action === "acceptChallenge" || action === "acceptDuel") {
      const { requestId, email } = body;
      const userPath = getSafePath(email);
      
      if (!userPath) return NextResponse.json({ error: "Email invalide" }, { status: 400 });
      const userFile = await getFile(userPath);

      if (!userFile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      const userData = userFile.content;
      const request = (userData.duelRequests || []).find(r => r.id === requestId);
      
      if (!request) return NextResponse.json({ error: "Requête introuvable" }, { status: 404 });

      const player1 = request.fromEmail || request.senderEmail;
      const player2 = email;

      const newDuel = {
        id: `duel_${Date.now()}`,
        date: getNextSundayISO(),
        participants: [player1, player2],
        participantNames: { 
          [player1]: request.fromName || request.senderName, 
          [player2]: userData.penName || userData.name 
        },
        texts: { [player1]: "", [player2]: "" },
        votes: { [player1]: 0, [player2]: 0 },
        status: "scheduled",
        theme: "Le silence d'une plume abandonnée.",
        winner: null,
        createdAt: new Date().toISOString()
      };

      userData.duelRequests = userData.duelRequests.filter(r => r.id !== requestId);

      duels.push(newDuel);
      // Mise à jour de l'utilisateur (retrait requête) et de la base duel
      await updateFile(userPath, userData, userFile.sha, `✅ Défi accepté vs ${player1}`);
      await updateFile("data/duels.json", duels, duelsFile.sha, `🏁 Nouveau Duel: ${player1} vs ${player2}`);

      return NextResponse.json({ success: true, duel: newDuel });
    }

    // --- 3. REFUSER UN DUEL ---
    if (action === "declineChallenge") {
      const { requestId, email } = body;
      const userPath = getSafePath(email);
      const userFile = await getFile(userPath);
      
      if (!userFile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      userFile.content.duelRequests = (userFile.content.duelRequests || []).filter(r => r.id !== requestId);
      await updateFile(userPath, userFile.content, userFile.sha, `❌ Défi refusé`);
      return NextResponse.json({ success: true });
    }

    // --- 4. SAUVEGARDER LE TEXTE DU DUEL ---
    if (action === "saveDuelText") {
      const { text, email } = body;
      const duelIndex = duels.findIndex(d => d.id === duelId);

      if (duelIndex === -1) return NextResponse.json({ error: "Duel introuvable" }, { status: 404 });
      if (duels[duelIndex].status === "finished") return NextResponse.json({ error: "Duel déjà terminé" }, { status: 403 });

      duels[duelIndex].texts[email] = text;

      await updateFile("data/duels.json", duels, duelsFile.sha, `✍️ Texte duel de ${email}`);
      return NextResponse.json({ success: true });
    }

    // --- 5. VOTE ---
    if (action === "vote") {
      const { targetEmail, voterEmail } = body;
      const voterPath = getSafePath(voterEmail);
      const voterFile = await getFile(voterPath);
      const duelIndex = duels.findIndex(d => d.id === duelId);

      if (!voterFile || duelIndex === -1) return NextResponse.json({ error: "Données de vote invalides" }, { status: 404 });
      if (voterFile.content.li < 1) return NextResponse.json({ error: "Li insuffisants pour voter" }, { status: 400 });

      // On déduit 1 Li au votant et on ajoute le vote au duel
      voterFile.content.li -= 1;
      duels[duelIndex].votes[targetEmail] = (duels[duelIndex].votes[targetEmail] || 0) + 1;

      await updateFile(voterPath, voterFile.content, voterFile.sha, `🗳️ Vote duel ${duelId}`);
      await updateFile("data/duels.json", duels, duelsFile.sha, `📈 Score duel ${duelId}`);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (e) {
    console.error("Duel Engine Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const duelsFile = await getFile("data/duels.json");
    return NextResponse.json(duelsFile ? duelsFile.content : []);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}

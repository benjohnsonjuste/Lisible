import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

async function getFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json' },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
    return { content, sha: data.sha };
  } catch { return null; }
}

async function updateFile(path, content, sha, message) {
  const encodedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `[DUEL] ${message}`, content: encodedContent, sha })
  });
  return res.ok;
}

const getSafePath = (email) => {
  const safeEmail = email.toLowerCase().trim().replace(/@/g, '_').replace(/\./g, '_').replace(/[^a-z0-9_]/g, '');
  return `data/users/${safeEmail}.json`;
};

const getNextSundayISO = () => {
  const now = new Date();
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
  nextSunday.setHours(21, 0, 0, 0); 
  return nextSunday.toISOString();
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, duelId } = body;
    const duelsFile = await getFile("data/duels.json") || { content: [], sha: null };
    const duels = duelsFile.content;

    // --- 1. ENVOYER UN DÉFI (Utilisé par LanceurDeDuel & DuelManager) ---
    if (action === "sendChallenge" || action === "challenge") {
      const { senderEmail, targetEmail, senderName } = body;
      const targetFile = await getFile(getSafePath(targetEmail));

      if (!targetFile) return NextResponse.json({ error: "Adversaire introuvable" }, { status: 404 });

      const targetData = targetFile.content;
      if (!targetData.duelRequests) targetData.duelRequests = [];
      
      const alreadyChallenged = targetData.duelRequests.some(r => r.fromEmail === senderEmail || r.senderEmail === senderEmail);
      if (alreadyChallenged) return NextResponse.json({ error: "Défi déjà envoyé" }, { status: 400 });

      targetData.duelRequests.push({
        id: `req_${Date.now()}`,
        fromEmail: senderEmail, // Champ utilisé par DuelRequests
        fromName: senderName,   // Champ utilisé par DuelRequests
        senderEmail,            // Compatibilité
        senderName,             // Compatibilité
        date: new Date().toISOString()
      });

      await updateFile(getSafePath(targetEmail), targetData, targetFile.sha, `⚔️ Défi de ${senderName}`);
      return NextResponse.json({ success: true });
    }

    // --- 2. ACCEPTER UN DUEL (Utilisé par DuelRequests / DuelManager) ---
    if (action === "acceptChallenge" || action === "acceptDuel") {
      const { requestId, email } = body; // requestId et email de l'utilisateur actuel
      const userFile = await getFile(getSafePath(email));

      if (!userFile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      const userData = userFile.content;
      const request = (userData.duelRequests || []).find(r => r.id === requestId);
      
      if (!request) return NextResponse.json({ error: "Requête introuvable" }, { status: 404 });

      const player1 = request.fromEmail || request.senderEmail;
      const player2 = email;

      // Création de l'objet Duel
      const newDuel = {
        id: `duel_${Date.now()}`,
        date: getNextSundayISO(),
        participants: [player1, player2],
        participantNames: { [player1]: request.fromName || request.senderName, [player2]: userData.penName || userData.name },
        texts: { [player1]: "", [player2]: "" },
        votes: { [player1]: 0, [player2]: 0 },
        status: "scheduled",
        theme: "Le silence d'une plume abandonnée.",
        winner: null
      };

      // Nettoyage de la requête traitée
      userData.duelRequests = userData.duelRequests.filter(r => r.id !== requestId);

      duels.push(newDuel);
      await updateFile(getSafePath(email), userData, userFile.sha, `✅ Défi accepté vs ${player1}`);
      await updateFile("data/duels.json", duels, duelsFile.sha, `🏁 Duel programmé: ${player1} vs ${player2}`);

      return NextResponse.json({ success: true });
    }

    // --- 3. REFUSER UN DUEL ---
    if (action === "declineChallenge") {
      const { requestId, email } = body;
      const userFile = await getFile(getSafePath(email));
      if (!userFile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      userFile.content.duelRequests = (userFile.content.duelRequests || []).filter(r => r.id !== requestId);
      await updateFile(getSafePath(email), userFile.content, userFile.sha, `❌ Défi refusé`);
      return NextResponse.json({ success: true });
    }

    // --- 4. SAUVEGARDER LE TEXTE ---
    if (action === "saveDuelText") {
      const { text, email } = body;
      const duelIndex = duels.findIndex(d => d.id === duelId);

      if (duelIndex === -1) return NextResponse.json({ error: "Duel introuvable" }, { status: 404 });
      if (duels[duelIndex].status === "finished") return NextResponse.json({ error: "Duel clos" }, { status: 403 });

      duels[duelIndex].texts[email] = text;

      await updateFile("data/duels.json", duels, duelsFile.sha, `✍️ Texte mis à jour: ${email}`);
      return NextResponse.json({ success: true });
    }

    // --- 5. VOTE ---
    if (action === "vote") {
      const { targetEmail, voterEmail } = body;
      const voterFile = await getFile(getSafePath(voterEmail));
      const duelIndex = duels.findIndex(d => d.id === duelId);

      if (!voterFile || duelIndex === -1) return NextResponse.json({ error: "Données invalides" }, { status: 404 });
      if (voterFile.content.li < 1) return NextResponse.json({ error: "Li insuffisants" }, { status: 400 });

      voterFile.content.li -= 1;
      duels[duelIndex].votes[targetEmail] = (duels[duelIndex].votes[targetEmail] || 0) + 1;

      await updateFile(getSafePath(voterEmail), voterFile.content, voterFile.sha, `🗳️ Vote effectué`);
      await updateFile("data/duels.json", duels, duelsFile.sha, `📈 Score duel ${duelId}`);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const duelsFile = await getFile("data/duels.json");
  return NextResponse.json(duelsFile ? duelsFile.content : []);
}

import { NextResponse } from 'next/server';

// On importe les fonctions du fichier github-db pour garder la cohérence
// Si ces fonctions ne sont pas exportées, on utilise la logique interne
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

    // --- 1. ENVOYER UN DÉFI ---
    if (action === "sendChallenge") {
      const { senderEmail, targetEmail, senderName } = body;
      const targetFile = await getFile(getSafePath(targetEmail));

      if (!targetFile) return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 });

      const targetData = targetFile.content;
      if (!targetData.duelRequests) targetData.duelRequests = [];
      
      targetData.duelRequests.push({
        id: `req_${Date.now()}`,
        senderEmail,
        senderName,
        date: new Date().toISOString()
      });

      await updateFile(getSafePath(targetEmail), targetData, targetFile.sha, `⚔️ Défi par ${senderEmail}`);
      return NextResponse.json({ success: true });
    }

    // --- 2. ACCEPTER UN DUEL ---
    if (action === "acceptDuel") {
      const { challengeId, player1, player2 } = body;
      const p2File = await getFile(getSafePath(player2));

      if (!p2File) return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });

      const p2Data = p2File.content;
      p2Data.duelRequests = (p2Data.duelRequests || []).filter(r => r.id !== challengeId);

      const newDuel = {
        id: `duel_${Date.now()}`,
        date: getNextSundayISO(),
        participants: [player1, player2],
        texts: { [player1]: "", [player2]: "" },
        votes: { [player1]: 0, [player2]: 0 },
        status: "scheduled",
        theme: "Le silence d'une plume abandonnée.", // Fallback simple
        winner: null
      };

      duels.push(newDuel);
      await updateFile(getSafePath(player2), p2Data, p2File.sha, `✅ Défi accepté`);
      await updateFile("data/duels.json", duels, duelsFile.sha, `🏁 Duel programmé: ${player1} vs ${player2}`);

      return NextResponse.json({ success: true });
    }

    // --- 3. REFUSER UN DUEL ---
    if (action === "declineChallenge") {
      const { challengeId, player2 } = body;
      const p2File = await getFile(getSafePath(player2));
      if (!p2File) return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });

      p2File.content.duelRequests = (p2File.content.duelRequests || []).filter(r => r.id !== challengeId);
      await updateFile(getSafePath(player2), p2File.content, p2File.sha, `❌ Défi refusé`);
      return NextResponse.json({ success: true });
    }

    // --- 4. SAUVEGARDER LE TEXTE ---
    if (action === "saveDuelText") {
      const { text, email } = body;
      const duel = duels.find(d => d.id === duelId);

      if (!duel) return NextResponse.json({ error: "Duel introuvable" }, { status: 404 });
      if (duel.status === "finished") return NextResponse.json({ error: "Duel clos" }, { status: 403 });

      if (!duel.texts) duel.texts = {};
      duel.texts[email] = text;

      await updateFile("data/duels.json", duels, duelsFile.sha, `✍️ Manuscrit: ${email}`);
      return NextResponse.json({ success: true });
    }

    // --- 5. VOTE (1 Li pour voter) ---
    if (action === "vote") {
      const { targetEmail, voterEmail } = body;
      const voterFile = await getFile(getSafePath(voterEmail));
      const duel = duels.find(d => d.id === duelId);

      if (!voterFile || !duel) return NextResponse.json({ error: "Données invalides" }, { status: 404 });
      if (voterFile.content.li < 1) return NextResponse.json({ error: "Li insuffisants" }, { status: 400 });

      voterFile.content.li -= 1;
      duel.votes[targetEmail] = (duel.votes[targetEmail] || 0) + 1;

      await updateFile(getSafePath(voterEmail), voterFile.content, voterFile.sha, `🗳️ Vote effectué`);
      await updateFile("data/duels.json", duels, duelsFile.sha, `📈 Score mis à jour`);

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

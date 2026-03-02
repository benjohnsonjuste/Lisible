import { getGithubFile, saveGithubFile } from "@/lib/github-db";

// Fonction utilitaire pour calculer le prochain dimanche (21h00 Heure Haïti / 02h00 UTC)
const getNextSundayISO = () => {
  const now = new Date();
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
  nextSunday.setHours(21, 0, 0, 0); 
  return nextSunday.toISOString();
};

// Fonction pour choisir un thème aléatoire
const getRandomTheme = async () => {
  const themes = await getGithubFile("data/themes.json") || ["Le silence d'une plume abandonnée."];
  const randomIndex = Math.floor(Math.random() * themes.length);
  return themes[randomIndex];
};

export async function POST(req) {
  const body = await req.json();
  const { action, duelId } = body;

  const users = await getGithubFile("data/users.json");
  const duels = await getGithubFile("data/duels.json") || [];

  // --- 1. ENVOYER UN DÉFI (Prélève 250 Li) ---
  if (action === "sendChallenge") {
    const { senderEmail, targetEmail, senderName } = body;
    const sender = users.find(u => u.email === senderEmail);
    const target = users.find(u => u.email === targetEmail);

    if (!sender || sender.li < 250) return new Response(JSON.stringify({ error: "Li insuffisants" }), { status: 400 });

    sender.li -= 250;
    if (!target.duelRequests) target.duelRequests = [];
    target.duelRequests.push({
      id: `req_${Date.now()}`,
      senderEmail,
      senderName,
      date: new Date().toISOString()
    });

    await saveGithubFile("data/users.json", users, `⚔️ Défi lancé par ${senderEmail}`);
    return new Response(JSON.stringify({ success: true }));
  }

  // --- 2. ACCEPTER UN DUEL (Prélève 250 Li & Génère le Thème) ---
  if (action === "acceptDuel") {
    const { challengeId, player1, player2 } = body;
    const p2 = users.find(u => u.email === player2);

    if (p2.li < 250) return new Response(JSON.stringify({ error: "Li insuffisants" }), { status: 400 });

    p2.li -= 250;
    p2.duelRequests = (p2.duelRequests || []).filter(r => r.id !== challengeId);

    const newDuel = {
      id: `duel_${Date.now()}`,
      date: getNextSundayISO(),
      participants: [player1, player2],
      texts: { [player1]: "", [player2]: "" },
      votes: { [player1]: 0, [player2]: 0 },
      status: "scheduled",
      theme: await getRandomTheme(), // Le thème est scellé ici
      winner: null
    };

    duels.push(newDuel);
    await saveGithubFile("data/users.json", users);
    await saveGithubFile("data/duels.json", duels, `🏁 Duel programmé entre ${player1} et ${player2}`);

    return new Response(JSON.stringify({ success: true }));
  }

  // --- 3. REFUSER UN DUEL (Rembourse le Joueur 1) ---
  if (action === "declineChallenge") {
    const { challengeId, player1, player2 } = body;
    const p1 = users.find(u => u.email === player1);
    const p2 = users.find(u => u.email === player2);

    if (p1) p1.li += 250;
    p2.duelRequests = (p2.duelRequests || []).filter(r => r.id !== challengeId);

    await saveGithubFile("data/users.json", users, `❌ Défi refusé, remboursement de ${player1}`);
    return new Response(JSON.stringify({ success: true }));
  }

  // --- 4. FINALISER LE GAGNANT (Badge Haute Classe) ---
  if (action === "finalizeWinner") {
    const duel = duels.find(d => d.id === duelId);
    if (!duel) return new Response("Duel non trouvé", { status: 404 });

    const p1 = duel.participants[0];
    const p2 = duel.participants[1];
    const votesP1 = duel.votes[p1] || 0;
    const votesP2 = duel.votes[p2] || 0;

    let winnerId = votesP1 > votesP2 ? p1 : p2;
    if (votesP1 === votesP2) winnerId = p1; 

    const updatedUsers = users.map(u => {
      let badges = (u.badges || []).filter(b => b !== "Haute Classe");
      if (u.email === winnerId) badges.push("Haute Classe");
      return { ...u, badges };
    });

    duel.status = "finished";
    duel.winner = winnerId;

    await saveGithubFile("data/users.json", updatedUsers, `🏆 Nouveau Champion : ${winnerId}`);
    await saveGithubFile("data/duels.json", duels, `🏁 Duel ${duelId} clôturé`);

    return new Response(JSON.stringify({ success: true, winner: winnerId }));
  }

  // --- 5. VOTE UNIQUE ---
  if (action === "vote") {
    const { targetEmail, voterEmail } = body;
    const voter = users.find(u => u.email === voterEmail);
    
    if (voter.li < 1) return new Response("Pas assez de Li", { status: 400 });
    voter.li -= 1;

    const duel = duels.find(d => d.id === duelId);
    if (duel) {
      duel.votes[targetEmail] = (duel.votes[targetEmail] || 0) + 1;
    }

    await saveGithubFile("data/users.json", users);
    await saveGithubFile("data/duels.json", duels);

    return new Response(JSON.stringify({ success: true }));
  }

  return new Response("Action inconnue", { status: 400 });
}

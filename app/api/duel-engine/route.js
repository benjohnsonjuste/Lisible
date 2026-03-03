import { getGithubFile, saveGithubFile } from "@/lib/github-db";

// Fonction utilitaire pour calculer le prochain dimanche (21h00 Heure Haïti)
const getNextSundayISO = () => {
  const now = new Date();
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
  nextSunday.setHours(21, 0, 0, 0); 
  return nextSunday.toISOString();
};

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

  // --- 1. ENVOYER UN DÉFI (Gratuit désormais) ---
  if (action === "sendChallenge") {
    const { senderEmail, targetEmail, senderName } = body;
    const target = users.find(u => u.email === targetEmail);

    if (!target) return new Response("Destinataire introuvable", { status: 404 });

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

  // --- 2. ACCEPTER UN DUEL (Gratuit désormais) ---
  if (action === "acceptDuel") {
    const { challengeId, player1, player2 } = body;
    const p2 = users.find(u => u.email === player2);

    // Suppression de la vérification de Li
    p2.duelRequests = (p2.duelRequests || []).filter(r => r.id !== challengeId);

    const newDuel = {
      id: `duel_${Date.now()}`,
      date: getNextSundayISO(),
      participants: [player1, player2],
      texts: { [player1]: "", [player2]: "" },
      votes: { [player1]: 0, [player2]: 0 },
      status: "scheduled",
      theme: await getRandomTheme(), 
      winner: null
    };

    duels.push(newDuel);
    await saveGithubFile("data/users.json", users);
    await saveGithubFile("data/duels.json", duels, `🏁 Duel programmé entre ${player1} et ${player2}`);

    return new Response(JSON.stringify({ success: true }));
  }

  // --- 3. REFUSER UN DUEL ---
  if (action === "declineChallenge") {
    const { challengeId, player2 } = body;
    const p2 = users.find(u => u.email === player2);

    p2.duelRequests = (p2.duelRequests || []).filter(r => r.id !== challengeId);

    await saveGithubFile("data/users.json", users, `❌ Défi refusé par ${player2}`);
    return new Response(JSON.stringify({ success: true }));
  }

  // --- 4. FINALISER LE GAGNANT ---
  if (action === "finalizeWinner") {
    const duel = duels.find(d => d.id === duelId);
    if (!duel || duel.status === "finished") return new Response("Duel invalide", { status: 404 });

    const [p1, p2] = duel.participants;
    const votesP1 = duel.votes[p1] || 0;
    const votesP2 = duel.votes[p2] || 0;

    let winnerEmail = votesP1 > votesP2 ? p1 : p2;
    if (votesP1 === votesP2) winnerEmail = p1; 

    const winnerProfile = users.find(u => u.email === winnerEmail);
    const winnerName = winnerProfile?.penName || winnerProfile?.name || "L'Anonyme";

    const updatedUsers = users.map(u => {
      let badges = (u.badges || []).filter(b => b !== "Haute Classe");
      if (u.email === winnerEmail) {
        badges.push("Haute Classe");
        if (!u.notifications) u.notifications = [];
        u.notifications.unshift({
          id: `victory_${Date.now()}`,
          type: "victory",
          title: "👑 La Couronne est à vous",
          message: `Félicitations ! Vous avez remporté le duel contre ${winnerEmail === p1 ? p2 : p1}.`,
          date: new Date().toISOString(),
          read: false
        });
      }
      return { ...u, badges };
    });

    duel.status = "finished";
    duel.winner = winnerEmail;

    await saveGithubFile("data/users.json", updatedUsers, `🏆 Nouveau Champion : ${winnerEmail}`);
    await saveGithubFile("data/duels.json", duels, `🏁 Duel ${duelId} clôturé`);

    return new Response(JSON.stringify({ success: true, winner: winnerName }));
  }

  // --- 5. VOTE (Reste à 1 Li pour éviter le spam de votes) ---
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

import { getGithubFile, saveGithubFile } from "@/lib/github-db";

export async function POST(req) {
  const { action, duelId, winnerEmail, player1, player2 } = await req.json();

  // 1. Charger les fichiers de données depuis GitHub
  const users = await getGithubFile("data/users.json");
  const duels = await getGithubFile("data/duels.json") || [];

  // --- ACTION : FINALISER LE GAGNANT (Appelée le dimanche à 23:59) ---
  if (action === "finalizeWinner") {
    const duel = duels.find(d => d.id === duelId);
    if (!duel) return new Response("Duel non trouvé", { status: 404 });

    const p1 = duel.participants[0];
    const p2 = duel.participants[1];

    // Comparaison des votes (Nombre de clics "Voter", pas les Li cumulés)
    const votesP1 = duel.votes[p1] || 0;
    const votesP2 = duel.votes[p2] || 0;

    let winnerId = votesP1 > votesP2 ? p1 : p2;
    // En cas d'égalité, on peut décider d'un gagnant aléatoire ou aucun
    if (votesP1 === votesP2) winnerId = p1; 

    // MISE À JOUR DES UTILISATEURS (Gestion des Badges)
    const updatedUsers = users.map(u => {
      // On retire d'abord le badge "Haute Classe" à tout le monde (nettoyage hebdo)
      let badges = (u.badges || []).filter(b => b !== "Haute Classe");
      
      // On l'ajoute uniquement au nouveau gagnant
      if (u.email === winnerId) {
        badges.push("Haute Classe");
      }
      
      return { ...u, badges };
    });

    // Marquer le duel comme terminé
    duel.status = "finished";
    duel.winner = winnerId;

    // Sauvegarder les deux fichiers sur GitHub
    await saveGithubFile("data/users.json", updatedUsers, `🏆 Nouveau Champion Haute Classe : ${winnerId}`);
    await saveGithubFile("data/duels.json", duels, `🏁 Duel ${duelId} terminé`);

    return new Response(JSON.stringify({ success: true, winner: winnerId }));
  }

  // --- ACTION : VOTE UNIQUE ---
  if (action === "vote") {
    const { targetEmail, voterEmail } = await req.json();
    
    // On déduit 1 Li au votant (si tu souhaites garder cette règle)
    const voter = users.find(u => u.email === voterEmail);
    if (voter.li < 1) return new Response("Pas assez de Li", { status: 400 });
    voter.li -= 1;

    // On ajoute 1 au compteur de vote du duel
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

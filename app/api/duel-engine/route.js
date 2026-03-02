import { getGithubFile, saveGithubFile } from "@/lib/github-db";

export async function POST(req) {
  const { action, player1, player2, duelId, winnerEmail } = await req.json();

  // CHARGEMENT DES DONNÉES
  const users = await getGithubFile("data/users.json");
  const duels = await getGithubFile("data/duels.json") || [];

  // ACTION 1 : ACCEPTER ET DÉBITER (250 Li)
  if (action === "acceptDuel") {
    const p1 = users.find(u => u.email === player1);
    const p2 = users.find(u => u.email === player2);

    if (p1.li < 250 || p2.li < 250) {
      return new Response(JSON.stringify({ error: "Fonds insuffisants" }), { status: 400 });
    }

    // Débit
    p1.li -= 250;
    p2.li -= 250;

    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
    
    const newDuel = {
      id: `duel_${Date.now()}`,
      date: nextSunday.toISOString().split('T')[0],
      participants: [player1, player2],
      texts: { [player1]: "", [player2]: "" },
      votes: { [player1]: 0, [player2]: 0 },
      status: "scheduled",
      theme: ["L'exil", "Le silence des pierres", "L'aube trahie"][Math.floor(Math.random() * 3)]
    };

    duels.push(newDuel);
    await saveGithubFile("data/users.json", users);
    await saveGithubFile("data/duels.json", duels);
    
    return new Response(JSON.stringify({ success: true, duel: newDuel }));
  }

  // ACTION 2 : FIN DU DUEL ET BADGE IMMÉDIAT
  if (action === "finalizeWinner") {
    const winner = users.find(u => u.email === winnerEmail);
    // Nettoyage des anciens badges dans la communauté
    users.forEach(u => {
      u.badges = (u.badges || []).filter(b => b !== "Haute Classe");
    });
    // Attribution au nouveau champion
    if (!winner.badges) winner.badges = [];
    winner.badges.push("Haute Classe");

    await saveGithubFile("data/users.json", users);
    return new Response(JSON.stringify({ success: true }));
  }
}

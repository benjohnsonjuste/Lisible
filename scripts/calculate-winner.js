const fs = require('fs');
const path = require('path');

// Chemin vers vos fichiers utilisateurs
const usersDir = path.join(process.cwd(), 'data/users');
const outputDir = path.join(process.cwd(), 'data/awards');
const outputFile = path.join(outputDir, 'winner.json');

async function calculateWinner() {
  try {
    if (!fs.existsSync(usersDir)) {
      console.error("Le dossier data/users n'existe pas.");
      return;
    }

    const files = fs.readdirSync(usersDir).filter(f => f.endsWith('.json'));
    let topAuthor = null;
    let maxSubs = -1;

    files.forEach(file => {
      const userData = JSON.parse(fs.readFileSync(path.join(usersDir, file), 'utf8'));
      const subsCount = userData.subscribers?.length || 0;

      // Logique : Le plus d'abonnés gagne
      if (subsCount > maxSubs) {
        maxSubs = subsCount;
        topAuthor = {
          email: userData.email,
          penName: userData.penName || userData.name,
          updatedAt: new Date().toISOString()
        };
      }
    });

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputFile, JSON.stringify(topAuthor, null, 2));
    console.log(`🏆 Nouveau gagnant enregistré : ${topAuthor.penName}`);
  } catch (error) {
    console.error("Erreur lors du calcul :", error);
  }
}

calculateWinner();

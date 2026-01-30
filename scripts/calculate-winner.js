const fs = require('fs');
const path = require('path');

const usersDir = path.join(process.cwd(), 'data/users');
const outputDir = path.join(process.cwd(), 'data/awards');

async function calculateAwards() {
  try {
    if (!fs.existsSync(usersDir)) return;
    const files = fs.readdirSync(usersDir).filter(f => f.endsWith('.json'));
    
    let topAuthor = null;
    let maxSubs = -1;

    let topReader = null;
    let maxReads = -1;

    files.forEach(file => {
      const userData = JSON.parse(fs.readFileSync(path.join(usersDir, file), 'utf8'));
      
      // 1. Calcul Plume du Mois (Abonnés)
      const subsCount = userData.subscribers?.length || 0;
      if (subsCount > maxSubs) {
        maxSubs = subsCount;
        topAuthor = { email: userData.email, penName: userData.penName };
      }

      // 2. Calcul Super Reader (Lectures certifiées)
      // Note : On vérifie 'certifiedReadings' ou 'readings' selon votre structure
      const readsCount = userData.certifiedReadings?.length || userData.readings?.length || 0;
      if (readsCount > maxReads) {
        maxReads = readsCount;
        topReader = { email: userData.email, penName: userData.penName };
      }
    });

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Sauvegarde des deux résultats
    fs.writeFileSync(path.join(outputDir, 'winner.json'), JSON.stringify(topAuthor, null, 2));
    fs.writeFileSync(path.join(outputDir, 'reader.json'), JSON.stringify(topReader, null, 2));
    
    console.log("🏆 Awards mis à jour avec succès !");
  } catch (error) {
    console.error("Erreur :", error);
  }
}

calculateAwards();

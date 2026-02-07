const fs = require('fs');
const path = require('path');

// Chemins absolus pour l'environnement d'exécution (GitHub Actions)
const usersDir = path.resolve(process.cwd(), 'data/users');
const outputDir = path.resolve(process.cwd(), 'data/awards');

async function calculateAwards() {
  try {
    console.log("🔍 Analyse des utilisateurs dans :", usersDir);
    
    if (!fs.existsSync(usersDir)) {
      console.error("❌ Dossier data/users introuvable.");
      return;
    }

    const files = fs.readdirSync(usersDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.log("⚠️ Aucun fichier JSON trouvé.");
      return;
    }

    let topAuthor = null;
    let maxSubs = -1;

    let topReader = null;
    let maxReads = -1;

    files.forEach(file => {
      try {
        const filePath = path.join(usersDir, file);
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // 1. Calcul Plume du Mois (Abonnés)
        const subsCount = Array.isArray(userData.subscribers) ? userData.subscribers.length : 0;
        if (subsCount > maxSubs && subsCount > 0) {
          maxSubs = subsCount;
          topAuthor = { 
            email: userData.email, 
            penName: userData.penName || "Auteur Anonyme",
            score: subsCount,
            updatedAt: new Date().toISOString()
          };
        }

        // 2. Calcul Super Reader (Lectures certifiées)
        // Vérification des deux structures possibles (Tableau d'IDs ou Compteur)
        const readsCount = Array.isArray(userData.certifiedReadings) 
          ? userData.certifiedReadings.length 
          : (userData.stats?.totalReadings || 0);

        if (readsCount > maxReads && readsCount > 0) {
          maxReads = readsCount;
          topReader = { 
            email: userData.email, 
            penName: userData.penName || "Lecteur Passionné",
            score: readsCount,
            updatedAt: new Date().toISOString()
          };
        }
      } catch (e) {
        console.error(`Skipping ${file}: Erreur de lecture.`);
      }
    });

    // Création du dossier de sortie si inexistant
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Sauvegarde des résultats
    if (topAuthor) {
      fs.writeFileSync(path.join(outputDir, 'winner.json'), JSON.stringify(topAuthor, null, 2));
      console.log(`✨ Gagnant Auteur : ${topAuthor.penName} (${maxSubs} subs)`);
    }

    if (topReader) {
      fs.writeFileSync(path.join(outputDir, 'reader.json'), JSON.stringify(topReader, null, 2));
      console.log(`✨ Gagnant Lecteur : ${topReader.penName} (${maxReads} reads)`);
    }
    
    console.log("🏆 Awards mis à jour avec succès !");
  } catch (error) {
    console.error("🔴 Erreur fatale lors du calcul :", error);
    process.exit(1); // Force l'échec de la GitHub Action en cas d'erreur
  }
}

calculateAwards();

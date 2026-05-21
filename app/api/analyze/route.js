import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();

    if (!textChunk || textChunk.trim().length < 10) {
      return NextResponse.json(
        { error: "Le texte fourni est trop court pour être analysé." },
        { status: 400 }
      );
    }

    const cleanText = textChunk.trim();
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // 1. Détection des phrases lourdes (plus de 25 mots)
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const heavyPhrases = [];
    sentences.forEach(sentence => {
      const sentenceWords = sentence.trim().split(/\s+/);
      if (sentenceWords.length > 25) {
        heavyPhrases.push({
          text: sentence.trim().substring(0, 120) + "...",
          reason: "La phrase dépasse 25 mots. Cela brise le rythme respiratoire du lecteur et alourdit la narration.",
          suggestion: "Divisez cette proposition en deux phrases distinctes pour redonner du dynamisme."
        });
      }
    });

    // 2. Détection des adverbes en -ment et tics de langage
    const adverbRegex = /\b\w+ment\b/gi;
    const adverbsFound = cleanText.match(adverbRegex) || [];
    const adverbDensityValue = wordCount > 0 ? (adverbsFound.length / wordCount) * 100 : 0;
    
    let adverbDensityLabel = "Excellente (Prose épurée)";
    if (adverbDensityValue > 2) adverbDensityLabel = "Modérée (Quelques tics à surveiller)";
    if (adverbDensityValue > 4) adverbDensityLabel = "Élevée (Trop d'adverbes qui affaiblissent les verbes)";

    // 3. Détection des clichés littéraires courants
    const clicheDatabase = [
      { regex: /le jour où la pluie cessa/i, expr: "le jour où la pluie cessa...", alt: "Initiez l'action par un élément visuel ou sensoriel plus singulier." },
      { regex: /un silence de mort/i, expr: "un silence de mort", alt: "un silence de plomb, un calme lourd, ou décrivez un bruit infime." },
      { regex: /les larmes aux yeux/i, expr: "les larmes aux yeux", alt: "la gorge nouée, le regard fuyant, ou manifestez l'émotion par un geste." },
      { regex: /battre la chamade/i, expr: "battre la chamade", alt: "s'emballer, cogner contre ses côtes, ou marquer une apnée." },
      { regex: /perdu dans ses pensées/i, expr: "perdu dans ses pensées", alt: "le regard ancré dans le vide, immobile, absent." }
    ];

    const clichesDetected = [];
    clicheDatabase.forEach(item => {
      if (item.regex.test(cleanText)) {
        clichesDetected.push({
          expression: item.expr,
          alternative: item.alt
        });
      }
    });

    // 4. Calcul du Hook Score basé sur la variété structurelle du début
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyRichness = wordCount > 0 ? (uniqueWords.size / wordCount) * 100 : 0;
    let hookScore = Math.min(Math.round(50 + (vocabularyRichness * 0.5) - (adverbsFound.length * 2)), 98);
    if (hookScore < 30) hookScore = 35;

    // 5. Profils des éditeurs basés sur les critères textuels
    const rhythmIsShort = (wordCount / sentences.length) < 15;
    
    // Calcul Gallimard (Aime le vocabulaire riche, déteste les adverbes)
    const gallimardScore = Math.min(Math.round(vocabularyRichness * 1.2 - (adverbDensityValue * 5)), 95);
    // Calcul XO (Aime les phrases courtes et percutantes)
    const xoScore = Math.min(Math.round(rhythmIsShort ? 80 : 45 + (hookScore * 0.3)), 95);
    // Calcul Albin Michel (Équilibre romanesque)
    const albinScore = Math.min(Math.round(60 + (vocabularyRichness * 0.2)), 95);
    // Calcul Actes Sud (Originalité / Moins de clichés)
    const actesSudScore = Math.max(Math.min(Math.round(85 - (clichesDetected.length * 15)), 95), 20);

    // 6. Détermination textuelle du rythme
    let rhythmStyle = "Fluide et équilibré.";
    if (rhythmIsShort) rhythmStyle = "Haché et nerveux. Excellent pour l'action, parfois sec pour la contemplation.";
    if (!rhythmIsShort && heavyPhrases.length > 0) rhythmStyle = "Ample et descriptif, tendant parfois vers la lourdeur syntaxique.";

    // Verdict éditorial dynamique
    let editorialVerdict = "Une plume prometteuse qui possède une identité naissante. L'ensemble textuel témoigne d'une recherche rythmique qu'il faut maintenant consolider en traquant les structures automatiques.";
    if (clichesDetected.length > 2) {
      editorialVerdict = "Le texte démontre de réelles qualités narratives, mais la présence de métaphores communes affaiblit la singularité de votre voix. Retravaillez les images stylistiques.";
    } else if (heavyPhrases.length > 2) {
      editorialVerdict = "Le souffle romanesque est bien présent, mais la longueur de certaines structures bloque l'immersion du lecteur. Un travail d'élagage et de ponctuation donnera de l'impact à votre prose.";
    }

    // Reconstruction du rapport d'analyse attendu par le frontend
    const reportData = {
      metrics: {
        hookScore: hookScore,
        rhythmStyle: rhythmStyle,
        adverbDensity: adverbDensityLabel
      },
      publisherCompatibility: [
        {
          name: "Gallimard (Blanche)",
          score: gallimardScore,
          reasons: gallimardScore > 65 ? "La richesse lexicale et la profondeur des tournures conviennent à la Collection Blanche." : "Le style requiert une plus grande densité littéraire et moins d'automatismes pour la Blanche.",
          adjustmentsNeeded: "Épurez les figures de style et renforcez l'ancrage introspectif."
        },
        {
          name: "XO Éditions",
          score: xoScore,
          reasons: rhythmIsShort ? "Le rythme rapide et segmenté correspond parfaitement aux critères d'efficacité de XO." : "Le tempo actuel est trop contemplatif pour les attentes de cette maison.",
          adjustmentsNeeded: "Raccourcissez les propositions et augmentez l'immédiateté des verbes d'action."
        },
        {
          name: "Albin Michel",
          score: albinScore,
          reasons: "Un sens du romanesque se dégage des articulations narratives.",
          adjustmentsNeeded: "Donnez plus d'amplitude aux conflits internes dès les premières lignes."
        },
        {
          name: "Actes Sud",
          score: actesSudScore,
          reasons: clichesDetected.length === 0 ? "La singularité textuelle évite les sentiers battus, ce qui plaît à cette maison." : "La présence de formules figées masque l'originalité foncière de votre plume.",
          adjustmentsNeeded: "Accentuez la subjectivité de votre regard et l'atypisme des descriptions."
        }
      ],
      clichesDetected: clichesDetected,
      heavyPhrases: heavyPhrases.slice(0, 4), // On limite l'affichage aux 4 premières
      editorialVerdict: editorialVerdict
    };

    return NextResponse.json(reportData);

  } catch (error) {
    console.error("Erreur API Éditomètre Locale :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de l'analyse linguistique." },
      { status: 500 }
    );
  }
}

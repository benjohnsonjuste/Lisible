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

    const text = textChunk.trim();
    
    // ==========================================
    // --- 1. SEGMENTATION ET MESURES DE BASE ---
    // ==========================================
    const words = text.split(/[\s',’]+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;
    const averageSentenceLength = wordCount / sentenceCount;

    // AXE 1 : Temps de lecture estimé (base standard : 200 mots / minute)
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // ==========================================
    // --- 2. RYTHME ET VARIANCE SYNTAXIQUE ---
    // ==========================================
    const heavyPhrases = [];
    let shortSentencesCount = 0;
    let longSentencesCount = 0;

    sentences.forEach(sentence => {
      const currentWords = sentence.trim().split(/[\s',’]+/).filter(w => w.length > 0);
      const len = currentWords.length;
      
      if (len <= 8 && len > 0) shortSentencesCount++;
      if (len > 25) {
        longSentencesCount++;
        if (heavyPhrases.length < 4) {
          heavyPhrases.push({
            text: sentence.trim().substring(0, 130) + (sentence.trim().length > 130 ? "..." : ""),
            reason: `Longueur critique (${len} mots). Accumulation de propositions qui sature la mémoire de travail du lecteur.`,
            suggestion: "Scindez au niveau des conjonctions (car, mais, dont) ou remplacez une virgule par un point."
          });
        }
      }
    });

    let rhythmStyle = "Équilibré et fluide. Alternance naturelle entre phrases courtes et propositions amples.";
    if (longSentencesCount / sentenceCount > 0.3) {
      rhythmStyle = "Symphonique ou académique. Prédominance de phrases longues qui favorise la description, mais menace le rythme.";
    } else if (shortSentencesCount / sentenceCount > 0.4) {
      rhythmStyle = "Nerveux, staccato. Phrases courtes et percutantes idéales pour la tension, risquant parfois de manquer de liant.";
    }

    // ==========================================
    // --- 3. EXPANSION LEXICALE ET SÉMANTIQUE ---
    // ==========================================
    
    // AXE 1 & 2 : Nettoyage pour calcul TTR et détection de tics
    const cleanWordsMapped = words.map(w => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""));
    const uniqueWords = new Set(cleanWordsMapped);
    const ttr = (uniqueWords.size / (wordCount || 1)) * 100;

    // Analyse des adverbes
    let adverbDensityLabel = "Excellente (Vocabulaire pur)";
    const adverbRegex = /\b\w+ment\b/gi;
    const adverbs = text.match(adverbRegex) || [];
    const adverbRatio = (adverbs.length / (wordCount || 1)) * 100;
    
    if (adverbRatio > 1.8) adverbDensityLabel = "Modérée (Présence notable d'adverbes de manière)";
    if (adverbRatio > 3.5) adverbDensityLabel = "Saturée (Les adverbes affaiblissent l'impact des verbes)";

    // AXE 2 : Analyse des verbes béquilles (ternes)
    const weakVerbsRegex = /\b(faire|fait|faisant|fais|faisons|faites|font|avoir|a|as|ont|avez|avons|dire|dit|dis|disons|dites|disent|être|est|suis|es|sommes|êtes|sont|aller|va|vais|allons|allez|vont)\b/gi;
    const weakVerbsFound = text.match(weakVerbsRegex) || [];
    
    // AXE 1 : Coefficient de dynamicité (estimation simplifiée du ratio verbes / mots descriptifs)
    // Plus le TTR est stable et les verbes béquilles faibles, plus le style gagne en relief
    const actionCoefficient = Math.max(10, Math.min(95, Math.round(75 - (weakVerbsFound.length / (wordCount || 1)) * 100 + (shortSentencesCount * 0.8))));

    // AXE 2 : Dictionnaire enrichi de clichés, pléonasmes et tics stylistiques
    const customLexiconDatabase = [
      // Clichés originaux
      { regex: /un silence de mort/i, expr: "un silence de mort", alt: "un calme sépulcral, une absence de vibration, un silence de plomb" },
      { regex: /les larmes aux yeux/i, expr: "les larmes aux yeux", alt: "la vue brouillée, le regard brillant, les cils lourds d'humidité" },
      { regex: /battre la chamade/i, expr: "battre la chamade", alt: "s'emballer sauvagement, heurter sa cage thoracique, s'accélérer" },
      { regex: /perdu dans ses pensées/i, expr: "perdu dans ses pensées", alt: "le regard ancré dans le vide, absorbé par son architecture interne" },
      { regex: /blanc comme un linge/i, expr: "blanc comme un linge", alt: "le teint livide, les traits vidés de leur sang, blême" },
      // Pléonasmes (Axe 2)
      { regex: /monter en haut/i, expr: "monter en haut", alt: "monter, gravir, s'élever" },
      { regex: /reculer en arrière/i, expr: "reculer en arrière", alt: "reculer, se replier" },
      { regex: /savoir à l'avance/i, expr: "savoir à l'avance", alt: "savoir, pressentir" },
      { regex: /collaborer ensemble/i, expr: "collaborer ensemble", alt: "collaborer, s'associer" }
    ];

    const clichesDetected = [];
    customLexiconDatabase.forEach(item => {
      if (item.regex.test(text)) {
        clichesDetected.push({
          expression: item.expr,
          alternative: item.alt
        });
      }
    });

    // ==========================================
    // --- 4. BALANCE ET STRUCTURE NARRATIVE ---
    // ==========================================
    const dialogueMarkers = text.match(/^[ \t]*[-—–•«]/gm) || [];
    const dialogueRatio = (dialogueMarkers.length / sentenceCount) * 100;

    // ==========================================
    // --- 5. CALCULS ET COMPATIBILITÉS ---
    // ==========================================
    let scoreCalculated = 65 + (ttr * 0.3) - (adverbRatio * 4) - (heavyPhrases.length * 5) + (shortSentencesCount * 0.5);
    if (text.trim().startsWith('-') || text.trim().startsWith('—')) scoreCalculated += 5;
    const hookScore = Math.max(15, Math.min(98, Math.round(scoreCalculated)));

    const gallimardScore = Math.max(10, Math.min(97, Math.round((ttr * 1.3) - (adverbRatio * 6) - (clichesDetected.length * 4))));
    const xoScore = Math.max(10, Math.min(97, Math.round(40 + (shortSentencesCount / sentenceCount * 40) + (dialogueRatio * 0.5) - (heavyPhrases.length * 6))));
    const albinScore = Math.max(10, Math.min(97, Math.round(55 + (ttr * 0.2) - (heavyPhrases.length * 2) - (clichesDetected.length * 2))));
    const actesSudScore = Math.max(10, Math.min(97, Math.round(75 - (clichesDetected.length * 8) + (ttr * 0.2) - (xoScore * 0.1))));

    // Syntèse éditoriale
    let editorialVerdict = "Votre manuscrit démontre une solide maîtrise globale. L'architecture des phrases crée une base narrative saine qu'il s'agit maintenant d'affiner en éliminant les automatismes de langage.";
    if (clichesDetected.length >= 3) {
      editorialVerdict = "La trame narrative est perceptible, mais la présence répétée d'images figées et d'expressions communes (clichés) affaiblit la singularité de votre voix. Remplacez le prévisible par le sensoriel.";
    } else if (heavyPhrases.length >= 3) {
      editorialVerdict = "Le souffle littéraire est indéniable, mais la longueur moyenne de vos propositions ralentit la cadence et fatigue le lecteur. Travaillez la ponctuation comme une respiration pour libérer la tension de votre texte.";
    } else if (xoScore > 75 && gallimardScore < 45) {
      editorialVerdict = "Une efficacité narrative remarquable, un sens inné du rythme et de la scène. Le texte est taillé pour le roman de genre ou le thriller. Pour viser la littérature blanche, densifiez l'introspection.";
    } else if (gallimardScore > 75) {
      editorialVerdict = "Une plume d'une grande distinction textuelle. La recherche lexicale et l'harmonie des structures correspondent aux exigences des comités de lecture les plus sélectifs. Veillez simplement à ce que l'intrigue ne s'efface pas derrière le style.";
    }

    // ==========================================
    // --- AXE 3 : GÉNÉRATION DU PLAN D'ACTION ---
    // ==========================================
    const actionPlan = [];
    
    if (heavyPhrases.length > 0) {
      actionPlan.push({
        priority: "Haute",
        target: "Architecture rythmique",
        instruction: `Scinder les ${heavyPhrases.length} phrases complexes identifiées pour aérer l'ossature générale du texte.`
      });
    }
    
    if (clichesDetected.length > 0) {
      actionPlan.push({
        priority: "Modérée",
        target: "Originalité stylistique",
        instruction: `Substituer les expressions figées (${clichesDetected.length} trouvées) par des formulations métaphoriques propres à votre plume.`
      });
    }

    if (weakVerbsFound.length / wordCount > 0.05) {
      actionPlan.push({
        priority: "Optimisation",
        target: "Précision lexicale",
        instruction: `Remplacer les verbes béquilles récurrents (${weakVerbsFound.length} occurrences de être/avoir/faire) par des verbes d'action spécifiques.`
      });
    }

    // Si le texte est très pur
    if (actionPlan.length === 0) {
      actionPlan.push({
        priority: "Entretien",
        target: "Continuité narrative",
        instruction: "Poursuivre sur cette trajectoire d'écriture. Le niveau d'épuration stylistique actuel est optimal."
      });
    }

    // ==========================================
    // --- 9. RETOUR DU RAPPORT ENRICHI ---
    // ==========================================
    return NextResponse.json({
      metrics: {
        hookScore: hookScore,
        rhythmStyle: rhythmStyle,
        adverbDensity: adverbDensityLabel,
        // Données quantitatives Axe 1 injectées de manière transparente
        vocabularyRichness: Math.round(ttr),
        readingTime: readingTimeMinutes,
        dynamicCoefficient: actionCoefficient,
        weakVerbsCount: weakVerbsFound.length
      },
      publisherCompatibility: [
        {
          name: "Gallimard (Blanche)",
          score: gallimardScore,
          reasons: gallimardScore > 70 ? "Richesse lexicale remarquable et pureté de la prose adaptées à la haute exigence stylistique de la Blanche." : "Manque encore de densité introspective ou d'originalité lexicale pour cette collection.",
          adjustmentsNeeded: "Traquez les tics de langage et privilégiez la profondeur psychologique à l'efficacité brute."
        },
        {
          name: "XO Éditions",
          score: xoScore,
          reasons: xoScore > 70 ? "Structure nerveuse, sens du tempo et immédiateté narrative calibrés pour le grand public et le thriller." : "Rythme trop ample ou contemplatif, risquant d'atténuer la tension dramatique exigée.",
          adjustmentsNeeded: "Augmentez le ratio de verbes d'action, réduisez les modalisateurs et élaguez les descriptions."
        },
        {
          name: "Albin Michel",
          score: albinScore,
          reasons: "Équilibre classique et maîtrise narrative capables de porter un grand destin ou un roman de société accessible.",
          adjustmentsNeeded: "Donnez plus de relief aux transitions narratives et intensifiez les enjeux de la scène dès son ouverture."
        },
        {
          name: "Actes Sud",
          score: actesSudScore,
          reasons: actesSudScore > 70 ? "La singularité de la voix évite les schémas traditionnels, ouvrant la porte à une identité littéraire affirmée." : "Le recours à des structures ou des expressions communes masque l'originalité du propos.",
          adjustmentsNeeded: "Accentuez la subjectivité esthétique, bannissez les métaphores usées et osez l'atypisme."
        }
      ],
      clichesDetected: clichesDetected,
      heavyPhrases: heavyPhrases,
      editorialVerdict: editorialVerdict,
      // Injection de la feuille de route Axe 3
      actionPlan: actionPlan
    });

  } catch (error) {
    console.error("Erreur Audit Éditomètre Suprême :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de l'analyse structurelle du texte." },
      { status: 500 }
    );
  }
}

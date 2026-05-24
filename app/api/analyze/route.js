import { NextResponse } from 'next/server';
export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk || textChunk.trim().length < 10) {
      return NextResponse.json({ error: "Le texte fourni est trop court pour extraire une matrice syntaxique." }, { status: 400 });
    }
    const text = textChunk.trim();
    const words = text.split(/[\s',’]+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
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
            reason: `Surcharge gravitationnelle (${len} mots). L'accumulation de propositions sature la mémoire immédiate du lecteur.`,
            suggestion: "Appliquez le filtre d'érosion textuelle. Scindez au niveau des articulations logiques pour libérer le souffle."
          });
        }
      }
    });
    let rhythmStyle = "Spectre synesthésique équilibré. Les vibrations chromatiques alternent harmonieusement entre éclats percutants et nappes fluides.";
    if (longSentencesCount / sentenceCount > 0.3) {
      rhythmStyle = "Teinte harmonique à dominance nocturne et contemplative. La prose déploie des ondes amples qui privilégient l'immersion, au risque d'engourdir la vélocité.";
    } else if (shortSentencesCount / sentenceCount > 0.4) {
      rhythmStyle = "Teinte harmonique incandescente et staccato. Les pulsations nerveuses maximisent la tension biomécanique, au détriment du liant poétique.";
    }
    const cleanWordsMapped = words.map(w => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""));
    const uniqueWords = new Set(cleanWordsMapped);
    const ttr = (uniqueWords.size / (wordCount || 1)) * 100;
    let adverbDensityLabel = "Optimale (Filtre d'érosion pur, aucune cheville syntaxique superflue)";
    const adverbRegex = /\b\w+ment\b/gi;
    const adverbs = text.match(adverbRegex) || [];
    const adverbRatio = (adverbs.length / (wordCount || 1)) * 100;
    if (adverbRatio > 1.8) adverbDensityLabel = "Pression modérée (Présence notable de scories de liaison qui ralentissent le flux)";
    if (adverbRatio > 3.5) adverbDensityLabel = "Saturation critique (L'accumulation d'adverbes alourdit la masse textuelle et affaiblit les verbes actifs)";
    const weakVerbsRegex = /\b(faire|fait|faisant|fais|faisons|faites|font|avoir|a|as|ont|avez|avons|dire|dit|dis|disons|dites|disent|être|est|suis|es|sommes|êtes|sont|aller|va|vais|allons|allez|vont)\b/gi;
    const weakVerbsFound = text.match(weakVerbsRegex) || [];
    const actionCoefficient = Math.max(10, Math.min(95, Math.round(75 - (weakVerbsFound.length / (wordCount || 1)) * 100 + (shortSentencesCount * 0.8))));
    const customLexiconDatabase = [
      { regex: /un silence de mort/i, expr: "un silence de mort", alt: "un calme sépulcral, une absence de vibration, un silence de plomb" },
      { regex: /les larmes aux yeux/i, expr: "les larmes aux yeux", alt: "la vue brouillée, le regard brillant, les cils lourds d'humidité" },
      { regex: /battre la chamade/i, expr: "battre la chamade", alt: "s'emballer sauvagement, heurter sa cage thoracique, s'accélérer" },
      { regex: /perdu dans ses pensées/i, expr: "perdu dans ses pensées", alt: "le regard ancré dans le vide, absorbé par son architecture interne" },
      { regex: /blanc comme un linge/i, expr: "blanc comme un linge", alt: "le teint livide, les traits vidés de leur sang, blême" },
      { regex: /monter en haut/i, expr: "monter en haut", alt: "monter, gravir, s'élever" },
      { regex: /reculer en arrière/i, expr: "reculer en arrière", alt: "reculer, se replier" },
      { regex: /savoir à l'avance/i, expr: "savoir à l'avance", alt: "savoir, pressentir" },
      { regex: /collaborer ensemble/i, expr: "collaborer ensemble", alt: "collaborer, s'associer" }
    ];
    const clichesDetected = [];
    customLexiconDatabase.forEach(item => {
      if (item.regex.test(text)) {
        clichesDetected.push({ expression: item.expr, alternative: item.alt });
      }
    });
    const dialogueMarkers = text.match(/^[ \t]*[-—–•«]/gm) || [];
    const dialogueRatio = (dialogueMarkers.length / sentenceCount) * 100;
    let scoreCalculated = 65 + (ttr * 0.3) - (adverbRatio * 4) - (heavyPhrases.length * 5) + (shortSentencesCount * 0.5);
    if (text.trim().startsWith('-') || text.trim().startsWith('—')) scoreCalculated += 5;
    const hookScore = Math.max(15, Math.min(98, Math.round(scoreCalculated)));
    const gallimardScore = Math.max(10, Math.min(97, Math.round((ttr * 1.3) - (adverbRatio * 6) - (clichesDetected.length * 4))));
    const xoScore = Math.max(10, Math.min(97, Math.round(40 + (shortSentencesCount / sentenceCount * 40) + (dialogueRatio * 0.5) - (heavyPhrases.length * 6))));
    const albinScore = Math.max(10, Math.min(97, Math.round(55 + (ttr * 0.2) - (heavyPhrases.length * 2) - (clichesDetected.length * 2))));
    const actesSudScore = Math.max(10, Math.min(97, Math.round(75 - (clichesDetected.length * 8) + (ttr * 0.2) - (xoScore * 0.1))));
    let editorialVerdict = "L'architecture structurelle démontre une solide assise biomécanique. La matrice des phrases crée un ancrage sain qu'il convient désormais d'épurer en éliminant les scories syntaxiques automatisées.";
    if (clichesDetected.length >= 3) {
      editorialVerdict = "L'empreinte narrative est perceptible, mais la présence répétée d'images figées abaisse l'indice de pureté singulière. Remplacez le prévisible historique par des collisions sensorielles inédites.";
    } else if (heavyPhrases.length >= 3) {
      editorialVerdict = "La puissance du souffle est indéniable, mais la masse gravitationnelle de vos propositions ralentit la vélocité et sature la rétention du lecteur. Utilisez la ponctuation comme levier de décompression.";
    } else if (xoScore > 75 && gallimardScore < 45) {
      editorialVerdict = "Une vélocité et une efficacité biomécanique remarquables. Le rythme verbal possède une force d'impact idéale pour les structures narratives à haute tension. Pour la haute littérature blanche, densifiez l'introspection.";
    } else if (gallimardScore > 75) {
      editorialVerdict = "Une prose dotée d'une magnifique résonance lexicale et d'une pureté singulière élevée. L'harmonie des structures répond aux critères sélectifs des comités de lecture les plus exigeants. Maintenez l'équilibre avec l'intrigue active.";
    }
    const actionPlan = [];
    if (heavyPhrases.length > 0) {
      actionPlan.push({
        priority: "Haute",
        target: "Décompression gravitationnelle",
        instruction: `Alléger les ${heavyPhrases.length} segments de forte densité identifiés pour restituer l'amplitude et la respiration naturelle du texte.`
      });
    }
    if (clichesDetected.length > 0) {
      actionPlan.push({
        priority: "Modérée",
        target: "Pureté singulière",
        instruction: `Substituer les images usées (${clichesDetected.length} clichés répertoriés) par des associations lexicales inédites et hautement mémorables.`
      });
    }
    if (weakVerbsFound.length / wordCount > 0.05) {
      actionPlan.push({
        priority: "Optimisation",
        target: "Précision bio-mécanique",
        instruction: `Éliminer les scories de liaison et verbes ternes (${weakVerbsFound.length} occurrences de être/avoir/faire) au profit de verbes d'action à forte charge cinétique.`
      });
    }
    if (actionPlan.length === 0) {
      actionPlan.push({
        priority: "Entretien",
        target: "Continuité de flux",
        instruction: "Maintenir la dynamique d'écriture actuelle. Le coefficient d'érosion textuelle et la fraîcheur des métaphores sont optimaux."
      });
    }
    return NextResponse.json({
      metrics: {
        hookScore: hookScore,
        rhythmStyle: rhythmStyle,
        adverbDensity: adverbDensityLabel,
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
      actionPlan: actionPlan
    });
  } catch (error) {
    console.error("Erreur Moteur Ingénierie Narrative :", error);
    return NextResponse.json({ error: "Une erreur interne est survenue lors de l'extraction matricielle du texte." }, { status: 500 });
  }
}

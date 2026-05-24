import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();

    // 1. Validation de la chaîne de texte entrante
    if (!textChunk || textChunk.trim().length < 10) {
      return NextResponse.json(
        { error: "Texte trop court pour exécuter l'audit macro-stylistique." },
        { status: 400 }
      );
    }

    const text = textChunk.trim();
    const words = text.split(/[\s',’]+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;

    // 2. Analyse de la structure des phrases et du souffle narratif
    const heavyPhrases = [];
    let shortSentences = 0;
    let longSentences = 0;

    sentences.forEach(s => {
      const len = s.trim().split(/[\s',’]+/).filter(w => w.length > 0).length;
      
      if (len <= 8 && len > 0) {
        shortSentences++;
      }
      
      if (len > 25) {
        longSentences++;
        if (heavyPhrases.length < 4) {
          heavyPhrases.push({
            text: s.trim().substring(0, 130) + (s.trim().length > 130 ? "..." : ""),
            reason: `Surcharge (${len} mots). Accumulation de propositions complexes.`,
            suggestion: "Scindez cette structure pour redonner de l'impact au rythme."
          });
        }
      }
    });

    // 3. Calculs lexicaux : Diversité, Adverbes et Verbes Ternes
    const cleanWords = words.map(w => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
    const ttr = (new Set(cleanWords).size / (wordCount || 1)) * 100;
    const vocabularyRichness = Math.round(ttr);

    const adverbs = (text.match(/\b\w+ment\b/gi) || []).length;
    const adverbRatio = (adverbs / (wordCount || 1)) * 100;

    const weakVerbs = (text.match(/\b(faire|fait|faisant|fais|avoir|a|as|ont|avez|dire|dit|être|est|suis|sommes|sont|aller|va|vais)\b/gi) || []).length;
    const actionCoef = Math.max(10, Math.min(95, Math.round(75 - (weakVerbs / (wordCount || 1)) * 100 + (shortSentences * 0.8))));

    // 4. Détection des clichés et automatisation des alternatives stylistiques
    const clichesDb = [
      { regex: /un silence de mort/i, expr: "un silence de mort", alt: "un calme sépulcral, une absence de vibration" },
      { regex: /les larmes aux yeux/i, expr: "les larmes aux yeux", alt: "le regard brillant, la vue brouillée" },
      { regex: /battre la chamade/i, expr: "battre la chamade", alt: "s'emballer sauvagement" },
      { regex: /perdu dans ses pensées/i, expr: "perdu dans ses pensées", alt: "le regard ancré dans le vide" },
      { regex: /blanc comme un linge/i, expr: "blanc comme un linge", alt: "le teint livide, les traits blêmes" }
    ];

    const clichesDetected = [];
    clichesDb.forEach(item => {
      if (item.regex.test(text)) {
        clichesDetected.push({
          expression: item.expr,
          alternative: item.alt
        });
      }
    });

    // 5. Qualification harmonique de la synesthésie du texte
    let rhythmLabel = "Spectre synesthésique équilibré.";
    if (longSentences / sentenceCount > 0.3) {
      rhythmLabel = "Teinte harmonique contemplative. Prose à ondes amples.";
    } else if (shortSentences / sentenceCount > 0.4) {
      rhythmLabel = "Teinte harmonique incandescente et staccato.";
    }

    // 6. Algorithme de simulation d'acceptation en comités d'édition
    const gallimardScore = Math.max(10, Math.min(97, Math.round((ttr * 1.4) - (weakVerbs * 0.8))));
    const xoScore = Math.max(10, Math.min(97, Math.round(actionCoef + 10)));
    const albinScore = Math.max(10, Math.min(97, Math.round(55 + (ttr * 0.2))));

    let verdict = "La structure narrative possède une assise biomécanique solide.";
    if (gallimardScore > 72) {
      verdict = "Magnifique résonance lexicale. L'harmonie générale répond aux critères exigeants de la collection Blanche.";
    } else if (xoScore > 75) {
      verdict = "Vélocité et efficacité narrative remarquables. Idéal pour les intrigues à haute tension.";
    }

    const publisherCompatibility = [
      {
        name: "Gallimard (Blanche)",
        score: gallimardScore,
        reasons: gallimardScore > 70 ? "Excellente densité lexicale introspective." : "Prose encore trop linéaire pour les exigences de la Blanche.",
        adjustmentsNeeded: "Travaillez l'originalité des métaphores et l'implicite."
      },
      {
        name: "XO Éditions",
        score: xoScore,
        reasons: xoScore > 70 ? "Rythme cardiaque élevé, tempo calibré pour l'efficacité dramatique." : "Manque de cinétique verbeuse pour l'impact grand public.",
        adjustmentsNeeded: "Augmentez le ratio de verbes d'action et réduisez les temps morts."
      },
      {
        name: "Albin Michel",
        score: albinScore,
        reasons: "Équilibre classique capable de séduire un large public de roman de société.",
        adjustmentsNeeded: "Donnez plus de relief et d'aspérités psychologiques aux personnages."
      }
    ];

    // 7. Génération de la feuille de route stratégique (Plan d'action)
    const actionPlan = [
      {
        target: "Stylistique",
        priority: adverbRatio > 2.5 || weakVerbs > 8 ? "Haute" : "Modérée",
        instruction: adverbRatio > 2.5 
          ? "Réduisez drastiquement les adverbes en -ment pour dynamiser et resserrer la prose." 
          : "Densité adverbiale sous contrôle. Surveillez l'équilibre des verbes ternes."
      },
      {
        target: "Structure",
        priority: heavyPhrases.length > 2 ? "Haute" : "Basse",
        instruction: heavyPhrases.length > 2 
          ? "Scindez vos phrases de plus de 25 mots pour éviter l'érosion et l'asphyxie du souffle dramatique." 
          : "Bonne gestion des respirations syntactiques et des silences mécaniques."
      },
      {
        target: "Vocabulaire",
        priority: vocabularyRichness < 45 ? "Haute" : "Basse",
        instruction: vocabularyRichness < 45 
          ? "Enrichissez le lexique global en remplaçant les verbes pivots (faire, avoir) par des substituts immersifs." 
          : "Diversité lexicale satisfaisante. Identité textuelle marquée."
      }
    ];

    // 8. Retour de la réponse JSON unifiée
    return NextResponse.json({
      metrics: {
        hookScore: Math.max(15, Math.min(98, Math.round(65 + (ttr * 0.3) - (adverbRatio * 4)))),
        rhythmStyle: rhythmLabel,
        adverbDensity: adverbRatio > 2.5 ? "Pression modérée. Traquez les tics." : "Optimale. Équilibre parfait.",
        vocabularyRichness: vocabularyRichness,
        readingTime: Math.max(1, Math.ceil(wordCount / 200)),
        dynamicCoefficient: actionCoef,
        weakVerbsCount: weakVerbs
      },
      clichesDetected,
      heavyPhrases,
      publisherCompatibility,
      editorialVerdict: verdict,
      actionPlan
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Erreur interne lors de l'exécution du pipeline d'ingénierie éditoriale." },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk) return NextResponse.json({ error: "Texte manquant" }, { status: 400 });

    const text = textChunk.trim();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const totalWords = text.split(/\s+/).length;
    const avgSentenceLength = totalWords / (sentences.length || 1);

    // 1. Détection des marqueurs stylistiques pré-XIXe siècle
    const classicalMarkers = {
      // Structure de sentence morale / Maxime (Siècle des Lumières / Moralistes)
      maxims: /(quiconque|tout homme|la raison|la vertu|les hommes|le vice|naturellement|souvent|presque toujours)/gi,
      // Lexique tragique / Grand Siècle (XVIIe)
      classicalTragic: /(le destin|les cieux|le sang|l'honneur|le courroux|la fureur|la foi|l'arrêt|périr|fléchir)/gi,
      // Conjonctions de coordination à haute densité logique (Période rhétorique)
      rhetoricalConnectors: /(car enfin|or,|néanmoins|c'est pourquoi|par quoi|ensorte que|dès lors que)/gi
    };

    const maximCount = (text.match(classicalMarkers.maxims) || []).length;
    const tragicCount = (text.match(classicalMarkers.classicalTragic) || []).length;
    const connectorCount = (text.match(classicalMarkers.rhetoricalConnectors) || []).length;

    // 2. Algorithme de projection de parenté littéraire
    let primaryAncestor = { name: "Molière", century: "XVIIe", matchRate: 45, archetype: "L'Ironie Satirique & Vivacité" };
    let secondaryAncestor = { name: "Voltaire", century: "XVIIIe", matchRate: 35, archetype: "Le Conte Philosophique & Clarté" };
    
    // Évaluation des profils de plumes classiques
    if (avgSentenceLength > 35 && connectorCount > 2) {
      primaryAncestor = {
        name: "Jacques-Bénigne Bossuet",
        century: "XVIIe",
        matchRate: Math.min(98, Math.round(50 + (avgSentenceLength * 1.2))),
        archetype: "L'Éloquence Oratoire & Périodes Nobles",
        analysis: "Votre écriture possède l'ampleur des grands sermons classiques. Vos phrases se déploient avec un balancement majestueux et une rigueur architecturale rare au format numérique."
      };
      secondaryAncestor = {
        name: "Jean de La Bruyère",
        century: "XVIIe",
        matchRate: 58,
        archetype: "Le Portrait Ciselé & Critique des Mœurs"
      };
    } else if (maximCount > 2 || text.includes("ne saurait")) {
      primaryAncestor = {
        name: "François de La Rochefoucauld",
        century: "XVIIe",
        matchRate: Math.min(95, Math.round(60 + (maximCount * 10))),
        archetype: "La Maxime Ciselée & Lucidité Psychologique",
        analysis: "Votre plume tend vers la formule concise, la sentence morale et l'observation tranchante des replis de l'âme humaine. C'est l'héritage direct de la tradition des moralistes."
      };
      secondaryAncestor = {
        name: "Denis Diderot",
        century: "XVIIIe",
        matchRate: 64,
        archetype: "La Digression Libre & Dynamisme Révolutionnaire"
      };
    } else if (tragicCount > 1) {
      primaryAncestor = {
        name: "Jean Racine",
        century: "XVIIe",
        matchRate: Math.min(92, Math.round(55 + (tragicCount * 12))),
        archetype: "La Tragédie Classique & Pureté Émotionnelle",
        analysis: "Une tension dramatique épurée traverse vos lignes. Le choix des termes évoque le dilemme cornélien et l'implacabilité de la fatalité racinienne, privilégiant la force interne à l'artifice."
      };
      secondaryAncestor = {
        name: "Madame de La Fayette",
        century: "XVIIe",
        matchRate: 70,
        archetype: "L'Analyse Psychologique Analytique"
      };
    } else {
      // Profil par défaut axé sur la clarté critique du XVIIIe
      primaryAncestor.analysis = "Votre style privilégie l'esprit, l'efficacité de la phrase courte et incisive, et une ironie sous-jacente qui rappelle les pamphlets et contes philosophiques du siècle des Lumières.";
    }

    return NextResponse.json({
      ancestors: {
        primary: primaryAncestor,
        secondary: secondaryAncestor
      },
      metrics: {
        rhetoricalDensity: Math.min(100, Math.round(((connectorCount + maximCount) / totalWords) * 1000)),
        sentenceComplexity: avgSentenceLength > 28 ? "Complexe (Périodique)" : "Directe (Linéaire)"
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Échec de l'extraction généalogique." }, { status: 500 });
  }
}

"use client";

import { useState, useEffect } from "react";
import { Newspaper, X, CalendarDays, Trophy, Sparkles, Tag } from "lucide-react";

const ARTICLES = [
  {
    id: "record-mondial-ben-johnson-juste",
    category: "Record mondial",
    title: "Record mondial : Ben Johnson Juste entre dans l'histoire de la poésie",
    date: "23 septembre 2026",
    image: "/actualites/record-poesie-qr.webp",
    excerpt:
      "Le médecin, écrivain et éditeur haïtien Ben Johnson Juste vient d'être homologué par le Record Holders Republic pour le plus long recueil de poèmes avec codes QR : « Zéphyr », 27 pages, 20 poèmes, 20 illustrations.",
    facts: [
      ["Organisme", "Record Holders Republic (RHR) — registre officiel des records mondiaux"],
      ["Catégorie", "QR Poetry"],
      ["Œuvre", "« Zéphyr » — 27 pages, 20 poèmes, 20 illustrations"],
      ["Tirage", "5 exemplaires dans le monde"],
      ["Homologation", "2026"],
    ],
    body: [
      "Le nom de Ben Johnson Juste figure désormais sur la liste officielle des détenteurs de records mondiaux du Record Holders Republic, dans la catégorie « QR Poetry ». Une consécration qui place la poésie haïtienne sur la carte mondiale des records officiellement homologués.",
      "L'œuvre à l'origine de ce record s'intitule « Zéphyr » : un recueil de 27 pages réunissant 20 poèmes et 20 illustrations. Chaque poème est relié à un code QR qui prolonge l'expérience de lecture, faisant de ce livre un pont inédit entre la poésie imprimée et le numérique.",
      "L'édition est ultra-limitée : seuls 5 exemplaires de ce format existent dans le monde. Chacun est vendu avec le certificat d'authenticité de l'œuvre et le certificat officiel du record, tous deux signés de la main de l'auteur.",
      "Ben Johnson Juste est médecin, écrivain et éditeur haïtien. Il est le CEO du label littéraire La Belle Littéraire et le fondateur de Lisible, la plateforme de streaming littéraire qui porte les voix des plumes d'aujourd'hui.",
      "Ce record mondial illustre la vision qui anime tout son travail : faire entrer la littérature, et particulièrement la poésie, dans une ère nouvelle où le livre dialogue avec la technologie sans rien perdre de son âme.",
    ],
  },
  {
    id: "prix-roman-fnac-2026",
    category: "Prix littéraires",
    title: "Thélyson Orélien remporte le Prix du Roman Fnac 2026",
    date: "21 septembre 2026",
    image: "/actualites/prix-roman-fnac.webp",
    excerpt:
      "L'écrivain haïtien Thélyson Orélien a remporté la 25e édition du Prix du Roman Fnac avec « C'était ça ou mourir » (Grasset), le parcours poignant d'un professeur contraint à l'exil.",
    facts: [
      ["Lauréat", "Thélyson Orélien"],
      ["Roman", "« C'était ça ou mourir » (Grasset)"],
      ["Édition", "25e édition du Prix du Roman Fnac"],
      ["Jury", "400 libraires Fnac et 400 adhérents"],
      ["Proclamation", "21 septembre 2026, Paris"],
    ],
    body: [
      "Le Prix du Roman Fnac 2026 a été décerné le 21 septembre à Thélyson Orélien pour son roman « C'était ça ou mourir », publié chez Grasset. Créé en 2002, ce prix est attribué par un jury de 400 libraires Fnac et 400 adhérents.",
      "Le roman suit Jonas Dorléon, professeur d'histoire contraint de fuir Haïti après l'incendie de son quartier. Armé d'un diplôme, de quelques poèmes et de la photo de sa mère, le personnage traverse la République dominicaine puis le Mexique dans l'espoir de rejoindre le Québec.",
      "Salué pour son écriture à la fois poétique et âpre, le livre s'inscrit dans une tradition littéraire haïtienne attentive aux trajectoires migratoires, sans jamais verser dans le pathos.",
      "Thélyson Orélien succède à l'écrivain irlandais John Boyne, lauréat 2025 pour « Les Éléments ». Son roman figure également dans plusieurs sélections de la rentrée 2026, notamment celles du Goncourt, du Renaudot, du Médicis, du Femina et du Prix Décembre : une entrée remarquée dans le paysage littéraire francophone.",
    ],
  },
  {
    id: "prix-meduse-2026",
    category: "Prix littéraires",
    title: "Prix Méduse 2026 : Thélyson Orélien, premier lauréat de la rentrée",
    date: "Septembre 2026",
    image: "/actualites/prix-meduse.webp",
    excerpt:
      "Pour sa cinquième édition, le Prix Méduse a couronné le premier roman de Thélyson Orélien, « C'était ça ou mourir », donnant le coup d'envoi symbolique de la saison des prix littéraires.",
    facts: [
      ["Lauréat", "Thélyson Orélien — « C'était ça ou mourir »"],
      ["Édition", "5e édition du Prix Méduse"],
      ["Dotation", "5 000 euros et une œuvre originale de Nicolas Lefebvre"],
      ["Finalistes", "« Les fils du Kapokier » (Jean-Philippe Louis, Gallimard) et « Abdallah superstar » (Iman Ahmed, Actes Sud)"],
    ],
    body: [
      "La rentrée littéraire tient déjà son premier grand vainqueur : le Prix Méduse vient de distinguer un premier roman consacré à l'exil, donnant le coup d'envoi symbolique d'une saison éditoriale particulièrement dense.",
      "Pour sa cinquième édition, le jury a récompensé l'écrivain haïtien Thélyson Orélien pour « C'était ça ou mourir », publié initialement au Québec par les Éditions du Boréal avant sa sortie en France chez Grasset.",
      "Le jury a préféré ce texte à deux autres premiers romans finalistes, « Les fils du Kapokier » de Jean-Philippe Louis (Gallimard) et « Abdallah superstar » d'Iman Ahmed (Actes Sud), preuve que la concurrence était vive dès les premières semaines de la rentrée.",
      "Le lauréat repart avec une dotation de 5 000 euros et une œuvre originale de l'artiste Nicolas Lefebvre. Cette récompense ouvre officiellement le bal des prix littéraires qui vont rythmer l'automne, plusieurs semaines avant les verdicts très attendus de novembre.",
    ],
  },
  {
    id: "goncourt-2026-premiere-selection",
    category: "Prix littéraires",
    title: "Prix Goncourt 2026 : la première sélection dévoile 16 romans",
    date: "2 septembre 2026",
    image: "/actualites/goncourt-selection.webp",
    excerpt:
      "L'Académie Goncourt a communiqué le 2 septembre sa première sélection : seize romans en lice pour le plus prestigieux des prix littéraires français.",
    facts: [
      ["1re sélection", "2 septembre 2026 — 16 romans"],
      ["2e sélection", "6 octobre 2026"],
      ["3e sélection", "27 octobre 2026 — 4 finalistes"],
      ["Proclamation", "3 novembre 2026, restaurant Drouant, Paris"],
      ["Éditeurs", "Gallimard place 4 romans ; Albin Michel et Grasset, 2 chacun"],
    ],
    body: [
      "Le prix Goncourt demeure, pour les éditeurs comme pour les libraires, le rendez-vous le plus scruté de l'automne : au-delà de la reconnaissance littéraire, il continue de générer les ventes les plus significatives de la saison pour l'ouvrage primé.",
      "L'Académie Goncourt a communiqué sa première sélection le mercredi 2 septembre 2026, retenant seize romans. Gallimard est l'éditeur le plus représenté avec quatre romans dans la liste, devant Albin Michel et Grasset qui en comptent chacun deux.",
      "Le nom du lauréat sera dévoilé le 3 novembre 2026 au restaurant Drouant, à Paris, à l'issue d'une deuxième sélection le 6 octobre et d'une troisième le 27 octobre qui désignera quatre finalistes.",
    ],
  },
  {
    id: "prix-litteraire-le-monde-2026",
    category: "Prix littéraires",
    title: "Polina Panassenko reçoit le Prix littéraire Le Monde 2026",
    date: "3 septembre 2026",
    image: "/actualites/prix-litteraire-monde.webp",
    excerpt:
      "Le quatorzième Prix littéraire Le Monde a été attribué le 3 septembre à Polina Panassenko pour son roman « À voix haute » (L'Olivier).",
    facts: [
      ["Lauréate", "Polina Panassenko"],
      ["Roman", "« À voix haute » (Éditions L'Olivier)"],
      ["Édition", "14e Prix littéraire Le Monde"],
      ["Attribution", "Jeudi 3 septembre 2026"],
    ],
    body: [
      "Le quatorzième Prix littéraire Le Monde a été attribué, jeudi 3 septembre 2026, à Polina Panassenko pour son roman « À voix haute », publié aux Éditions L'Olivier.",
      "Ce prix, instauré en 2013, récompense chaque année un roman francophone parmi les nouveautés de la rentrée, en tenant compte de ses qualités littéraires et de la vision du monde qu'il propose.",
      "Depuis sa création, le Prix littéraire Le Monde est devenu un repère incontournable dans le paysage littéraire francophone, mettant en lumière des œuvres qui interrogent et enrichissent le débat culturel.",
      "La consécration de Polina Panassenko témoigne de l'engagement des jurés à promouvoir des récits qui résonnent avec les préoccupations sociétales actuelles.",
    ],
  },
  {
    id: "calendrier-prix-litteraires-automne-2026",
    category: "Guide",
    title: "Automne 2026 : le calendrier complet des prix littéraires",
    date: "Septembre 2026",
    image: "/actualites/calendrier-prix-automne.webp",
    excerpt:
      "Goncourt, Renaudot, Femina, Médicis, Académie française… Retrouvez toutes les dates clés de la saison des prix littéraires de l'automne 2026.",
    facts: [
      ["Prix du Roman Fnac", "21 septembre 2026 — décerné à Thélyson Orélien"],
      ["Prix Décembre", "27 octobre 2026"],
      ["Grand Prix du roman de l'Académie française", "29 octobre 2026"],
      ["Prix Médicis", "2 novembre 2026"],
      ["Prix Goncourt", "3 novembre 2026"],
      ["Prix Renaudot", "3 novembre 2026"],
      ["Prix Femina", "4 novembre 2026"],
      ["Prix Interallié", "18 novembre 2026"],
      ["Prix Goncourt des Lycéens", "26 novembre 2026"],
    ],
    body: [
      "La saison des prix littéraires bat son plein. Après les premières sélections de septembre — Goncourt, Renaudot, Femina, Médicis — et les premiers lauréats déjà connus (Prix du Roman Fnac, Prix Méduse, Prix littéraire Le Monde), voici les dates à retenir pour l'automne.",
      "Le Grand Prix du roman de l'Académie française sera proclamé le 29 octobre, après deux sélections les 1er et 15 octobre. Le Prix Décembre suivra le 27 octobre, puis le Prix Médicis le 2 novembre.",
      "Le 3 novembre sera la journée la plus dense : le Prix Goncourt et le Prix Renaudot seront proclamés le même jour, le premier au restaurant Drouant à Paris. Le Prix Femina clôturera cette semaine décisive le 4 novembre.",
      "La saison se poursuivra avec le Prix Interallié le 18 novembre et le Prix Goncourt des Lycéens le 26 novembre, qui donnera le mot de la fin à cette rentrée littéraire 2026 particulièrement riche.",
    ],
  },
];

function ArticleModal({ article, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
      onClick={onClose}
    >
      <article
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src={article.image} alt={article.title} className="w-full h-56 sm:h-80 object-cover" />
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
          >
            <X size={20} />
          </button>
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600 text-white text-xs font-bold uppercase tracking-wide">
            <Tag size={12} /> {article.category}
          </span>
        </div>
        <div className="p-6 sm:p-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <CalendarDays size={16} />
            <time>{article.date}</time>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-6">
            {article.title}
          </h2>
          {article.facts && article.facts.length > 0 && (
            <div className="mb-8 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 p-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 mb-4 flex items-center gap-2">
                <Sparkles size={16} /> En bref
              </h3>
              <dl className="space-y-2.5">
                {article.facts.map(([k, v], i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:gap-3 text-sm">
                    <dt className="font-bold text-slate-700 dark:text-slate-200 shrink-0 sm:w-44">{k}</dt>
                    <dd className="text-slate-600 dark:text-slate-300">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            {article.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 text-xs text-slate-400 dark:text-slate-500 italic">
            Rédaction Lisible — L'actualité littéraire, sans quitter la plateforme.
          </p>
        </div>
      </article>
    </div>
  );
}

export default function ActualitesPage() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = "Actualités littéraires | Lisible";
  }, []);

  const [featured, ...rest] = ARTICLES;

  return (
    <main className="min-h-screen bg-[#fcfbf9] dark:bg-slate-950 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <header className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-black uppercase tracking-widest mb-5">
            <Newspaper size={14} /> Le journal de Lisible
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Actualités <span className="italic text-teal-600">littéraires</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Prix littéraires, records, rentrée des livres : toute l'info du monde des lettres,
            racontée ici même — sans jamais vous envoyer ailleurs.
          </p>
        </header>

        {/* Article à la une */}
        <section className="mb-12">
          <button
            onClick={() => setSelected(featured)}
            className="group w-full text-left rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="grid md:grid-cols-2">
              <div className="relative overflow-hidden">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-black uppercase tracking-wide shadow-lg">
                  <Trophy size={12} /> À la une
                </span>
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <CalendarDays size={16} />
                  <time>{featured.date}</time>
                  <span className="mx-1">•</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">{featured.category}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
                  Lire l'article complet
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          </button>
        </section>

        {/* Grille des autres infos */}
        <section>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Newspaper size={20} className="text-teal-600" /> Toutes les infos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="group text-left rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={a.image}
                    alt={a.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-teal-600 text-white text-[11px] font-bold uppercase tracking-wide">
                    {a.category}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <CalendarDays size={14} />
                    <time>{a.date}</time>
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {a.excerpt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

import Link from "next/link";
import {
  Vault,
  Fingerprint,
  Clock3,
  FileBadge,
  Share2,
  ShieldCheck,
  Feather,
  ArrowRight,
  BadgeCheck,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "Coffre-Fort d'Horodatage — Certificat d'Ancrage Littéraire | Lisible",
  description:
    "Protégez vos œuvres gratuitement : empreinte cryptographique SHA-256, horodatage certifié infalsifiable et Certificat d'Ancrage Littéraire officiel.",
};

const ETAPES = [
  {
    n: "01",
    titre: "Déposez votre texte",
    texte:
      "Poème, chapitre, synopsis ou manuscrit complet : publiez-le sur Lisible et scellez-le en 1 clic, au moment de la publication ou après.",
  },
  {
    n: "02",
    titre: "Nous générons la preuve",
    texte:
      "La plateforme calcule instantanément l'empreinte cryptographique SHA-256 unique de votre texte et y appose un horodatage certifié infalsifiable.",
  },
  {
    n: "03",
    titre: "Recevez votre certificat",
    texte:
      "Votre Certificat d'Ancrage Littéraire (PDF haute qualité, sceau d'encre Lisible) est émis aussitôt — vérifiable publiquement et partageable partout.",
  },
];

const CONTENU = [
  {
    icone: Fingerprint,
    titre: "Empreinte cryptographique unique",
    texte: "Hash SHA-256 du texte tel que déposé : la moindre modification ultérieure serait détectée.",
  },
  {
    icone: Clock3,
    titre: "Horodatage certifié infalsifiable",
    texte: "Date et heure exactes du dépôt, conservées dans l'archive Lisible.",
  },
  {
    icone: FileBadge,
    titre: "Sceau d'encre officiel",
    texte: "Certificat PDF imprimable haute qualité, estampillé du sceau Lisible.",
  },
  {
    icone: Share2,
    titre: "Vérification publique",
    texte: "Chaque certificat possède une page publique vérifiable et partageable sur tous les réseaux.",
  },
];

const FAQ = [
  {
    q: "Le service est-il vraiment gratuit ?",
    r: "Oui, à 100 %. Le scellement, le certificat PDF et la vérification publique sont gratuits, sans limite.",
  },
  {
    q: "Que dois-je déclarer pour sceller une œuvre ?",
    r: "En scellant, vous déclarez sur l'honneur être l'auteur du texte, l'avoir écrit vous-même sans génération intégrale par une IA, et qu'il ne s'agit pas d'un plagiat.",
  },
  {
    q: "Le certificat remplace-t-il un dépôt légal ?",
    r: "Non. Il atteste de l'existence et de l'antériorité de l'œuvre à la date du dépôt grâce à l'empreinte cryptographique, mais ne constitue pas un dépôt légal au sens du Code de la propriété intellectuelle.",
  },
  {
    q: "Que se passe-t-il si je modifie mon texte après le scellé ?",
    r: "Le certificat porte sur le texte tel que déposé. Après modification, il vous suffit de générer un nouveau scellé pour la version à jour.",
  },
  {
    q: "Qui peut vérifier mon certificat ?",
    r: "Tout le monde : chaque certificat dispose d'une page publique (lisible.biz/certificat/N°) affichant l'empreinte, la date et le statut de vérification.",
  },
];

export default function CoffreFortPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,164,65,0.14),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-14 text-center">
          <img
            src="/images/logo-lisible.png"
            alt="Lisible"
            className="w-40 sm:w-52 mx-auto mb-8 drop-shadow-2xl"
          />
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-amber-300 border border-amber-500/40 bg-amber-500/10 rounded-full px-5 py-2 mb-6">
            <Vault size={14} /> Service gratuit · sans limite
          </p>
          <h1 className="font-serif font-black italic text-4xl sm:text-6xl leading-tight tracking-tight">
            Le Coffre-Fort
            <span className="block not-italic text-amber-300">d'Horodatage</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mt-6 max-w-2xl mx-auto leading-relaxed">
            Le <span className="text-white font-semibold">Certificat d'Ancrage Littéraire</span> :
            scellez l'antériorité de vos œuvres en 1 clic, gratuitement, avant de les montrer au monde.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-9">
            <Link
              href="/publish"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20"
            >
              Publier & sceller <ArrowRight size={16} />
            </Link>
            <Link
              href="/livres"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-slate-700 text-xs font-black uppercase tracking-widest text-slate-200 hover:border-amber-500/60 hover:text-amber-200 transition-all"
            >
              Découvrir Lisible
            </Link>
          </div>
        </div>
      </section>

      {/* LE CONCEPT */}
      <section className="relative max-w-5xl mx-auto px-6 py-14">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400 mb-3">
          Le concept
        </p>
        <h2 className="font-serif font-black italic text-3xl sm:text-4xl tracking-tight mb-5">
          L'enregistrement d'antériorité en 1 clic
        </h2>
        <p className="text-slate-300/90 leading-relaxed max-w-3xl">
          Chaque fois qu'un écrivain termine un poème, un chapitre, un synopsis ou un manuscrit,
          son premier réflexe est de vouloir le <span className="text-white font-semibold">protéger avant de le montrer</span>.
          Les solutions traditionnelles — enveloppe Soleau, dépôt d'auteur payant, notaire — sont
          payantes, lentes ou complexes. Le Coffre-Fort Lisible vous offre une protection et un
          ancrage numérique <span className="text-amber-300 font-semibold">100&nbsp;% gratuits</span>,
          en quelques secondes.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {ETAPES.map((e) => (
            <div
              key={e.n}
              className="bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-7 hover:border-amber-500/40 transition-all"
            >
              <p className="font-serif font-black italic text-4xl text-amber-500/80">{e.n}</p>
              <h3 className="font-bold text-lg mt-3 mb-2">{e.titre}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENU DU CERTIFICAT */}
      <section className="relative max-w-5xl mx-auto px-6 py-14 border-t border-white/10">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400 mb-3">
          Le certificat
        </p>
        <h2 className="font-serif font-black italic text-3xl sm:text-4xl tracking-tight mb-10">
          Une preuve d'une solidité exceptionnelle
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {CONTENU.map((c) => (
            <div
              key={c.titre}
              className="flex gap-5 bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-6 hover:border-amber-500/40 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shrink-0 shadow-lg">
                <c.icone size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1.5">{c.titre}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{c.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ENGAGEMENT */}
      <section className="relative max-w-5xl mx-auto px-6 py-14 border-t border-white/10">
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-[2rem] p-8 sm:p-10">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shrink-0 shadow-lg">
              <Feather size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif font-black italic text-2xl sm:text-3xl tracking-tight mb-3">
                La déclaration sur l'honneur
              </h2>
              <p className="text-slate-300/90 leading-relaxed text-[15px]">
                En scellant une œuvre, vous déclarez sur l'honneur en être l'auteur, l'avoir écrite
                vous-même <span className="text-white font-semibold">sans génération intégrale par une intelligence artificielle
                ni plagiat</span>. Le certificat scelle l'horodatage du dépôt et témoigne de
                l'ancienneté de l'œuvre telle que déposée.
              </p>
              <p className="text-slate-400 text-sm mt-4 flex items-start gap-2">
                <Lock size={14} className="mt-0.5 shrink-0" />
                Le scellé est définitif : toute modification ultérieure du texte nécessitera un nouveau scellé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative max-w-4xl mx-auto px-6 py-14 border-t border-white/10">
        <h2 className="font-serif font-black italic text-3xl tracking-tight mb-8 text-center">
          Questions fréquentes
        </h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-5 group open:border-amber-500/40 transition-all"
            >
              <summary className="font-bold cursor-pointer list-none flex items-center justify-between gap-4">
                {f.q}
                <BadgeCheck size={18} className="text-amber-400 shrink-0" />
              </summary>
              <p className="text-sm text-slate-400 leading-relaxed mt-3">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="flex justify-center mb-6">
          <ShieldCheck size={44} className="text-amber-400" />
        </div>
        <h2 className="font-serif font-black italic text-3xl sm:text-4xl tracking-tight mb-4">
          Votre prochaine œuvre mérite son sceau.
        </h2>
        <p className="text-slate-400 mb-8">Gratuit, instantané, infalsifiable.</p>
        <Link
          href="/publish"
          className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/25"
        >
          <Vault size={16} /> Sceller ma première œuvre
        </Link>
      </section>
    </main>
  );
}

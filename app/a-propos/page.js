// app/a-propos/page.js
import React from "react";
import Link from "next/link";
import { BookOpen, Users, Sparkles, MapPin, Phone, Mail, ArrowLeft, Feather, Globe } from "lucide-react";

export const metadata = {
  title: "À propos | Lisible",
  description: "Découvrez Lisible, la plateforme de streaming littéraire produite par le label La Belle Littéraire, fondé par Ben Johnson Juste.",
};

export default function APropos() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-16 px-6 animate-in fade-in duration-700">
      {/* En-tête */}
      <header className="text-center space-y-4">
        <div className="inline-flex p-5 bg-slate-900 text-teal-400 rounded-[2rem] mb-2 shadow-xl">
          <Feather size={44} />
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
          À propos de Lisible
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600">
          La plateforme de streaming littéraire
        </p>
      </header>

      <article className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 md:p-16 border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className="space-y-10 text-slate-600 dark:text-slate-300 leading-relaxed relative z-10">

          <p className="text-lg font-medium text-slate-800 dark:text-slate-200 border-l-8 border-teal-500 pl-8 py-2 italic bg-slate-50 dark:bg-white/5 rounded-r-3xl">
            <span className="text-teal-600 dark:text-teal-400 font-black not-italic">Lisible</span> est une
            plateforme de streaming littéraire : un lieu où les auteurs publient leurs textes et où les
            lecteurs découvrent, lisent, écoutent et soutiennent les plumes de demain.
          </p>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider">
              <span className="bg-teal-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">01</span>
              Notre mission
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                <BookOpen size={24} className="text-teal-600 dark:text-teal-400" />
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Publier</h3>
                <p className="text-sm">Offrir aux auteurs un espace simple et gratuit pour diffuser leurs œuvres.</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                <Users size={24} className="text-teal-600 dark:text-teal-400" />
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Rassembler</h3>
                <p className="text-sm">Créer une communauté de lecteurs et d'auteurs passionnés par les mots.</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                <Sparkles size={24} className="text-teal-600 dark:text-teal-400" />
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Valoriser</h3>
                <p className="text-sm">Permettre aux plumes les plus lues de monétiser leur talent.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">02</span>
              L'éditeur
            </h2>
            <p className="text-sm">
              Lisible est une production du label littéraire <strong>La Belle Littéraire</strong>, structure
              légale reconnue par l'État haïtien, fondé par l'écrivain <strong>Ben Johnson Juste</strong>.
              Le label accompagne et valorise les jeunes plumes à travers des publications et des événements
              culturels majeurs.
            </p>
          </section>

          <section className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white border border-white/5">
            <h2 className="flex items-center gap-3 text-xl font-black mb-6 uppercase tracking-wider text-teal-400">
              <Globe size={22} /> Nous contacter
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                <MapPin size={18} className="text-teal-400 shrink-0" />
                <span className="font-semibold text-slate-200">22 rue A. Lazarre,<br />Delmas, Haïti</span>
              </div>
              <a href="tel:+50943524498" className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all">
                <Phone size={18} className="text-teal-400 shrink-0" />
                <span className="font-semibold text-slate-200">(509) 4352 4498</span>
              </a>
              <a href="mailto:cmo.lablitteraire7@gmail.com" className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all">
                <Mail size={18} className="text-teal-400 shrink-0" />
                <span className="font-semibold text-slate-200 break-all">cmo.lablitteraire7@gmail.com</span>
              </a>
            </div>
          </section>

        </div>
      </article>

      {/* Boutons d'action */}
      <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Link href="/library" className="px-10 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-2xl active:scale-95">
          Explorer la bibliothèque
        </Link>
        <Link href="/contact" className="flex items-center gap-2 px-8 py-5 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] border border-slate-100 dark:border-white/10 hover:text-teal-600 transition-all">
          <ArrowLeft size={16} /> Nous écrire
        </Link>
      </footer>

      <p className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">
        Lisible par La Belle Littéraire
      </p>
    </div>
  );
}

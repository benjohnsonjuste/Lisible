// app/evenements/page.js
import React from "react";
import { CalendarDays, Sparkles, Trophy, ArrowRight, Lock, Flame } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Événements | Lisible",
  description: "Découvrez l'agenda culturel, les battles poétiques et les foires littéraires de la communauté Lisible.",
};

export default function EvenementsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20 animate-in fade-in duration-700 px-4">
      {/* En-tête stylisé */}
      <header className="text-center space-y-6 pt-10">
        <div className="inline-flex p-4 bg-slate-900 dark:bg-teal-600 text-white rounded-[2rem] shadow-xl shadow-slate-200 dark:shadow-none">
          <CalendarDays size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
            Agenda <span className="text-teal-600 dark:text-teal-400">Culturel</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-serif italic text-lg max-w-xl mx-auto">
            Explorez les défis en cours et les rendez-vous de la communauté.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CARTE 1 : BATTLE POÉTIQUE (OUVERT) */}
        <Link href="/battle-poetique" className="group relative">
          <div className="h-full bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-teal-100 dark:border-white/5 shadow-2xl shadow-teal-900/5 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-teal-900/10 relative overflow-hidden">
            {/* Badge Status */}
            <div className="absolute top-8 right-8 bg-teal-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse z-20">
              En cours
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="w-16 h-16 bg-teal-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-teal-200 dark:shadow-none">
                <Trophy size={32} />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight">
                  Battle Poétique <br />International
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  L'arène est ouverte. Publiez vos plus beaux vers et tentez de conquérir le cœur du monde littéraire.
                </p>
              </div>

              <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400 font-black text-[11px] uppercase tracking-widest">
                Entrer dans l'arène <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>

            {/* Déco fond */}
            <Flame className="absolute -bottom-10 -right-10 text-teal-50 dark:text-teal-900/10 size-40 rotate-12" />
          </div>
        </Link>

        {/* CARTE 2 : FOIRE VIRTUELLE (FERMÉE) */}
        <div className="relative group grayscale">
          <div className="h-full bg-slate-50 dark:bg-white/5 rounded-[3.5rem] p-10 border border-slate-200 dark:border-white/5 border-dashed flex flex-col justify-between opacity-80">
            
            <div className="space-y-8">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-slate-400">
                <Lock size={32} />
              </div>
              
              <div className="space-y-4">
                <div className="inline-block bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Terminé
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter text-slate-400 dark:text-slate-600 leading-tight">
                  Foire Littéraire <br />Annuelle
                </h2>
                <p className="text-slate-400 dark:text-slate-600 leading-relaxed font-medium">
                  La foire a fermé ses portes. Merci à tous les exposants et visiteurs pour cette édition mémorable.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5">
               <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Prochaine édition : Décembre 2026</p>
            </div>
          </div>
        </div>

      </section>

      {/* FOOTER / TEASING */}
      <div className="max-w-3xl mx-auto bg-amber-50 dark:bg-amber-900/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8 border border-amber-100/50 dark:border-amber-900/20">
        <div className="p-4 bg-white dark:bg-amber-900/20 rounded-2xl text-amber-500 shadow-sm">
          <Sparkles size={32} />
        </div>
        <div className="text-center md:text-left space-y-2">
          <h3 className="text-xl font-black italic text-amber-900 dark:text-amber-400 tracking-tight">De nouveaux défis arrivent !</h3>
          <p className="text-amber-700/70 dark:text-amber-600/70 text-sm font-medium">
            Autres événements sont en attente. Restez à l'affût des notifications.
          </p>
        </div>
      </div>

      <footer className="text-center pt-10 pb-12">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">
          Lisible • Événements 2026
        </p>
      </footer>
    </div>
  );
}

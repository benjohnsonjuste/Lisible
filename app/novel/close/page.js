"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  BookOpen, 
  Feather,
  Sparkles,
  ScrollText
} from "lucide-react";

export default function DuelDisabledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center px-6">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ScrollText className="absolute top-20 left-[10%] text-slate-50 opacity-50" size={300} />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 px-6 py-3 rounded-2xl shadow-xl mb-8 animate-pulse">
            <Trophy size={18} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Duel Des Nouvelles</span>
          </div>
          
          <h1 className="font-serif font-black italic text-5xl sm:text-7xl text-slate-900 leading-none tracking-tighter mb-6">
            L'Encre fige.
          </h1>
          
          <div className="h-1 w-20 bg-amber-600 mx-auto rounded-full mb-10" />
        </header>

        <article className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 mb-12">
          <div className="space-y-6 font-serif text-xl md:text-2xl leading-relaxed text-slate-600 italic">
            <p>
              "Chaque histoire attend son heure, et chaque duel son dénouement dans le silence des pages closes."
            </p>
            <p className="text-base font-sans font-medium text-slate-400 not-italic uppercase tracking-widest">
              — La Chronique
            </p>
          </div>
          
          <div className="mt-12 pt-10 border-t border-slate-50">
            <p className="text-slate-800 font-medium mb-4">
              L'appel à manuscrits pour le duel est actuellement <span className="text-amber-600 font-black">clôturé</span>.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Le comité de lecture analyse les récits reçus pour désigner les vainqueurs. 
              Gardez votre imagination en éveil : continuez à bâtir vos mondes dans <span className="text-slate-900 font-bold">Le Studio</span> standard.
            </p>
          </div>
        </article>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => router.push("/publish")}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-lg"
          >
            <Feather size={16} /> Publier une nouvelle libre
          </button>
          
          <button 
            onClick={() => router.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-white text-slate-900 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        </div>

        <footer className="mt-20 flex items-center justify-center gap-6 text-slate-300">
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Délibération en cours</span>
          </div>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2">
            <Sparkles size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Grand Prix 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

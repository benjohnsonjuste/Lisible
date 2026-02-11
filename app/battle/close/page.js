"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Ghost, 
  Feather,
  Sparkles,
  MessageSquare
} from "lucide-react";

export default function BattleDisabledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center px-6">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Ghost className="absolute top-20 left-[10%] text-slate-50 opacity-50" size={300} />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl mb-8 animate-pulse">
            <Trophy size={18} className="text-teal-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Battle Poétique International</span>
          </div>
          
          <h1 className="font-serif font-black italic text-5xl sm:text-7xl text-slate-900 leading-none tracking-tighter mb-6">
            L'Arène repose.
          </h1>
          
          <div className="h-1 w-20 bg-teal-600 mx-auto rounded-full mb-10" />
        </header>

        <article className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 mb-12">
          <div className="space-y-6 font-serif text-xl md:text-2xl leading-relaxed text-slate-600 italic">
            <p>
              "Le silence est le plus beau des poèmes avant que le tonnerre ne gronde à nouveau."
            </p>
            <p className="text-base font-sans font-medium text-slate-400 not-italic uppercase tracking-widest">
              — Le Registre
            </p>
          </div>
          
          <div className="mt-12 pt-10 border-t border-slate-50">
            <p className="text-slate-800 font-medium mb-4">
              Les publications pour le concours sont actuellement <span className="text-teal-600 font-black">suspendues</span>.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Le jury délibère ou prépare la prochaine session de duels. 
              Votre plume est précieuse : profitez de cet instant pour affiner vos vers dans <span className="text-slate-900 font-bold">Le Studio</span> classique.
            </p>
          </div>
        </article>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => router.push("/publish")}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-lg"
          >
            <Feather size={16} /> Publier un texte hors-concours
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
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Réouverture prochaine</span>
          </div>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2">
            <Sparkles size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Session 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

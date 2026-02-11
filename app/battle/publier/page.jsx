"use client";
import React from "react";
import WorkForm from "@/components/WorkForm";
import { Trophy, Zap, ShieldCheck, AlignLeft, ImageOff } from "lucide-react";

export default function BattlePublierPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-teal-500/20">
            <Trophy size={14} className="animate-pulse" />Battle Poétique International 
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white leading-none">
            Entrer dans <br /><span className="text-teal-400">l'Arène</span>
          </h1>
          
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2 text-amber-400">
              <AlignLeft size={14}/> 1000 Caractères Max
            </span>
            <span className="flex items-center gap-2">
              <ImageOff size={14} className="text-rose-500"/> Sans Illustration
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-teal-400"/> Publication Immédiate
            </span>
          </div>
        </header>

        <div className="bg-white/5 backdrop-blur-xl p-2 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12">
            <WorkForm 
              submitLabel="Engager le Duel" 
              isConcours={true}
              requireBattleAcceptance={true}
              maxChars={1000}
              allowImage={false}
              initialData={{ 
                category: "Battle Poétique",
                genre: "Battle Poétique" 
              }}
            />
          </div>
        </div>

        <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5">
           <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Règlement de l'Arène</p>
           <p className="text-center text-slate-500 text-xs font-serif italic leading-relaxed">
             Votre texte sera archivé dans la bibliothèque publique et accessible via son registre individuel. 
             Tout dépassement de la limite de 1000 caractères entraînera le rejet du manuscrit.
           </p>
        </div>
      </div>
    </div>
  );
}

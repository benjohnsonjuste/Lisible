"use client";
import React from "react";
import WorkForm from "@/components/WorkForm";
import { Trophy, Zap, ShieldCheck, AlignLeft, ImageOff, BookOpen } from "lucide-react";

export default function NovelDuelPublierPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-rose-600/20">
            <Trophy size={14} className="text-amber-400 fill-amber-400" /> Duel des Nouvelles
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white leading-none">
            Soumettre votre <br /><span className="text-rose-500">Récit.</span>
          </h1>
          
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2 text-rose-400">
              <AlignLeft size={14}/> 10 000 Caractères Max
            </span>
            <span className="flex items-center gap-2">
              <ImageOff size={14} className="text-slate-500"/> Sans Illustration
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-rose-400"/> Validation Compétition
            </span>
          </div>
        </header>

        <div className="bg-white/5 backdrop-blur-xl p-2 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12">
            <WorkForm 
              submitLabel="Lancer le Duel" 
              // On utilise ici l'endpoint spécifique
              apiEndpoint="/api/novel-battle-db" 
              isnovelbattle={true}
              isConcours={true}
              requireBattleAcceptance={true}
              maxChars={10000}
              allowImage={false}
              initialData={{ 
                category: "Nouvelle",
                genre: "Nouvelle",
                isnovelbattle: true
              }}
            />
          </div>
        </div>

        <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5">
           <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Code de la compétition</p>
           <p className="text-center text-slate-500 text-xs font-serif italic leading-relaxed">
             En publiant dans cette section, votre nouvelle sera automatiquement classée dans le Duel de Nouvelles. 
             La limite de 10 000 caractères permet d'explorer la profondeur de votre intrigue tout en restant percutant.
           </p>
        </div>
      </div>
    </div>
  );
}

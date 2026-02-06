"use client";
import React from "react";
import WorkForm from "@/components/WorkForm";
import { Trophy, Zap, ShieldCheck } from "lucide-react";

export default function BattlePublierPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-teal-500/20">
            <Trophy size={14} className="animate-pulse" /> Inscription Battle
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white leading-none">
            Entrer dans <br /><span className="text-teal-400">l'Arène</span>
          </h1>
          <div className="mt-8 flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2"><Zap size={14} className="text-amber-400"/> Vote du public</span>
            <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-teal-400"/> Certification Li</span>
          </div>
        </header>

        <div className="bg-white/5 backdrop-blur-xl p-2 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12">
            <WorkForm 
              submitLabel="Engager le Duel" 
              isConcours={true}
              requireBattleAcceptance={true}
              initialData={{ category: "Battle Poétique" }}
            />
          </div>
        </div>

        <p className="mt-8 text-center text-slate-500 text-xs font-serif italic">
          En publiant, vous acceptez les règles de la Battle et le jugement des pairs.
        </p>
      </div>
    </div>
  );
}

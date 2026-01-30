"use client";

import React from "react";
import MetricsOverview from "@/components/MetricsOverview";
import { BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-white md:bg-slate-50/50 pb-20">
      {/* Barre de navigation simplifiée */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <Link 
          href="/dashboard" 
          className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Retour au tableau de bord
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* En-tête de la page Analytics */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex p-4 bg-slate-900 text-teal-400 rounded-[1.5rem] shadow-xl shadow-slate-200">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Statistiques</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
                Analyse de performance de vos manuscrits
              </p>
            </div>
          </div>

          {/* Badge de période (statique pour l'exemple) */}
          <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm self-start md:self-auto">
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Période :</span>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-2">30 derniers jours</span>
          </div>
        </header>

        {/* Grille de métriques */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <MetricsOverview />
        </div>

        {/* Note de bas de page Analytics */}
        <footer className="pt-10 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
            Lisible • Données synchronisées en temps réel
          </p>
        </footer>
      </main>
    </div>
  );
}

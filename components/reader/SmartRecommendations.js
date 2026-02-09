"use client";
import React, { useMemo } from "react";
import Link from "next/link"; 
import { Sparkles, ArrowRight, Compass, Feather } from "lucide-react";

export default function SmartRecommendations({ currentId, allTexts = [] }) {
  const recommendations = useMemo(() => {
    if (!allTexts || !allTexts.length) return [];
    
    // Filtre pour exclure le texte actuel et sélectionne 2 textes au hasard
    // On s'assure que les données essentielles sont présentes
    return allTexts
      .filter(t => t.id !== currentId && (t.title || t.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
  }, [currentId, allTexts]);

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-32 border-t border-slate-100 pt-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4">
      
      <div className="flex flex-col items-center mb-16 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-slate-200" />
          <div className="p-4 bg-white rounded-full shadow-xl border border-slate-50 text-teal-600 group hover:rotate-[360deg] transition-transform duration-1000">
            <Compass size={22} className="animate-pulse" />
          </div>
          <div className="h-px w-8 bg-slate-200" />
        </div>
        <div className="text-center">
          <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">
            Poursuivre la traversée
          </h4>
          <p className="text-[9px] font-bold text-teal-600/50 uppercase tracking-widest mt-2">Résonances suggérées</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {recommendations.map((rec) => (
          <Link 
            href={`/texts/${rec.id}`} 
            key={rec.id} 
            className="group relative block bg-white p-10 md:p-12 rounded-[3.5rem] border border-slate-100 transition-all duration-700 hover:-translate-y-3 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden"
          >
            {/* Décoration d'arrière-plan - Plume fantôme */}
            <div className="absolute -top-6 -right-6 text-slate-50 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000 rotate-12 pointer-events-none">
               <Feather size={120} />
            </div>

            {/* Bouton d'action flottant au survol */}
            <div className="absolute top-10 right-10 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-2xl z-20">
              <ArrowRight size={20} />
            </div>

            <header className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">
                  Écho {rec.category || rec.genre || "Littéraire"}
                </span>
              </div>
              
              <h5 className="font-serif text-3xl font-black italic leading-[0.9] text-slate-900 tracking-tighter group-hover:text-teal-600 transition-colors duration-500">
                {rec.title || "Manuscrit sans titre"}
              </h5>
              
              <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Signé par</span>
                  <span className="text-xs font-bold text-slate-700">{rec.authorName || "Plume Lisible"}</span>
                </div>
                
                <div className="flex items-center gap-1 text-[10px] font-black text-slate-300">
                   <Sparkles size={12} className="text-amber-400" />
                   {/* Temps de lecture estimé ou random pour le cachet visuel */}
                   {Math.max(1, Math.floor((rec.content?.length || 500) / 800))} MIN
                </div>
              </div>
            </header>

            {/* Overlay de gradient subtil au survol */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </Link>
        ))}
      </div>

      <div className="mt-20 text-center">
        <Link href="/bibliotheque" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-teal-600 transition-colors group">
          Exploration intégrale <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

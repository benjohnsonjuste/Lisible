"use client";
import React, { useMemo } from "react";
import Link from "next/link"; // Importation pour la navigation optimisée
import { Sparkles, ArrowRight } from "lucide-react";

export default function SmartRecommendations({ currentId, allTexts = [] }) {
  const recommendations = useMemo(() => {
    if (!allTexts || !allTexts.length) return [];
    // Filtre pour exclure le texte actuel et sélectionne 2 textes au hasard
    return allTexts
      .filter(t => t.id !== currentId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
  }, [currentId, allTexts]);

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-24 border-t border-slate-100 dark:border-slate-800 pt-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="flex flex-col items-center mb-12">
        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-2xl mb-4">
          <Sparkles size={20} className="text-teal-600" />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">
          Continuer l'immersion
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {recommendations.map((rec) => (
          <Link 
            href={`/texte/${rec.id}`} 
            key={rec.id} 
            className="group relative block bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl overflow-hidden"
          >
            {/* Effet visuel au survol */}
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={20} className="text-teal-600 -rotate-45" />
            </div>

            <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-4">
              À découvrir ensuite
            </span>
            
            <h5 className="font-serif text-2xl font-black italic leading-tight group-hover:text-teal-600 transition-colors text-slate-900 dark:text-slate-100 tracking-tighter">
              {rec.title}
            </h5>
            
            <div className="flex items-center gap-3 mt-6">
              <div className="w-6 h-1 bg-slate-100 dark:bg-slate-800 group-hover:w-12 group-hover:bg-teal-500 transition-all duration-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Par <span className="text-slate-900 dark:text-slate-200">{rec.authorName || "Plume Anonyme"}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

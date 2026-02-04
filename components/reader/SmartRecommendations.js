import React, { useMemo } from "react";

export default function SmartRecommendations({ currentId, allTexts = [] }) {
  const recommendations = useMemo(() => {
    if (!allTexts.length) return [];
    return allTexts
      .filter(t => t.id !== currentId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
  }, [currentId, allTexts]);

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-24 border-t border-slate-100 dark:border-slate-800 pt-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 text-center">Continuer l'immersion</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <a href={`/text/${rec.id}`} key={rec.id} className="group block bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl">
            <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-4">À découvrir ensuite</span>
            <h5 className="font-serif text-xl font-bold leading-tight group-hover:text-teal-600 transition-colors text-slate-900 dark:text-slate-100">{rec.title}</h5>
            <p className="text-xs text-slate-400 mt-4 font-medium italic">Par {rec.authorName || "Plume Anonyme"}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

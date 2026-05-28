'use client';
import React from 'react';

export default function EditorialReport({ report, marketingData }) {
  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xs uppercase font-mono tracking-wider text-slate-500 mb-4">Indicateurs Quantitatifs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50">
            <span className="text-xs text-slate-400 block mb-1">Diversité lexicale</span>
            <span className="text-xl font-bold text-cyan-400">{report.metrics?.vocabularyRichness || 0}%</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50">
            <span className="text-xs text-slate-400 block mb-1">Force des verbes</span>
            <span className="text-xl font-bold text-amber-400">{report.metrics?.activeVerbsRatio || 0}%</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50">
            <span className="text-xs text-slate-400 block mb-1">Verbes faibles</span>
            <span className="text-xl font-bold text-rose-400">{report.metrics?.weakVerbsCount || 0}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50">
            <span className="text-xs text-slate-400 block mb-1">Temps de lecture</span>
            <span className="text-xl font-bold text-emerald-400">~{report.metrics?.readingTime || 1} min</span>
          </div>
        </div>
      </div>

      {/* Retours Macro & Micro Édition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <h4 className="text-sm font-bold text-emerald-400 uppercase font-mono">Structure & Rythme (Macro)</h4>
          <p className="text-sm text-slate-300"><span className="text-slate-500">Équilibre :</span> {report.macroEditing?.structuralBalance}</p>
          <p className="text-sm text-slate-300"><span className="text-slate-500">Conseil de réorganisation :</span> {report.macroEditing?.reorganizationAdvice}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <h4 className="text-sm font-bold text-cyan-400 uppercase font-mono">Clichés & Lourdeurs (Micro)</h4>
          {report.microEditing?.clichesDetected?.length > 0 ? (
            report.microEditing.clichesDetected.map((c, i) => (
              <div key={i} className="text-xs bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-rose-400 font-semibold">{c.expression}</span> → <span className="text-emerald-400">{c.alternative}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Aucun cliché lourd identifié.</p>
          )}
        </div>
      </div>

      {/* Quatrième de couverture marketing optionnelle */}
      {marketingData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">Proposition de quatrième de couverture (Générée)</h4>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{marketingData.pitchBorders}</span>
          </div>
          <p className="text-sm font-serif italic text-slate-300 leading-relaxed">"{marketingData.generatedSummary}"</p>
        </div>
      )}
    </div>
  );
}

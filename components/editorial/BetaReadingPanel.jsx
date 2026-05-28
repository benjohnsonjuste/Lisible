'use client';
import React from 'react';
import { Compass, MessageSquare, AlertOctagon, Sparkles } from 'lucide-react';

export default function BetaReadingPanel({ data }) {
  if (!data) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Compass className="w-5 h-5 text-emerald-400" />
        <h3 className="text-md font-bold text-slate-200">Rapport de Lecture Bêta Automatisée</h3>
      </div>

      {/* Jauge de tension/intérêt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-950 p-4 rounded-lg border border-slate-800/60">
        <div className="col-span-2 space-y-1">
          <span className="text-xs uppercase font-mono text-slate-400 block">Indice de Rétention Global</span>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${data.engagementScore > 70 ? 'from-emerald-500 to-teal-400' : 'from-amber-500 to-rose-400'}`}
              style={{ width: `${data.engagementScore}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-emerald-400 font-mono">{data.engagementScore}%</span>
        </div>
      </div>

      {/* Passages à haut risque de décrochage */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-mono text-slate-500 block">Passages à risque d'abandon</span>
        {data.riskPassages?.length > 0 ? (
          data.riskPassages.map((p) => (
            <div key={p.id} className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{p.type}</span>
              </div>
              <p className="text-xs font-serif italic text-slate-300">"{p.excerpt}"</p>
              <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-slate-500 font-medium">Pourquoi :</span> {p.reason}</p>
              <p className="text-[11px] text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/30 mt-1"><span className="font-bold">Correction :</span> {p.fix}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 italic bg-slate-950 p-3 rounded border border-slate-800/40">Aucune zone de ralentissement critique n'impacte la lecture.</p>
        )}
      </div>

      {/* Feedbacks de Personas de lecteurs */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-mono text-slate-500 block">Simulateur de Comité de Lecture</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.readerFeedbacks?.map((f, i) => (
            <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                <span>{f.avatar}</span>
                <span>{f.profile}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">"{f.review}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

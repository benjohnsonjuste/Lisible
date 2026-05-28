'use client';
import React from 'react';
import { Calendar, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TimelineContinuityPanel({ data }) {
  if (!data) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Calendar className="w-5 h-5 text-amber-400" />
        <h3 className="text-md font-bold text-slate-200">Gestion de la Continuité & Horloge Narrative</h3>
      </div>

      {/* Alertes d'univers */}
      {data.environmentalClashes?.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs uppercase font-mono text-rose-400 block tracking-wider">Trous narratifs / Collisions de décor</span>
          {data.environmentalClashes.map((clash, idx) => (
            <div key={idx} className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-lg flex items-start space-x-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-400 block">Anomalie {clash.type}</span>
                <p className="text-xs text-slate-300 leading-relaxed">{clash.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 rounded-lg flex items-center space-x-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Aucune anomalie climatique ou spatio-temporelle immédiate détectée.</span>
        </div>
      )}

      {/* Frise Chronologique de Segment */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-mono text-slate-500 block">Chronologie relative extraite automatique</span>
        {data.timelineEvents?.length > 0 ? (
          <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-4">
            {data.timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative">
                {/* Point de la frise */}
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-xs">
                  <span className="font-bold text-slate-200 block mb-0.5">{evt.anchor}</span>
                  <span className="text-slate-400">{evt.impact}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Récit en vase clos ou unité de temps stricte (pas de marqueur temporel détecté).</p>
        )}
      </div>
    </div>
  );
}

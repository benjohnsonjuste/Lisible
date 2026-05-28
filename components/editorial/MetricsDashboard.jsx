'use client';
import React from 'react';
import { Brain, Palette, Scale } from 'lucide-react';

export default function MetricsDashboard({ report }) {
  if (!report || !report.metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-slate-500">
          <Brain className="w-3.5 h-3.5 text-emerald-400"/>
          <span className="text-xs uppercase font-mono tracking-wider block">Ancrage Mnésique</span>
        </div>
        <span className="text-5xl font-black text-emerald-400 block">{report.metrics.hookScore}%</span>
        <span className="text-xs text-slate-400 block">Capacité d'empreinte structurelle</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-500 mb-1">
          <Palette className="w-3.5 h-3.5 text-cyan-400"/>
          <span className="text-xs uppercase font-mono tracking-wider block">Synesthésie de la Prose</span>
        </div>
        <p className="text-sm text-slate-200 font-medium leading-relaxed pt-1">
          {report.microEditing?.rhythmStyle || "Analyse en cours"}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-500 mb-1">
          <Scale className="w-3.5 h-3.5 text-amber-400"/>
          <span className="text-xs uppercase font-mono tracking-wider block">Érosion Stylistique</span>
        </div>
        <p className="text-sm text-slate-200 font-medium leading-relaxed pt-1">
          Densité en adverbes détectée : {report.metrics.adverbRatio}%
        </p>
      </div>
    </div>
  );
}

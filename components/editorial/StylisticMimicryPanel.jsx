'use client';
import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export default function StylisticMimicryPanel({ data }) {
  if (!data) return null;
  const isHighRisk = data.mimicryAlert?.riskPercentage > 50;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Cpu className="w-5 h-5 text-indigo-400" />
        <h3 className="text-md font-bold text-slate-200">Analyseur de Mimétisme & Pureté Stylistique</h3>
      </div>

      <div className={`p-4 rounded-lg border flex items-start space-x-3 ${isHighRisk ? 'bg-amber-950/20 border-amber-500/20' : 'bg-indigo-950/20 border-indigo-500/20'}`}>
        {isHighRisk ? <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" /> : <ShieldCheck className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />}
        <div className="space-y-1">
          <span className="text-xs uppercase font-mono text-slate-400 block">Tendance d'assimilation stylistique</span>
          <span className="text-sm font-bold text-slate-200 block">{data.mimicryAlert?.authorTarget}</span>
          <p className="text-xs text-slate-400 leading-relaxed">{data.mimicryAlert?.critique}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-[11px] bg-slate-950 p-3 rounded border border-slate-800">
        <div>
          <span className="text-slate-500 block">Longueur de phrase cible :</span>
          <span className="text-slate-200 font-bold">{data.fingerprint?.avgSentenceLength} mots</span>
        </div>
        <div>
          <span className="text-slate-500 block">Densité de ponctuation :</span>
          <span className="text-slate-200 font-bold">{(data.fingerprint?.punctuationDensity / 10).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

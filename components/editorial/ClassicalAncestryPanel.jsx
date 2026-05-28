'use client';
import React from 'react';
import { History, Award, BookOpen, Fingerprint } from 'lucide-react';

export default function ClassicalAncestryPanel({ data }) {
  if (!data || !data.ancestors) return null;

  const { primary, secondary } = data.ancestors;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-900/40 rounded-xl p-6 space-y-6 relative overflow-hidden shadow-2xl">
      {/* Ornementation d'angle classique subtile */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-500/20" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-amber-500/20" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-amber-500/20" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-amber-500/20" />
      
      <div className="flex items-center space-x-2 border-b border-amber-900/30 pb-3">
        <History className="w-5 h-5 text-amber-500" />
        <h3 className="text-md font-bold tracking-wide text-slate-200 font-serif">Généalogie Littéraire Rétroactive</h3>
      </div>

      {/* Ancêtre Majeur */}
      <div className="space-y-3 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-amber-500 font-semibold block">Affinité Principale</span>
            <h4 className="text-xl font-black font-serif text-slate-100 tracking-tight mt-0.5">
              {primary.name} <span className="text-xs font-mono font-normal text-slate-400">({primary.century} siècle)</span>
            </h4>
            <p className="text-xs font-medium italic text-amber-400/80 font-serif mt-0.5">{primary.archetype}</p>
          </div>
          <div className="bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded text-right">
            <span className="text-xs font-mono font-bold text-amber-400">{primary.matchRate}%</span>
            <span className="text-[9px] block text-slate-500 font-mono uppercase">indice</span>
          </div>
        </div>
        
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 font-sans">
          {primary.analysis}
        </p>
      </div>

      {/* Lignée Secondaire & Empreinte Technique */}
      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-900">
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Résonance Collatérale</span>
            <span className="text-xs font-bold text-slate-300 font-serif block mt-1">{secondary.name}</span>
            <span className="text-[10px] text-slate-400 block font-sans italic">{secondary.archetype}</span>
          </div>
          <div className="text-right mt-2 text-[10px] font-mono text-slate-500">
            Proxy : {secondary.matchRate}%
          </div>
        </div>

        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 space-y-2">
          <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Empreinte Rhétorique Ancienne</span>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-amber-600" /> Cadence :</span>
              <span className="text-slate-200 font-bold">{data.metrics?.sentenceComplexity}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-600" /> Densité classique :</span>
              <span className="text-slate-200 font-bold">{data.metrics?.rhetoricalDensity / 10}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

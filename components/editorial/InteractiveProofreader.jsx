'use client';
import React from 'react';
import { Check, X, Wrench, RefreshCw } from 'lucide-react';

export default function InteractiveProofreader({ data, onAcceptSuggestion, onRejectSuggestion }) {
  if (!data || !data.suggestions || data.suggestions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs py-12">
        <Check className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
        Le manuscrit est sain. Aucune lourdeur ou répétition évidente à réécrire.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          <h3 className="text-md font-bold text-slate-200">Module de Réécriture & Corrections Intelligentes</h3>
        </div>
        <span className="text-xs font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-900/50">
          {data.suggestions.length} alertes stylistiques
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {data.suggestions.map((suggestion) => (
          <div key={suggestion.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-lg space-y-3 transition-all hover:border-slate-700">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {suggestion.type}
              </span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onRejectSuggestion(suggestion.id)}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  title="Ignorer l'alerte"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onAcceptSuggestion(suggestion)}
                  className="p-1.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 rounded transition-all flex items-center space-x-1 text-xs font-medium"
                  title="Injecter la modification"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Remplacer</span>
                </button>
              </div>
            </div>

            {/* Visualisation Avant / Après */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-900">
              <div className="space-y-0.5 border-r border-slate-800/60 pr-2">
                <span className="text-[10px] text-rose-400/70 font-mono block">Segment actuel :</span>
                <span className="line-through text-slate-400 font-serif">"{suggestion.original}"</span>
              </div>
              <div className="space-y-0.5 pl-1">
                <span className="text-[10px] text-emerald-400/70 font-mono block">Alternative littéraire :</span>
                <span className="text-emerald-300 font-serif font-medium flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-400 animate-[spin_4s_infinite]" />
                  {suggestion.corrected}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic pl-1 border-l-2 border-slate-800">
              {suggestion.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

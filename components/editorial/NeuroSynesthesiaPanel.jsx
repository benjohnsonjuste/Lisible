'use client';
import React from 'react';
import { Eye, Volume2, Fingerprint, Wind, Activity } from 'lucide-react';

export default function NeuroSynesthesiaPanel({ data }) {
  if (!data) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
        <h3 className="text-md font-bold text-slate-200">Spectrométrie Neuro-Synesthésique</h3>
      </div>

      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase font-mono text-slate-500 block">Indice de Texturisation Cérébrale</span>
          <p className="text-xs text-slate-400 mt-0.5">{data.aestheticVerdict}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-cyan-400 font-mono">{data.synesthesiaIndex}%</span>
        </div>
      </div>

      {/* Barres sensorielles */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-400" /> Stimulus Visuel (Images, Teintes)</span>
            <span className="font-mono">{data.scores?.visual}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-400 h-full" style={{ width: `${data.scores?.visual}%` }} /></div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5 text-purple-400" /> Stimulus Auditif (Cadence, Échos)</span>
            <span className="font-mono">{data.scores?.auditory}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden"><div className="bg-purple-400 h-full" style={{ width: `${data.scores?.auditory}%` }} /></div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Fingerprint className="w-3.5 h-3.5 text-emerald-400" /> Ancrage Kinesthésique (Sensations, Poids)</span>
            <span className="font-mono">{data.scores?.kinesthetic}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full" style={{ width: `${data.scores?.kinesthetic}%` }} /></div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-amber-400" /> Marqueurs Olfactifs & Gustatifs</span>
            <span className="font-mono">{data.scores?.olfactoryGustatory}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden"><div className="bg-amber-400 h-full" style={{ width: `${data.scores?.olfactoryGustatory}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

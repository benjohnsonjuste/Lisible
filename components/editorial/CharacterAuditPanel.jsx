'use client';
import React from 'react';
import { Users, UserX, UserCheck, HeartHandshake, Zap } from 'lucide-react';

export default function CharacterAuditPanel({ data }) {
  if (!data) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Users className="w-5 h-5 text-purple-400" />
        <h3 className="text-md font-bold text-slate-200">Analyse de Profondeur des Personnages</h3>
      </div>

      {/* Score Show Don't Tell */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase font-mono text-slate-500 block">Indice d'Incarnation Littéraire</span>
          <span className="text-xs text-slate-400">Règle d'or : "Show, Don't Tell" (Montrer le sentiment par l'action)</span>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black block ${data.styleMetrics?.showDontTellScore > 70 ? 'text-purple-400' : 'text-amber-400'}`}>
            {data.styleMetrics?.showDontTellScore || 0}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liste des Personnages Détectés */}
        <div className="space-y-3">
          <span className="text-xs uppercase font-mono text-slate-500 block">Entités actives identifiées</span>
          {data.charactersDetected?.length > 0 ? (
            data.charactersDetected.map((char, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-300">{char.name}</span>
                </div>
                <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  {char.depthStatus}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">Aucune entité humaine majeure isolée dans ce segment.</p>
          )}
        </div>

        {/* Incohérences psychologiques */}
        <div className="space-y-3">
          <span className="text-xs uppercase font-mono text-slate-500 block">Frictions Comportementales</span>
          {data.psychologicalFrictions?.length > 0 ? (
            data.psychologicalFrictions.map((fric, idx) => (
              <div key={idx} className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-lg space-y-1">
                <div className="flex items-center space-x-1.5 text-rose-400 font-semibold text-xs">
                  <UserX className="w-3.5 h-3.5" />
                  <span>{fric.label} (Gravité : {fric.severity})</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{fric.description}</p>
              </div>
            ))
          ) : (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/40 text-center">
              <HeartHandshake className="w-5 h-5 text-emerald-500/60 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Psychologie stable. Comportement aligné avec le profil de scènes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

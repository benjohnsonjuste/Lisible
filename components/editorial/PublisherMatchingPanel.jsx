'use client';
import React, { useState } from 'react';
import { Building2, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react';

export default function PublisherMatchingPanel({ data }) {
  const [filter, setFilter] = useState('all'); // all, high (score > 60), low
  const [searchTerm, setSearchTerm] = useState('');

  if (!data) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 h-64 animate-pulse">
        <Building2 className="w-8 h-8 mb-2 text-slate-600 animate-bounce" />
        <p className="text-sm font-mono">Calcul des probabilités d'acceptation éditoriale...</p>
      </div>
    );
  }

  const filteredMatches = data.matches.filter(pub => {
    const matchesSearch = pub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pub.genres.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === 'high') return pub.score >= 60;
    if (filter === 'low') return pub.score < 60;
    return true;
  });

  const getScoreColor = (score) => {
    if (score >= 75) return 'from-emerald-500 to-teal-400 text-emerald-400';
    if (score >= 55) return 'from-amber-500 to-orange-400 text-amber-400';
    return 'from-rose-500 to-red-400 text-rose-400';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Simulateur d'Acceptation Éditoriale (20 Grandes Maisons)
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Matrice sémantique détectée : <span className="text-cyan-400 font-semibold">{data.dominantGenre}</span>
          </p>
        </div>

        {/* Filtres de recherche */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filtrer une maison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 w-40 transition-all"
            />
          </div>
          <button 
            onClick={() => setFilter('all')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'all' ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tous ({data.matches.length})
          </button>
          <button 
            onClick={() => setFilter('high')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'high' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Fortes chances
          </button>
        </div>
      </div>

      {/* Liste des maisons d'édition */}
      <div className="grid grid-cols-1 gap-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {filteredMatches.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono text-center py-8">Aucun éditeur ne correspond à vos critères de filtrage.</p>
        ) : (
          filteredMatches.map((pub) => (
            <div key={pub.id} className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3 hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{pub.name}</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {pub.genres.map((g, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-slate-400 rounded border border-slate-800">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score Jauge */}
                <div className="text-right">
                  <span className={`text-base font-extrabold font-mono ${getScoreColor(pub.score).split(' ').pop()}`}>
                    {pub.score}%
                  </span>
                  <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Indice de matching</p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`bg-gradient-to-r ${getScoreColor(pub.score).replace(/text-\w+-\d+/, '')} h-1.5 rounded-full transition-all duration-1000`}
                  style={{ width: `${pub.score}%` }}
                />
              </div>

              {/* Critères & Feedback */}
              <div className="bg-slate-900/40 rounded p-2.5 space-y-2 text-xs border border-slate-900">
                <div className="flex items-start gap-2 text-slate-400">
                  {pub.score >= 60 ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <p className="leading-relaxed text-slate-300 font-sans">{pub.feedback}</p>
                </div>
                <div className="pt-1.5 border-t border-slate-950 text-[11px] font-mono text-slate-500 flex flex-wrap gap-x-2">
                  <span className="text-cyan-500/80">Critères clés recherchés :</span>
                  {pub.criteria.join(' • ')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

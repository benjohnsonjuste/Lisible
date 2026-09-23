'use client';
import React from 'react';
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, Lightbulb, Award, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { key: 'style', label: 'Style' },
  { key: 'intrigue', label: 'Intrigue' },
  { key: 'personnages', label: 'Personnages' },
  { key: 'rythme', label: 'Rythme' },
  { key: 'originalite', label: 'Originalité' },
  { key: 'emotion', label: 'Émotion' },
];

function scoreColor(n) {
  if (n >= 75) return 'text-emerald-400';
  if (n >= 50) return 'text-amber-400';
  return 'text-rose-400';
}
function barColor(n) {
  if (n >= 75) return 'bg-emerald-500';
  if (n >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

export default function CritiquePanel({ data, loading, error, onLaunch, hasText }) {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
        <p className="text-slate-300 font-medium">PlumAI lit votre manuscrit comme un éditeur…</p>
        <p className="text-xs text-slate-500">Analyse du style, des personnages, du rythme et du potentiel — cela prend une vingtaine de secondes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-rose-300 text-sm">{error}</p>
        <button onClick={onLaunch} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium">Réessayer</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4">
        <Sparkles className="w-10 h-10 text-violet-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Critique littéraire par IA</h3>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Recevez une critique complète et honnête de votre texte : note globale, analyse du style,
          de l'intrigue, des personnages et du rythme, points forts, points faibles illustrés
          par des citations, et des conseils concrets d'éditeur pour progresser.
        </p>
        <button
          onClick={onLaunch}
          disabled={!hasText}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 rounded-lg text-sm font-semibold shadow-lg transition-all"
        >
          {hasText ? 'Lancer la critique IA' : 'Collez d\u2019abord votre texte ci-dessus'}
        </button>
      </div>
    );
  }

  const notes = data.notes || {};
  return (
    <div className="space-y-6">
      {/* Note globale + barres */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid md:grid-cols-[auto_1fr] gap-8 items-center">
        <div className="text-center">
          <div className={`text-6xl font-black ${scoreColor(data.noteGlobale)}`}>{data.noteGlobale}<span className="text-2xl text-slate-500">/100</span></div>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Note globale</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {CATEGORIES.map((c) => {
            const v = Number(notes[c.key]) || 0;
            return (
              <div key={c.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">{c.label}</span>
                  <span className={`font-bold ${scoreColor(v)}`}>{v}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${barColor(v)}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé */}
      {data.resume && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h4 className="text-sm font-bold text-slate-200 mb-2 uppercase tracking-wider">En résumé</h4>
          <p className="text-sm text-slate-300 leading-relaxed">{data.resume}</p>
        </div>
      )}

      {/* Forts / Faibles */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-300 mb-4 uppercase tracking-wider">
            <ThumbsUp className="w-4 h-4" /> Points forts
          </h4>
          <ul className="space-y-3">
            {(data.pointsForts || []).map((p, i) => (
              <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                <span className="text-emerald-500 font-bold">•</span><span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-amber-300 mb-4 uppercase tracking-wider">
            <ThumbsDown className="w-4 h-4" /> Points à travailler
          </h4>
          <ul className="space-y-3">
            {(data.pointsFaibles || []).map((p, i) => (
              <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                <span className="text-amber-500 font-bold">•</span><span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conseils */}
      {(data.conseils || []).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-violet-300 mb-4 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" /> Conseils d'éditeur
          </h4>
          <div className="space-y-4">
            {(data.conseils || []).map((c, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-100 mb-1">{i + 1}. {c.titre}</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-2">{c.detail}</p>
                {c.exemple && (
                  <p className="text-xs text-slate-500 italic border-l-2 border-violet-500/50 pl-3">« {c.exemple} »</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict */}
      {data.verdict && (
        <div className="bg-gradient-to-r from-violet-950/60 to-fuchsia-950/40 border border-violet-500/30 rounded-xl p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-violet-200 mb-2 uppercase tracking-wider">
            <Award className="w-4 h-4" /> Verdict
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed">{data.verdict}</p>
        </div>
      )}

      <div className="text-center print:hidden">
        <button onClick={onLaunch} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300">
          Relancer une critique
        </button>
      </div>
    </div>
  );
}

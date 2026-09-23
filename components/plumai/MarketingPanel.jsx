'use client';
import React from 'react';
import { Loader2, Sparkles, Copy, Check, AlertCircle, Megaphone } from 'lucide-react';

function CopyBlock({ label, value, multiline }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</h5>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200 px-2 py-1 bg-slate-800 rounded-md">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      <p className={`text-sm text-slate-200 leading-relaxed ${multiline ? 'whitespace-pre-line' : ''}`}>{value}</p>
    </div>
  );
}

export default function MarketingPanel({ data, loading, error, onLaunch, hasText }) {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
        <p className="text-slate-300 font-medium">PlumAI prépare votre kit de lancement…</p>
        <p className="text-xs text-slate-500">Titres, 4e de couverture, synopsis, pitch et accroches réseaux sociaux.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-rose-300 text-sm">{error}</p>
        <button onClick={onLaunch} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">Réessayer</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4">
        <Megaphone className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Kit marketing de votre livre</h3>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Transformez votre manuscrit en produit qui se vend : 5 titres accrocheurs, 4e de couverture,
          synopsis court et long pour les éditeurs, pitch de 30 secondes, accroches pour réseaux sociaux,
          mots-clés et public cible.
        </p>
        <button
          onClick={onLaunch}
          disabled={!hasText}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 rounded-lg text-sm font-semibold shadow-lg transition-all"
        >
          {hasText ? 'Générer mon kit marketing' : 'Collez d\u2019abord votre texte ci-dessus'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h4 className="text-sm font-bold text-amber-300 mb-4 uppercase tracking-wider">Titres proposés</h4>
        <div className="flex flex-wrap gap-2">
          {(data.titres || []).map((t, i) => (
            <span key={i} className="px-4 py-2 bg-slate-800 border border-amber-500/30 rounded-full text-sm text-slate-100 font-serif italic">{t}</span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <CopyBlock label="4e de couverture" value={data.quatrieme} />
        <CopyBlock label="Pitch — 30 secondes" value={data.pitch} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <CopyBlock label="Synopsis court" value={data.synopsisCourt} />
        <CopyBlock label="Synopsis long (éditeurs)" value={data.synopsisLong} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h4 className="text-sm font-bold text-amber-300 mb-4 uppercase tracking-wider">Accroches réseaux sociaux</h4>
        <div className="space-y-3">
          {(data.accrochesRS || []).map((a, i) => (
            <CopyBlock key={i} label={`Publication ${i + 1}`} value={a} />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h4 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-xs">Mots-clés</h4>
          <div className="flex flex-wrap gap-2">
            {(data.motsCles || []).map((m, i) => (
              <span key={i} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">#{m.replace(/^#/, '')}</span>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h4 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-xs">Public cible</h4>
          <p className="text-sm text-slate-300 leading-relaxed">{data.publicCible}</p>
        </div>
      </div>

      <div className="text-center print:hidden">
        <button onClick={onLaunch} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300">
          Régénérer le kit
        </button>
      </div>
    </div>
  );
}

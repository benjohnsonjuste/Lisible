'use client';
import React, { useState } from 'react';
import { Loader2, Lightbulb, Wand2, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';

const CONSIGNES = [
  { key: 'fluidite', label: 'Plus fluide' },
  { key: 'images', label: 'Plus d\u2019images' },
  { key: 'dialogue', label: 'Dialogues vivants' },
  { key: 'concision', label: 'Plus concis' },
  { key: 'tension', label: 'Plus de tension' },
];

export default function IdeesPanel({ idees, ideesLoading, ideesError, onLaunchIdees, hasText }) {
  const [passage, setPassage] = useState('');
  const [consigne, setConsigne] = useState('fluidite');
  const [reform, setReform] = useState(null);
  const [reformLoading, setReformLoading] = useState(false);
  const [reformError, setReformError] = useState(null);
  const [copied, setCopied] = useState(false);

  const launchReform = async () => {
    if (!passage.trim() || reformLoading) return;
    setReformLoading(true);
    setReformError(null);
    setReform(null);
    try {
      const res = await fetch('/api/plumai/reformuler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage, consigne }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'La réécriture a échoué.');
      setReform(data);
    } catch (e) {
      setReformError(e.message);
    } finally {
      setReformLoading(false);
    }
  };

  const copyReform = async () => {
    try {
      await navigator.clipboard.writeText(reform.reformulation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-8">
      {/* Idées de scènes */}
      <section>
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-100 mb-4">
          <Lightbulb className="w-5 h-5 text-cyan-400" /> Idées pour continuer votre récit
        </h3>
        {ideesLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">PlumAI imagine la suite de votre histoire…</p>
          </div>
        ) : ideesError ? (
          <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
            <p className="text-rose-300 text-sm">{ideesError}</p>
            <button onClick={onLaunchIdees} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm">Réessayer</button>
          </div>
        ) : !idees ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Page blanche ? PlumAI vous propose des scènes inédites, des rebondissements surprenants
              et un conseil personnalisé pour relancer votre inspiration — en cohérence avec votre univers.
            </p>
            <button
              onClick={onLaunchIdees}
              disabled={!hasText}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 rounded-lg text-sm font-semibold transition-all"
            >
              {hasText ? 'Générer des idées' : 'Collez d\u2019abord votre texte ci-dessus'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {(idees.ideesDeScenes || []).map((s, i) => (
                <div key={i} className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5">
                  <p className="text-sm font-bold text-cyan-300 mb-2">{s.titre}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h4 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider text-xs">Rebondissements possibles</h4>
              <ul className="space-y-2">
                {(idees.rebondissements || []).map((r, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-cyan-400 font-bold">↯</span><span>{r}</span></li>
                ))}
              </ul>
            </div>
            {idees.conseilBlocage && (
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-5">
                <p className="text-sm text-cyan-100 leading-relaxed"><span className="font-bold">Conseil anti page blanche : </span>{idees.conseilBlocage}</p>
              </div>
            )}
            <div className="text-center print:hidden">
              <button onClick={onLaunchIdees} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 inline-flex items-center gap-2">
                <RefreshCw className="w-3 h-3" /> D'autres idées
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Réécriture */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-100 mb-2">
          <Wand2 className="w-5 h-5 text-fuchsia-400" /> Réécrire un passage
        </h3>
        <p className="text-sm text-slate-400 mb-4">Collez un paragraphe qui vous pose problème, choisissez une intention, PlumAI le réécrit et explique ses choix.</p>
        <textarea
          value={passage}
          onChange={(e) => setPassage(e.target.value)}
          placeholder="Collez ici le passage à améliorer…"
          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 font-serif leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {CONSIGNES.map((c) => (
            <button
              key={c.key}
              onClick={() => setConsigne(c.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${consigne === c.key ? 'bg-fuchsia-600 border-fuchsia-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              {c.label}
            </button>
          ))}
          <button
            onClick={launchReform}
            disabled={reformLoading || !passage.trim()}
            className="ml-auto px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
          >
            {reformLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Réécrire
          </button>
        </div>
        {reformError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {reformError}
          </div>
        )}
        {reform && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-950 border border-fuchsia-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider">Version réécrite</h5>
                <button onClick={copyReform} className="flex items-center gap-1 text-xs text-fuchsia-300 hover:text-fuchsia-200 px-2 py-1 bg-slate-800 rounded-md">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-serif whitespace-pre-line">{reform.reformulation}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ce qui a changé</h5>
              <ul className="space-y-1.5">
                {(reform.changements || []).map((c, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-fuchsia-400">•</span><span>{c}</span></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

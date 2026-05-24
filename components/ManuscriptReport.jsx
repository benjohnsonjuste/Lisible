'use client';
import React from 'react';
import { Printer, Compass, Wrench, Ban, Flame, Brain, Palette, Scale, MessageSquareCode } from 'lucide-react';
export default function ManuscriptReport({ report }) {
  if (!report) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-200">Tableau de bord de votre manuscrit</h2>
        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 font-medium rounded-lg text-xs transition-all flex items-center space-x-2 shadow-sm print:hidden"><Printer className="w-4 h-4" /><span>Exporter le rapport en PDF</span></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-slate-500"><Brain className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs uppercase font-mono tracking-wider block">Ancrage Mnésique</span></div>
          <span className="text-5xl font-black text-emerald-400 block">{report.metrics?.hookScore}%</span>
          <span className="text-xs text-slate-400 block">Capacité d'empreinte structurelle</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Palette className="w-3.5 h-3.5 text-cyan-400" /><span className="text-xs uppercase font-mono tracking-wider block">Synesthésie de la Prose</span></div>
          <p className="text-sm text-slate-200 font-medium leading-relaxed pt-1">{report.metrics?.rhythmStyle}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Scale className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs uppercase font-mono tracking-wider block">Densité Gravitationnelle</span></div>
          <p className="text-sm text-slate-200 font-medium leading-relaxed pt-1">{report.metrics?.adverbDensity}</p>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xs uppercase font-mono tracking-wider text-slate-500 mb-4">Indicateurs Quantitatifs de Calibre Professionnel</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Diversité lexicale</span><span className="text-xl font-bold text-cyan-400">{report.metrics?.vocabularyRichness || 0}%</span><span className="text-[10px] text-slate-500 block mt-0.5">Mots uniques (TTR)</span></div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Force bio-mécanique</span><span className="text-xl font-bold text-amber-400">{report.metrics?.dynamicCoefficient || 0}%</span><span className="text-[10px] text-slate-500 block mt-0.5">Force active des verbes</span></div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Scories de liaison</span><span className="text-xl font-bold text-rose-400">{report.metrics?.weakVerbsCount || 0}</span><span className="text-[10px] text-slate-500 block mt-0.5">Chevilles syntaxiques</span></div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Temps de lecture</span><span className="text-xl font-bold text-emerald-400">~{report.metrics?.readingTime || 1} min</span><span className="text-[10px] text-slate-500 block mt-0.5">Vitesse humaine</span></div>
        </div>
      </div>
      {report.actionPlan && report.actionPlan.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-md font-bold text-slate-200 flex items-center space-x-2"><Wrench className="w-4 h-4 text-cyan-400" /><span>Feuille de route stratégique de réécriture</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.actionPlan.map((step, index) => (
              <div key={index} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center"><span className="text-[10px] font-mono uppercase font-semibold text-slate-500">{step.target}</span><span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${step.priority === 'Haute' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : step.priority === 'Modérée' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>{step.priority}</span></div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{step.instruction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {report.publisherCompatibility && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-200 flex items-center space-x-2"><Compass className="w-5 h-5 text-emerald-400" /><span>Indice de pénétration éditoriale</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.publisherCompatibility.map((pub, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 space-y-3">
                <div className="flex justify-between items-center"><span className="font-semibold text-sm text-slate-200">{pub.name}</span><span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${pub.score >= 70 ? 'bg-emerald-500/10 text-emerald-400' : pub.score >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>{pub.score}%</span></div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800"><div className={`h-full transition-all duration-500 ${pub.score >= 70 ? 'bg-emerald-500' : pub.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pub.score}%` }} /></div>
                <p className="text-xs text-slate-400 leading-relaxed"><span className="text-slate-500 font-medium">Diagnostic :</span> {pub.reasons}</p>
                <p className="text-xs text-cyan-400 bg-cyan-950/30 p-2 rounded border border-cyan-900/30"><span className="text-cyan-500 font-semibold">Axe d'amélioration :</span> {pub.adjustmentsNeeded}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-1.5 text-slate-500 mb-2"><MessageSquareCode className="w-4 h-4 text-emerald-500" /><span className="text-xs uppercase font-mono tracking-wider block">Synthèse Mécanique du Comité</span></div>
        <blockquote className="border-l-2 border-emerald-500 pl-4 text-slate-300 italic text-base leading-relaxed">"{report.editorialVerdict}"</blockquote>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-md font-bold text-rose-400 flex items-center gap-2"><Ban className="w-4 h-4" /><span>Filtre d'Érosion : Lourdeurs ({report.heavyPhrases?.length || 0})</span></h3>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {report.heavyPhrases?.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-rose-500/10 space-y-2 text-sm">
                <p className="text-rose-300/90 font-serif italic">"{item.text}"</p>
                <p className="text-xs text-slate-400"><strong className="text-slate-300">Critique :</strong> {item.reason}</p>
                <p className="text-xs text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/10 mt-1"><strong className="text-emerald-500">Proposition :</strong> {item.suggestion}</p>
              </div>
            ))}
            {(!report.heavyPhrases || report.heavyPhrases.length === 0) && <p className="text-xs text-slate-500">Fluidité parfaite. Aucune lourdeur majeure syntaxique.</p>}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-md font-bold text-amber-400 flex items-center gap-2"><Flame className="w-4 h-4" /><span>Indice de Cliché Historique ({report.clichesDetected?.length || 0})</span></h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {report.clichesDetected?.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-amber-500/10 flex flex-col space-y-1 text-sm">
                <div className="flex justify-between items-start"><span className="line-through text-amber-300/70 font-mono text-xs">"{item.expression}"</span></div>
                <p className="text-xs text-emerald-400 pt-1"><strong className="text-slate-500 font-normal">Alternative originale :</strong> {item.alternative}</p>
              </div>
            ))}
            {(!report.clichesDetected || report.clichesDetected.length === 0) && <p className="text-xs text-slate-500">Pureté singulière. Aucun cliché ou pléonasme détecté.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { Printer, Compass, Wrench, Ban, Flame, Brain, Palette, Scale, MessageSquareCode, Activity, History, BookOpen, Music } from 'lucide-react';
import AnalyticsCard from './AnalyticsCard';

export default function ManuscriptReport({ report }) {
  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-200">Tableau de bord de votre manuscrit</h2>
        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 font-medium rounded-lg text-xs transition-all flex items-center space-x-2 shadow-sm print:hidden">
          <Printer className="w-4 h-4" /><span>Exporter le rapport en PDF</span>
        </button>
      </div>

      {/* Modules d'Ingénierie Avancée */}
      {report.advancedAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnalyticsCard title="Matrice de Rétention Émotionnelle" icon={Activity} color="indigo" height="h-20">
            <div className="h-full flex items-end gap-0.5">
              {report.advancedAnalytics.emotionalRetention?.chartData?.map((val, i) => (
                <div key={i} className="flex-1 bg-indigo-500/30 rounded-t" style={{ height: `${val}%` }} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 italic">{report.advancedAnalytics.emotionalRetention?.alerts?.[0] || "Engagement stable."}</p>
          </AnalyticsCard>
          
          <AnalyticsCard title="Scan d'Immersion Historique" icon={History} color="purple">
            <ul className="text-xs text-slate-400 space-y-2">
              {report.advancedAnalytics.anachronismScan?.flags?.map((f, i) => <li key={i} className="flex gap-2"><span>⚠️</span> {f.issue}</li>) || <li>Aucun anachronisme détecté.</li>}
            </ul>
          </AnalyticsCard>

          <AnalyticsCard title="Moteur Anti-Incohérences" icon={BookOpen} color="amber">
            <p className="text-sm text-slate-300">{report.advancedAnalytics.continuityCheck?.inconsistencies?.length || 0} ruptures de continuité identifiées.</p>
          </AnalyticsCard>

          <AnalyticsCard title="Ligne de Force Poétique" icon={Music} color="teal">
            <p className="text-xs text-slate-300 italic">"{report.advancedAnalytics.poeticMetric?.soundTexture || "Musicalité équilibrée."}"</p>
          </AnalyticsCard>
        </div>
      )}

      {/* Indicateurs Standard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-slate-500"><Brain className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs uppercase font-mono tracking-wider block">Ancrage Mnésique</span></div>
          <span className="text-5xl font-black text-emerald-400 block">{report.metrics?.hookScore}%</span>
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
        <h3 className="text-xs uppercase font-mono tracking-wider text-slate-500 mb-4">Indicateurs Quantitatifs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Diversité lexicale</span><span className="text-xl font-bold text-cyan-400">{report.metrics?.vocabularyRichness || 0}%</span></div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Force bio-mécanique</span><span className="text-xl font-bold text-amber-400">{report.metrics?.dynamicCoefficient || 0}%</span></div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Scories de liaison</span><span className="text-xl font-bold text-rose-400">{report.metrics?.weakVerbsCount || 0}</span></div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Temps de lecture</span><span className="text-xl font-bold text-emerald-400">~{report.metrics?.readingTime || 1} min</span></div>
        </div>
      </div>
    </div>
  );
}

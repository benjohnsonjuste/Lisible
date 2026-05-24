'use client';
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Loader2, Brain, Activity, History, Music, Flame, Binary, 
  Gauge, MessageSquareCode, ShieldCheck, Palette, Target
} from 'lucide-react';
import AnalyticsCard from './AnalyticsCard';

export default function ManuscriptAnalyzer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
        .then((result) => setText(result.value));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      const data = await response.json();
      setReport(data);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-950 text-slate-100 p-8 rounded-2xl border border-slate-900 max-w-7xl mx-auto space-y-8">
      <header className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Éditomètre v2.0</h1>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <input type="file" accept=".docx" onChange={handleFileUpload} className="mb-4 text-sm" />
        <textarea className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ou collez votre texte ici..." />
        <button onClick={handleAnalyze} disabled={loading} className="px-6 py-3 bg-emerald-600 rounded-lg font-bold flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Lancer l'Audit Chirurgical
        </button>
        <div className="mt-4 p-4 border border-emerald-900/30 bg-emerald-950/20 rounded-lg flex items-start gap-3">
          <ShieldCheck className="text-emerald-500 shrink-0" />
          <p className="text-xs text-slate-400">Garantie Souveraine : Analyse 100% en RAM locale. Votre propriété intellectuelle reste inaliénable.</p>
        </div>
      </section>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalyticsCard title="Matrice Émotionnelle" icon={Activity} color="indigo">
            <div className="flex items-end gap-1 h-16">{report.chartData?.map((v, i) => <div key={i} className="flex-1 bg-indigo-500/30" style={{ height: `${v}%` }} />)}</div>
          </AnalyticsCard>
          <AnalyticsCard title="Spectre Sensoriel" icon={Palette} color="fuchsia">
            <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
               <div style={{width: '40%'}} className="bg-emerald-500" title="Visuel" />
               <div style={{width: '20%'}} className="bg-amber-500" title="Auditif" />
               <div style={{width: '40%'}} className="bg-blue-500" title="Kinesthésique" />
            </div>
            <p className="text-[10px] text-slate-400">Répartition sensorielle active.</p>
          </AnalyticsCard>
          <AnalyticsCard title="Incipit (100 mots)" icon={Sparkles} color="orange">
            <p className="text-2xl font-bold">{report.hookScore}/10</p>
            <p className="text-xs text-slate-400">Indice de captation immédiate.</p>
          </AnalyticsCard>
          <AnalyticsCard title="Signature Stylistique" icon={Binary} color="indigo">
            <p className="text-xs">Influence : <span className="text-emerald-400 font-bold">{report.voicePrint}</span></p>
          </AnalyticsCard>
          <AnalyticsCard title="Score d'Acceptabilité" icon={Target} color="teal">
            <p className="text-xs">Gallimard (Blanche) : <span className="font-bold text-white">{report.gallimardScore}%</span></p>
            <p className="text-xs">XO Éditions : <span className="font-bold text-white">{report.xoScore}%</span></p>
          </AnalyticsCard>
          <AnalyticsCard title="Ajustements Chirurgicaux" icon={Wrench} color="amber">
            <p className="text-xs italic">{report.topImprovement}</p>
          </AnalyticsCard>
        </div>
      )}
    </div>
  );
}

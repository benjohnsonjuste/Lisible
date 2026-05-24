'use client';
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Loader2, Brain, Activity, Palette, Binary, ShieldCheck, 
  Target, Wrench, MessageSquareCode, History, Music, Flame, Gauge
} from 'lucide-react';
import AnalyticsCard from './AnalyticsCard';

export default function PlumAI() {
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
    // Simulation API
    setTimeout(() => {
      setReport({
        hookScore: 8.2,
        voicePrint: "Camus (65%)",
        topImprovement: "Élaguer les incises du chapitre 3.",
        chartData: [40, 65, 30, 90, 55],
      });
      setLoading(false);
    }, 2500);
  };

  return (
    <div className="bg-slate-950 text-slate-100 p-8 rounded-2xl border border-slate-900 max-w-7xl mx-auto space-y-8">
      <header className="border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Éditomètre v2.0</h1>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <input type="file" accept=".docx" onChange={handleFileUpload} className="mb-4 text-xs text-slate-400" />
        <textarea className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Collez votre manuscrit..." />
        <button onClick={handleAnalyze} disabled={loading} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold flex items-center gap-2 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Lancer l'Audit Chirurgical
        </button>
        <div className="mt-4 p-4 border border-emerald-900/30 bg-emerald-950/20 rounded-lg flex items-start gap-3">
          <ShieldCheck className="text-emerald-500 shrink-0" />
          <p className="text-xs text-slate-400">Garantie Souveraine : Analyse 100% en RAM locale. Votre propriété intellectuelle est inaliénable.</p>
        </div>
      </section>

      {report && (
        <div className="space-y-6">
          {/* --- NOUVEAUX MODULES D'INGÉNIERIE --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Module 1 : Le Spectre Sensoriel */}
            <AnalyticsCard title="Spectre Sensoriel" icon={Palette} color="fuchsia">
              <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
                <div style={{width: '40%'}} className="bg-emerald-500" title="Visuel" />
                <div style={{width: '20%'}} className="bg-amber-500" title="Auditif" />
                <div style={{width: '40%'}} className="bg-blue-500" title="Kinesthésique" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Répartition : Visuel 40% | Auditif 20% | Kinesthésique 40%</p>
            </AnalyticsCard>

            {/* Module 2 : Détecteur de Mimétisme */}
            <AnalyticsCard title="Signature Stylistique" icon={Binary} color="indigo">
              <p className="text-xs text-slate-300">Influence détectée : <span className="text-emerald-400 font-bold">{report.voicePrint}</span></p>
              <p className="text-[10px] text-slate-500 italic mt-1">Vous restez très proche des structures syntaxiques de l'existentialisme.</p>
            </AnalyticsCard>

            {/* Module 3 : Le "Crash Test" des 100 mots */}
            <AnalyticsCard title="Magnétisme de l'Incipit" icon={Sparkles} color="orange">
              <p className="text-lg font-bold text-slate-100">{report.hookScore}/10</p>
              <p className="text-xs text-slate-400">Vos 100 premiers mots créent une tension immédiate.</p>
            </AnalyticsCard>
          </div>
        </div>
      )}
    </div>
  );
}

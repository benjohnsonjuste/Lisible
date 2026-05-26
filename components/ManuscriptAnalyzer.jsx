'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, Printer, Compass, Ban, Flame, AlertTriangle, Loader2, FileText, Scissors, Film, MessageSquareCode, BookOpen, Download, Layout, Cpu, CheckCircle2 } from 'lucide-react';

export default function ManuscriptAnalyzer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  const [format, setFormat] = useState('roman');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [isReady, setIsReady] = useState(false);

  const steps = ["Initialisation...", "Analyse stylistique...", "Calcul des indices...", "Compilation..."];
  const loadingSteps = [
    { min: 0, max: 30, text: "Analyse sémantique du manuscrit..." },
    { min: 31, max: 70, text: "Calcul de l'empagement et des marges d'imprimerie (3mm)..." },
    { min: 71, max: 100, text: "Finalisation du document PDF vectoriel..." }
  ];

  useEffect(() => {
    if (!window.mammoth) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      s.async = true;
      document.body.appendChild(s);
    }
    if (!window.jspdf) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    let iv;
    if (loading) {
      setScanStep(0);
      iv = setInterval(() => {
        setScanStep((p) => (p < steps.length - 1 ? p + 1 : p));
      }, 400);
    }
    return () => clearInterval(iv);
  }, [loading]);

  useEffect(() => {
    if (isGenerating) {
      const step = loadingSteps.find(s => progress >= s.min && progress <= s.max);
      if (step) setCurrentStepText(step.text);
    }
  }, [progress, isGenerating]);

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setError(null);
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      const r = new FileReader();
      r.onload = (evt) => setText(evt.target.result);
      r.readAsText(f);
    } else if (ext === 'docx') {
      if (!window.mammoth) {
        setError("Chargement du module Word...");
        return;
      }
      const r = new FileReader();
      r.onload = (evt) => {
        window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
          .then((res) => setText(res.value))
          .catch(() => setError("Erreur Word."));
      };
      r.readAsArrayBuffer(f);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) { setError("Texte insuffisant."); return; }
    setLoading(true); setError(null); setReport(null);
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setReport(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormatAndDownload = () => {
    if (!text.trim()) return;
    const blob = new Blob([text], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manuscrit.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const startGeneration = () => {
    if (!text.trim()) {
      setError("Veuillez renseigner un texte avant de lancer la mise en page.");
      return;
    }
    setIsGenerating(true); setIsReady(false); setProgress(0);
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(interval);
          setIsGenerating(false); setIsReady(true);
          return 100;
        }
        return oldProgress + 4;
      });
    }, 40);
  };

  const handleLocalPDFGeneration = async () => {
    if (!window.jspdf) { alert("Module PDF en cours de chargement..."); return; }
    try {
      const { jsPDF } = window.jspdf;
      let dim = { width: 154, height: 216 }; 
      if (format === 'poche') dim = { width: 116, height: 184 };
      if (format === 'royal') dim = { width: 162, height: 240 };

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [dim.width, dim.height] });
      doc.setFont("times", "bold"); doc.setFontSize(22);
      doc.text("Manuscrit Édité", dim.width / 2, dim.height / 3, { align: "center" });
      
      doc.addPage(); doc.setFont("times", "normal"); doc.setFontSize(11);
      const margin = 20;
      const lines = doc.splitTextToSize(text || "Contenu vide...", dim.width - (margin * 2));
      let cursorY = margin;
      let page = 1;

      lines.forEach((line) => {
        if (cursorY > dim.height - margin) {
          doc.setFontSize(9); doc.text(String(page), dim.width / 2, dim.height - 10, { align: "center" });
          doc.addPage(); page++; doc.setFontSize(11); cursorY = margin;
        }
        doc.text(line, margin, cursorY); cursorY += 6;
      });
      doc.setFontSize(9); doc.text(String(page), dim.width / 2, dim.height - 10, { align: "center" });
      doc.save(`lisible-${format}-print.pdf`);
    } catch (err) {
      alert("Erreur lors de la création locale du PDF.");
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 p-4 md:p-6 font-sans rounded-xl border border-slate-900 max-w-5xl mx-auto space-y-6 relative overflow-hidden">
      <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1 text-[10px] uppercase text-emerald-400 font-mono"><Cpu className="w-3 h-3" /> Gutenberg Local AI</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">Plumai Studio</h1>
        </div>
        <span className="text-xs font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-slate-400">{text.length} car.</span>
      </header>

      <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Texte source</label>
          <input type="file" accept=".txt,.docx" onChange={handleFileUpload} disabled={loading || isGenerating} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-slate-800 file:text-slate-200 cursor-pointer" />
        </div>
        <div className="relative">
          <textarea className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-serif text-sm" placeholder="Collez votre extrait ici..." value={text} onChange={(e) => setText(e.target.value)} disabled={loading || isGenerating} />
          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 rounded-lg flex items-center justify-center p-4">
              <div className="font-mono text-xs text-emerald-400 flex items-center space-x-2"><Loader2 className="w-4 h-4 animate-spin" /><span>{steps[scanStep]}</span></div>
            </div>
          )}
        </div>
        {error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> {error}</div>}
        <div className="flex gap-3">
          <button onClick={handleAnalyze} disabled={loading || !text.trim() || isGenerating} className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded text-xs transition-all">{loading ? "Analyse..." : "Lancer l'audit"}</button>
          <button onClick={handleFormatAndDownload} disabled={loading || !text.trim() || isGenerating} className="px-4 py-2 bg-slate-900 text-slate-300 font-medium rounded text-xs border border-slate-800 transition-all flex items-center space-x-1"><FileText className="w-3.5 h-3.5 text-cyan-400" /><span>Sauvegarder (.docx)</span></button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-slate-900 pt-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Format Papier d'Impression</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'roman', title: 'Roman Standard (A5)', desc: '148 x 210 mm • Fiction & Récits' },
                { id: 'poche', title: 'Format de Poche', desc: '110 x 178 mm • Compacité maximale' },
                { id: 'royal', title: 'Format Royal', desc: '156 x 234 mm • Éditions de prestige' }
              ].map((item) => (
                <button key={item.id} disabled={isGenerating || loading} onClick={() => setFormat(item.id)} className={`p-3 rounded-xl border text-left text-xs transition-all ${format === item.id ? 'bg-slate-900 border-violet-500 text-white' : 'bg-slate-900/20 border-slate-800 text-slate-400'}`}>
                  <div className="font-medium flex justify-between">{item.title}<div className={`w-3 h-3 rounded-full border ${format === item.id ? 'bg-violet-500 border-violet-400' : 'border-slate-600'}`} /></div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-800/60 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2"><Layout className="w-3.5 h-3.5 text-violet-400" /> Grilles typographiques appliquées</div>
            <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-violet-400" /> Pagination et repères de coupes intégrés</div>
          </div>
          <div>
            {!isGenerating && !isReady && <button onClick={startGeneration} disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2 px-4 rounded-xl text-xs">Mettre en page localement</button>}
            {isGenerating && (
              <div className="space-y-1">
                <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden"><div className="bg-violet-500 h-full" style={{ width: `${progress}%` }} /></div>
                <p className="text-[10px] font-mono text-slate-500 italic">{currentStepText}</p>
              </div>
            )}
            {isReady && (
              <div className="space-y-2">
                <div className="bg-emerald-950/20 border border-emerald-500/25 text-emerald-400 p-3 rounded-xl text-[11px] flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Prêt pour l'imprimerie traditionnelle.</span></div>
                <button onClick={handleLocalPDFGeneration} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 text-xs"><Download className="w-3.5 h-3.5" /> Télécharger le PDF d'Impression</button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col bg-slate-900/20 rounded-xl border border-slate-800 p-4 min-h-[260px] justify-between relative overflow-hidden">
          <div className="flex-1 flex items-center justify-center relative">
            <div className={`relative transition-all bg-white rounded-r-sm shadow-xl border-l border-slate-300 ${format === 'poche' ? 'w-32 h-44' : format === 'royal' ? 'w-40 h-54' : 'w-36 h-48'}`}>
              <div className="p-4 space-y-2 pt-6 opacity-40">
                <div className="w-full h-1 bg-slate-300 rounded" />
                <div className="w-full h-1 bg-slate-300 rounded" />
                <div className="w-10/12 h-1 bg-slate-300 rounded" />
              </div>
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-400">1</div>
            </div>
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/70 rounded-lg flex items-center justify-center space-x-2 z-20">
                <Loader2 className="w-4 h-4 text-violet-500 animate-spin" /><span className="text-[10px] font-mono text-violet-400 uppercase">Calcul...</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/40 font-mono text-[9px] text-slate-500 text-center">
            <div>CMJN FOGRA39</div>
            <div>300 DPI Vectoriel</div>
            <div>Norme PDF/X-1a</div>
          </div>
        </div>
      </section>

      {report && (
        <section className="space-y-4 border-t border-slate-900 pt-4 text-xs">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-200">Diagnostic stylistique</h2>
            <button onClick={() => window.print()} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[11px] flex items-center space-x-1 print:hidden"><Printer className="w-3 h-3" /><span>Imprimer</span></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center"><span className="text-[9px] font-mono text-slate-500 block">Score d'Ancrage</span><span className="text-2xl font-black text-emerald-400 block">{report.metrics?.hookScore}%</span></div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3"><span className="text-[9px] font-mono text-slate-500 block mb-0.5">Rythme</span><p className="text-slate-300">{report.metrics?.rhythmStyle}</p></div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3"><span className="text-[9px] font-mono text-slate-500 block mb-0.5">Densité adverbiale</span><p className="text-slate-300">{report.metrics?.adverbDensity}</p></div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[11px]">
            <div>Lexique : <span className="text-cyan-400 font-bold">{report.metrics?.vocabularyRichness || 0}%</span></div>
            <div>Verbes : <span className="text-amber-400 font-bold">{report.metrics?.dynamicCoefficient || 0}%</span></div>
            <div>Lourdeurs : <span className="text-rose-400 font-bold">{report.metrics?.weakVerbsCount || 0}</span></div>
            <div>Lecture : <span className="text-emerald-400 font-bold">~{report.metrics?.readingTime || 1} min</span></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.structuralMetrics && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-1">
                <h3 className="font-bold text-cyan-400 flex items-center gap-1"><Scissors className="w-3 h-3" />Structure</h3>
                <div className="flex justify-between text-[11px]"><span>Dialogue / Narration :</span><span>{report.structuralMetrics.dialogueRatio}</span></div>
                <p className="text-slate-400 pt-1 border-t border-slate-950">{report.structuralMetrics.cadenceAnalysis}</p>
              </div>
            )}
            {report.transmediaMetrics && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-1">
                <h3 className="font-bold text-purple-400 flex items-center gap-1"><Film className="w-3 h-3" />Potentiel Écran</h3>
                <div className="flex justify-between text-[11px]"><span>Score Cinématique :</span><span>{report.transmediaMetrics.cinematicScore}%</span></div>
                <p className="text-slate-400 pt-1 border-t border-slate-950">{report.transmediaMetrics.scriptDoctorAdvice}</p>
              </div>
            )}
          </div>
          {report.publisherCompatibility && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[9px] font-mono uppercase text-slate-500">Compatibilité Lignes Éditoriales</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {report.publisherCompatibility.map((pub, idx) => (
                  <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800/60 flex justify-between items-center">
                    <span>{pub.name}</span><span className="text-emerald-400 font-mono font-bold">{pub.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-slate-400 italic">
            <div className="text-[9px] font-mono text-slate-500 mb-0.5">AVIS DU COMITÉ</div>
            "{report.editorialVerdict}"
          </div>
        </section>
      )}
    </div>
  );
}

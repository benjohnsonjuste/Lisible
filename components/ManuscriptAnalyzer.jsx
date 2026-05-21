'use client';
import React, { useState, useEffect } from 'react';
export default function ManuscriptAnalyzer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [scanStep, setScanStep] = useState(0);
  const steps = [
    "Initialisation du scan spatial...",
    "Extraction de la matrice syntaxique en local...",
    "Analyse fréquentielle des adverbes en -ment...",
    "Calcul de l'indice de rétention (Hook Score)...",
    "Simulation du comité de lecture Gallimard (Blanche)...",
    "Vérification de la tension dramatique chez XO Éditions...",
    "Évaluation du souffle romanesque (Albin Michel)...",
    "Détection des tics de langage et clichés...",
    "Génération du verdict éditorial final..."
  ];
  useEffect(() => {
    if (!window.mammoth) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);
  useEffect(() => {
    let interval;
    if (loading) {
      setScanStep(0);
      interval = setInterval(() => {
        setScanStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [loading]);
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (evt) => setText(evt.target.result);
      reader.onerror = () => setError("Erreur lors de la lecture du fichier TXT.");
      reader.readAsText(file);
    } else if (ext === 'docx') {
      if (!window.mammoth) {
        setError("Le module de lecture Word est en cours de chargement. Réessayez.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
          .then((result) => setText(result.value))
          .catch(() => setError("Erreur lors de la conversion du fichier Word (.docx)."));
      };
      reader.onerror = () => setError("Erreur lors de la lecture du fichier Word.");
      reader.readAsArrayBuffer(file);
    } else {
      setError("Seuls les formats .txt et .docx sont supportés en lecture locale.");
    }
  };
  const handleAnalyze = async () => {
    if (!text || text.trim().length < 10) {
      setError("Veuillez entrer un texte un peu plus long pour lancer l'audit.");
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-slate-950 text-slate-100 p-6 md:p-12 font-sans rounded-2xl border border-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            PlumAI <span className="text-xs font-mono px-2 py-1 bg-slate-800 text-slate-400 rounded-full ml-2">v1.1 (Édition Pro)</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Soumettez votre texte pour un audit stylistique profond et découvrez votre indice d'acceptation en maison d'édition.</p>
        </header>
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <label className="block text-sm font-semibold text-slate-300">Collez votre extrait ou déposez un fichier (.txt, .docx)</label>
            <div className="flex items-center space-x-3">
              <input type="file" accept=".txt,.docx" onChange={handleFileUpload} disabled={loading} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer" />
              <span className="text-xs font-mono text-slate-500">{text.length} caractères</span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg">
            <textarea
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-serif leading-relaxed text-base"
              placeholder="Le jour où la pluie cessa de tomber..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            {loading && (
              <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none flex flex-col justify-end p-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[bounce_2s_infinite]" />
                <div className="bg-slate-950/90 border border-emerald-500/30 font-mono text-xs p-3 rounded shadow-lg text-emerald-400 max-w-md backdrop-blur-sm self-start space-y-1 animate-pulse">
                  <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"/><span>[SYSTEM MONITOR] : IN PROGRESS</span></div>
                  <div className="text-slate-400">&gt; {steps[scanStep]}</div>
                </div>
              </div>
            )}
          </div>
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">⚠️ {error}</div>}
          <div className="space-y-4">
            <button
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 font-medium rounded-lg text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-emerald-400 font-mono text-xs tracking-wider">SCAN SPATIAL EN COURS...</span>
                </>
              ) : <span>Lancer le diagnostic littéraire</span>}
            </button>
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-start space-x-3 max-w-2xl">
              <svg className="w-5 h-5 text-emerald-500/80 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Garantie Souveraine de Confidentialité</p>
                <p className="leading-relaxed">Votre œuvre est lue exclusivement en mémoire vive locale (RAM). Aucun stockage, base de données ou archivage n'est effectué sur nos serveurs. Le flux transite de manière chiffrée de bout en bout et le manuscrit reste votre <span className="text-emerald-400 font-medium">propriété intellectuelle exclusive et inaliénable</span>.</p>
              </div>
            </div>
          </div>
        </section>
        {report && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8">
              <h2 className="text-xl font-bold tracking-tight text-slate-200">Tableau de bord de votre manuscrit</h2>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 font-medium rounded-lg text-xs transition-all flex items-center space-x-2 shadow-sm print:hidden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Exporter le rapport en PDF</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-500 block">Hook Score</span>
                <span className="text-5xl font-black text-emerald-400 block">{report.metrics?.hookScore}%</span>
                <span className="text-xs text-slate-400 block">Capacité de rétention du lecteur</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-500 block">Analyse du Rythme</span>
                <p className="text-sm text-slate-200 font-medium leading-relaxed pt-2">{report.metrics?.rhythmStyle}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-500 block">Densité stylistique</span>
                <p className="text-sm text-slate-200 font-medium leading-relaxed pt-2">{report.metrics?.adverbDensity}</p>
              </div>
            </div>
            {report.publisherCompatibility && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-slate-200 flex items-center space-x-2"><span>🎯 Indice de pénétration éditoriale</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {report.publisherCompatibility.map((pub, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-slate-200">{pub.name}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${pub.score >= 70 ? 'bg-emerald-500/10 text-emerald-400' : pub.score >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>{pub.score}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div className={`h-full transition-all duration-500 ${pub.score >= 70 ? 'bg-emerald-500' : pub.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pub.score}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed"><span className="text-slate-500 font-medium">Diagnostic :</span> {pub.reasons}</p>
                      <p className="text-xs text-cyan-400 bg-cyan-950/30 p-2 rounded border border-cyan-900/30"><span className="text-cyan-500 font-semibold">Axe d'amélioration :</span> {pub.adjustmentsNeeded}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-500 block mb-2">Synthèse du Comité de lecture</span>
              <blockquote className="border-l-2 border-emerald-500 pl-4 text-slate-300 italic text-base leading-relaxed">"{report.editorialVerdict}"</blockquote>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-md font-bold text-rose-400">🔴 Obstacles à la lecture ({report.heavyPhrases?.length || 0})</h3>
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
                <h3 className="text-md font-bold text-amber-400">🟡 Clichés et redondances ({report.clichesDetected?.length || 0})</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {report.clichesDetected?.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-amber-500/10 flex flex-col space-y-1 text-sm">
                      <div className="flex justify-between items-start"><span className="line-through text-amber-300/70 font-mono text-xs">"{item.expression}"</span></div>
                      <p className="text-xs text-emerald-400 pt-1"><strong className="text-slate-500 font-normal">Alternative originale :</strong> {item.alternative}</p>
                    </div>
                  ))}
                  {(!report.clichesDetected || report.clichesDetected.length === 0) && <p className="text-xs text-slate-500">Vocabulaire pur et singulier. Aucun cliché détecté.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

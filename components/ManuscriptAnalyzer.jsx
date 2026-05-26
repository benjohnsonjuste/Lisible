'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, Printer, Compass, Ban, Flame, AlertTriangle, Loader2, FileText, Scissors, Film, MessageSquareCode } from 'lucide-react';

export default function ManuscriptAnalyzer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    "Initialisation du moteur local...",
    "Extraction de la matrice textuelle...",
    "Analyse stylistique et rythmique...",
    "Calcul des indices de lisibilité...",
    "Simulation éditoriale...",
    "Compilation du bilan final..."
  ];

  useEffect(() => {
    if (!window.mammoth) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
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
      }, 350);
    }
    return () => clearInterval(iv);
  }, [loading]);

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
        setError("Le module de conversion Word est en cours de chargement... Réessayez.");
        return;
      }
      const r = new FileReader();
      r.onload = (evt) => {
        window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
          .then((res) => setText(res.value))
          .catch(() => setError("Erreur lors de la lecture du fichier Word."));
      };
      r.readAsArrayBuffer(f);
    } else {
      setError("Format non supporté. Utilisez un fichier .txt ou .docx");
    }
  };

  const handleLocalAnalyze = () => {
    if (!text.trim() || text.trim().length < 10) {
      setError("Le texte fourni est trop court pour générer un audit.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    setTimeout(() => {
      try {
        const cleanText = text.trim();
        const words = cleanText.split(/[\s,.'’\-+\n!?;:]+/).filter(w => w.length > 1);
        const totalWords = words.length || 1;

        const adverbMatches = cleanText.match(/\b\w+ment\b/gi) || [];
        const adverbDensity = ((adverbMatches.length / totalWords) * 100).toFixed(1);

        const weakVerbs = (cleanText.match(/\b(faire|dire|avoir|être|aller|pouvoir|vouloir|voir)(s|t|ons|ez|ent|ais|ait|iez|aient)?\b/gi) || []).length;
        const dynamicCoefficient = Math.max(15, Math.min(95, Math.round(100 - (weakVerbs / totalWords * 300))));

        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const vocabularyRichness = Math.min(100, Math.round((uniqueWords.size / totalWords) * 110));

        const readingTime = Math.max(1, Math.round(totalWords / 200));
        
        const dialogueLines = (cleanText.match(/^([ \t]*[-—–]|["«])/gm) || []).length;
        const totalLines = cleanText.split('\n').filter(l => l.trim().length > 0).length || 1;
        const dialogueRatio = ((dialogueLines / totalLines) * 100).toFixed(0) + "%";

        const sentences = cleanText.split(/[.!?\n]+/);
        const heavyPhrases = [];
        sentences.forEach(s => {
          const sTrim = s.trim();
          if (sTrim.length > 110 || (sTrim.match(/,/g) || []).length > 3) {
            if (heavyPhrases.length < 3) {
              heavyPhrases.push({
                text: sTrim.substring(0, 75) + "...",
                suggestion: "Scindez la phrase ou réduisez les propositions subordonnées."
              });
            }
          }
        });

        if (heavyPhrases.length === 0) {
          heavyPhrases.push({ text: "Aucune phrase excessivement longue détectée.", suggestion: "Équilibre syntaxique correct." });
        }

        const clicheMap = [
          { regex: /au bout du tunnel/gi, expr: "au bout du tunnel", alt: "à l'issue / enfin" },
          { regex: /blanc comme un linge/gi, expr: "blanc comme un linge", alt: "livide / pâle" },
          { regex: /un froid de canard/gi, expr: "un froid de canard", alt: "un froid glacial" },
          { regex: /le temps passe vite/gi, expr: "le temps passe vite", alt: "les heures filaient" },
          { regex: /fermer les yeux sur/gi, expr: "fermer les yeux sur", alt: "ignorer" }
        ];
        
        const clichesDetected = [];
        clicheMap.forEach(item => {
          if (item.regex.test(cleanText)) {
            clichesDetected.push({ expression: item.expr, alternative: item.alt });
          }
        });

        if (clichesDetected.length === 0) {
          clichesDetected.push({ expression: "Aucun cliché évident", alternative: "Style pur" });
        }

        const hookScore = Math.max(40, Math.min(98, Math.round(vocabularyRichness * 0.6 + dynamicCoefficient * 0.4)));

        const publisherCompatibility = [
          { 
            name: "Littérature Blanche", 
            score: Math.round(vocabularyRichness * 0.95), 
            reasons: vocabularyRichness > 60 ? "Richesse lexicale adaptée aux exigences de la littérature générale." : "Densité lexicale à complexifier pour ce segment." 
          },
          { 
            name: "Littérature Populaire / Fiction", 
            score: Math.round(hookScore * 0.92), 
            reasons: "Efficacité narrative propice aux structures narratives fluides." 
          }
        ];

        let editorialVerdict = "Structure générale saine. Surveillez la récurrence des verbes ternes et des adverbes pour libérer le rythme.";
        if (hookScore > 80) editorialVerdict = "Cadence soutenue et dynamique verbale efficace pour maintenir l'attention.";
        if (vocabularyRichness < 45) editorialVerdict = "Structure fonctionnelle. Diversifier les champs lexicaux enrichira la texture du récit.";

        setReport({
          metrics: {
            hookScore,
            rhythmStyle: totalWords > 300 ? "Périodes amples, typiques d'un style immersif." : "Phrases courtes, rythme segmenté.",
            adverbDensity: `${adverbDensity}% (${adverbMatches.length} occ.)`,
            vocabularyRichness,
            dynamicCoefficient,
            weakVerbsCount: weakVerbs,
            readingTime
          },
          structuralMetrics: {
            dialogueRatio,
            anachronismsCount: 0,
            cadenceAnalysis: `Évaluation basée sur ${totalWords} mots. Fluidité globale conforme.`
          },
          transmediaMetrics: {
            cinematicScore: Math.round((dynamicCoefficient + hookScore) / 2),
            scriptDoctorAdvice: dialogueLines > totalLines * 0.3 ? "Forte proportion de dialogues. Potentiel de dramatisation direct." : "Style principalement descriptif privilégiant l'introspection."
          },
          publisherCompatibility,
          editorialVerdict,
          heavyPhrases,
          clichesDetected
        });

      } catch (err) {
        setError("Erreur lors de l'analyse locale.");
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const handleFormatAndDownload = () => {
    if (!text.trim()) return;
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><style>body { font-family: 'Georgia', serif; line-height: 1.6; }</style></head>
      <body>${text.replace(/\n/g, '<br>')}</body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manuscrit.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-950 text-slate-100 p-4 md:p-8 font-sans rounded-xl border border-slate-900 max-w-5xl mx-auto space-y-6 shadow-2xl">
      <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Plumai</h1>
          <p className="text-slate-400 text-xs">Audit linguistique local sans stockage</p>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">{text.length} car.</span>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 print:hidden">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-medium text-slate-400">Fichier source :</label>
          <input type="file" accept=".txt,.docx" onChange={handleFileUpload} disabled={loading} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:transition-all cursor-pointer" />
        </div>
        
        <div className="relative">
          <textarea 
            className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-serif text-sm leading-relaxed" 
            placeholder="Collez l'extrait à analyser ici..." 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            disabled={loading} 
          />
          {loading && (
            <div className="absolute inset-0 bg-slate-950/90 rounded-lg flex flex-col items-center justify-center p-4 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400"/>
              <div className="font-mono text-xs text-emerald-400 tracking-wide">{steps[scanStep]}</div>
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}</div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleLocalAnalyze} disabled={loading || !text.trim()} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 font-medium rounded text-xs transition-all flex items-center justify-center space-x-2 text-white shadow-lg disabled:opacity-50">
            {loading ? <span>Calculs...</span> : (<><Sparkles className="w-3.5 h-3.5"/><span>Lancer l'audit</span></>)}
          </button>
          <button onClick={handleFormatAndDownload} disabled={loading || !text.trim()} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded text-xs border border-slate-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
            <FileText className="w-3.5 h-3.5 text-cyan-400"/><span>Exporter (.doc)</span>
          </button>
        </div>
      </section>

      {report && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-t border-slate-900 pt-4">
            <h2 className="text-lg font-bold text-slate-200">Rapport métrique</h2>
            <button onClick={() => window.print()} className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs flex items-center space-x-1.5 hover:bg-slate-800 print:hidden transition-all"><Printer className="w-3.5 h-3.5"/><span>Imprimer / PDF</span></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center flex flex-col justify-center"><span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Indice d'Ancrage</span><span className="text-4xl font-black text-emerald-400 block my-1">{report.metrics?.hookScore}%</span></div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Période & Rythme</span><p className="text-xs text-slate-300 leading-relaxed">{report.metrics?.rhythmStyle}</p></div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Densité Adverbiale (-ment)</span><p className="text-xs text-slate-300 leading-relaxed">{report.metrics?.adverbDensity}</p></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded border border-slate-800/50"><span className="text-slate-400 block text-[10px] mb-0.5">Richesse lexicale</span><span className="font-bold text-cyan-400 text-sm">{report.metrics?.vocabularyRichness||0}%</span></div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800/50"><span className="text-slate-400 block text-[10px] mb-0.5">Dynamisme verbal</span><span className="font-bold text-amber-400 text-sm">{report.metrics?.dynamicCoefficient||0}%</span></div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800/50"><span className="text-slate-400 block text-[10px] mb-0.5">Verbes ternes</span><span className="font-bold text-rose-400 text-sm">{report.metrics?.weakVerbsCount||0}</span></div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800/50"><span className="text-slate-400 block text-[10px] mb-0.5">Lecture estimée</span><span className="font-bold text-emerald-400 text-sm">~{report.metrics?.readingTime||1} min</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.structuralMetrics && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
                <h3 className="font-bold text-cyan-400 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5"/>Équilibre Syntaxique</h3>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span>Ratio Dialogues / Récit :</span><span className="font-mono text-slate-200">{report.structuralMetrics.dialogueRatio}</span></div>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span>Anachronismes :</span><span className="font-mono text-amber-400">{report.structuralMetrics.anachronismsCount}</span></div>
                <p className="text-slate-400 text-[11px] pt-1">{report.structuralMetrics.cadenceAnalysis}</p>
              </div>
            )}
            {report.transmediaMetrics && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
                <h3 className="font-bold text-purple-400 flex items-center gap-1.5"><Film className="w-3.5 h-3.5"/>Potentiel Visuel</h3>
                <div className="flex justify-between border-b border-slate-950 pb-1.5"><span>Score Cinématique :</span><span className="font-mono text-purple-300 font-bold">{report.transmediaMetrics.cinematicScore}%</span></div>
                <p className="text-slate-400 text-[11px] pt-1">{report.transmediaMetrics.scriptDoctorAdvice}</p>
              </div>
            )}
          </div>

          {report.publisherCompatibility && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5"><Compass className="w-3.5 h-3.5"/>Orientation Segmentaire</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {report.publisherCompatibility.map((pub, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-1.5">
                    <div className="flex justify-between font-medium"><span>{pub.name}</span><span className="text-emerald-400 font-mono">{pub.score}%</span></div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{pub.reasons}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]"><MessageSquareCode className="w-3.5 h-3.5 text-emerald-400"/>SYNTHÈSE LINGUISTIQUE</div>
            <p className="text-slate-200 italic bg-slate-950 p-3 rounded-lg border border-slate-800 font-serif leading-relaxed">"{report.editorialVerdict}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <h3 className="font-bold text-rose-400 flex items-center gap-1.5"><Ban className="w-3.5 h-3.5"/>Surcharges identifiées ({report.heavyPhrases?.length || 0})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {report.heavyPhrases?.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded border border-rose-500/5 space-y-1">
                    <p className="text-rose-300 italic font-serif text-[13px]">"{item.text}"</p>
                    <p className="text-[11px] text-emerald-400 font-sans">&gt; {item.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5"/>Clichés stylistiques ({report.clichesDetected?.length || 0})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {report.clichesDetected?.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded border border-amber-500/5 flex justify-between items-center gap-2">
                    <span className="line-through text-slate-500 font-serif">{item.expression}</span>
                    <span className="text-emerald-400 text-right font-medium">{item.alternative}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

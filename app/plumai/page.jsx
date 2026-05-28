'use client';
import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import WorkspaceArea from '@/components/editorial/WorkspaceArea';
import MetricsDashboard from '@/components/editorial/MetricsDashboard';
import EditorialReport from '@/components/editorial/EditorialReport';
import CharacterAuditPanel from '@/components/editorial/CharacterAuditPanel';
import TimelineContinuityPanel from '@/components/editorial/TimelineContinuityPanel';

export default function ManuscriptAnalyzer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [report, setReport] = useState(null);
  const [marketingData, setMarketingData] = useState(null);
  const [characterReport, setCharacterReport] = useState(null);
  const [timelineReport, setTimelineReport] = useState(null);
  const [error, setError] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    "Initialisation du scan spatial synoptique...",
    "Extraction de la matrice syntaxique locale (RAM)...",
    "Mesure du filtre d'érosion textuelle...",
    "Calcul de l'indice d'ancrage mnésique structural...",
    "Compilation du bilan d'ingénierie éditoriale final..."
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
      }, 700);
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
        setError("Module Word en cours de chargement.");
        return;
      }
      const r = new FileReader();
      r.onload = (evt) => {
        window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
          .then((res) => setText(res.value))
          .catch(() => setError("Erreur de conversion du fichier Word."));
      };
      r.readAsArrayBuffer(f);
    } else {
      setError("Seuls les formats .txt et .docx sont supportés.");
    }
  };

  const handleAnalyze = async () => {
    if (!text || text.trim().length < 10) return;
    setLoading(true);
    setError(null);
    try {
      const rAnalyze = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      const dAnalyze = await rAnalyze.json();
      if (!rAnalyze.ok) throw new Error(dAnalyze.error);
      setReport(dAnalyze);

      const rCharacter = await fetch('/api/character-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      if (rCharacter.ok) {
        const dChar = await rCharacter.json();
        setCharacterReport(dChar);
      }

      const rTimeline = await fetch('/api/timeline-continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      if (rTimeline.ok) {
        const dTime = await rTimeline.json();
        setTimelineReport(dTime);
      }

      const rMarketing = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      if (rMarketing.ok) {
        const dMarketing = await rMarketing.json();
        setMarketingData(dMarketing);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormatAndDownload = async () => {
    if (!text || text.trim().length < 10) return;
    setIsFormatting(true);
    try {
      const response = await fetch('/api/format-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      if (!response.ok) throw new Error("Échec du formatage serveur.");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manuscrit_mise_en_page_impeccable.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 p-6 md:p-12 font-sans rounded-2xl border border-slate-900 max-w-5xl mx-auto space-y-8">
      <header className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
          PlumLocal <span className="text-xs font-mono px-2 py-1 bg-slate-800 text-slate-400 rounded-full">v2.1 (Arborescence Racine Directe)</span>
        </h1>
      </header>

      <WorkspaceArea 
        text={text} setText={setText} loading={loading} isFormatting={isFormatting} error={error}
        steps={steps} scanStep={scanStep} handleFileUpload={handleFileUpload}
        handleAnalyze={handleAnalyze} handleFormatAndDownload={handleFormatAndDownload}
      />

      {report && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mt-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-200">Tableau de bord de votre manuscrit</h2>
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 font-medium rounded-lg text-xs flex items-center space-x-2 print:hidden">
              <Printer className="w-4 h-4"/><span>Exporter le rapport</span>
            </button>
          </div>
          <MetricsDashboard report={report} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CharacterAuditPanel data={characterReport} />
            <TimelineContinuityPanel data={timelineReport} />
          </div>
          <EditorialReport report={report} marketingData={marketingData} />
        </div>
      )}
    </div>
  );
}

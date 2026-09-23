'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Sparkles, BarChart3, MessageCircle, Megaphone, Lightbulb } from 'lucide-react';
import WorkspaceArea from '@/components/editorial/WorkspaceArea';
import MetricsDashboard from '@/components/editorial/MetricsDashboard';
import EditorialReport from '@/components/editorial/EditorialReport';
import CharacterAuditPanel from '@/components/editorial/CharacterAuditPanel';
import TimelineContinuityPanel from '@/components/editorial/TimelineContinuityPanel';
import BetaReadingPanel from '@/components/editorial/BetaReadingPanel';
import InteractiveProofreader from '@/components/editorial/InteractiveProofreader';
import NeuroSynesthesiaPanel from '@/components/editorial/NeuroSynesthesiaPanel';
import StylisticMimicryPanel from '@/components/editorial/StylisticMimicryPanel';
import ClassicalAncestryPanel from '@/components/editorial/ClassicalAncestryPanel';
import PublisherMatchingPanel from '@/components/editorial/PublisherMatchingPanel';
import CritiquePanel from '@/components/plumai/CritiquePanel';
import AssistantChat from '@/components/plumai/AssistantChat';
import MarketingPanel from '@/components/plumai/MarketingPanel';
import IdeesPanel from '@/components/plumai/IdeesPanel';

const TABS = [
  { key: 'analyse', label: 'Analyse instantanée', icon: BarChart3, desc: 'Diagnostic heuristique immédiat : style, rythme, clichés, personnages, cohérence.' },
  { key: 'critique', label: 'Critique IA', icon: Sparkles, desc: 'Une vraie critique d\u2019éditeur : notes, points forts, faiblesses et conseils.' },
  { key: 'assistant', label: 'Assistant', icon: MessageCircle, desc: 'Dialoguez avec PlumAI au sujet de votre manuscrit.' },
  { key: 'marketing', label: 'Kit marketing', icon: Megaphone, desc: 'Titres, 4e de couverture, synopsis, pitch et accroches.' },
  { key: 'idees', label: 'Idées & Réécriture', icon: Lightbulb, desc: 'Inspiration, rebondissements et réécriture de passages.' },
];

export default function PlumAIPage() {
  const [text, setText] = useState('');
  const [tab, setTab] = useState('analyse');
  const [loading, setLoading] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [report, setReport] = useState(null);
  const [marketingData, setMarketingData] = useState(null);
  const [characterReport, setCharacterReport] = useState(null);
  const [timelineReport, setTimelineReport] = useState(null);
  const [betaReport, setBetaReport] = useState(null);
  const [proofreadReport, setProofreadReport] = useState(null);
  const [synesthesiaReport, setSynesthesiaReport] = useState(null);
  const [mimicryReport, setMimicryReport] = useState(null);
  const [classicalReport, setClassicalReport] = useState(null);
  const [publisherReport, setPublisherReport] = useState(null);
  const [error, setError] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  // IA states
  const [critique, setCritique] = useState(null);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critiqueError, setCritiqueError] = useState(null);
  const [kit, setKit] = useState(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [kitError, setKitError] = useState(null);
  const [idees, setIdees] = useState(null);
  const [ideesLoading, setIdeesLoading] = useState(false);
  const [ideesError, setIdeesError] = useState(null);

  const steps = [
    "Initialisation du scan spatial synoptique...",
    "Extraction de la matrice syntaxique locale (RAM)...",
    "Excavation des structures classiques (XVIIe/XVIIIe)...",
    "Cartographie des stimuli neuro-synesthésiques...",
    "Calcul de l'indice d'ancrage mnésique structural...",
    "Compilation du bilan d'ingénierie éditoriale final..."
  ];

  // Brouillon auto-sauvegardé
  useEffect(() => {
    try {
      const draft = localStorage.getItem('plumai_draft');
      if (draft) setText(draft);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (text) localStorage.setItem('plumai_draft', text);
    } catch {}
  }, [text]);

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

      const endpoints = [
        ['/api/character-audit', setCharacterReport],
        ['/api/timeline-continuity', setTimelineReport],
        ['/api/beta-reading', setBetaReport],
        ['/api/editorial-proofreader', setProofreadReport],
        ['/api/neuro-synesthesia', setSynesthesiaReport],
        ['/api/stylistic-mimicry', setMimicryReport],
        ['/api/classical-ancestry', setClassicalReport],
        ['/api/marketing', setMarketingData],
        ['/api/publisher-matching', setPublisherReport],
      ];
      const results = await Promise.allSettled(
        endpoints.map(([url]) =>
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textChunk: text }),
          }).then((r) => (r.ok ? r.json() : null))
        )
      );
      results.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value) endpoints[i][1](res.value);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const launchCritique = useCallback(async () => {
    if (!text.trim() || critiqueLoading) return;
    setCritiqueLoading(true);
    setCritiqueError(null);
    try {
      const res = await fetch('/api/plumai/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'La critique a échoué.');
      setCritique(data);
    } catch (e) {
      setCritiqueError(e.message);
    } finally {
      setCritiqueLoading(false);
    }
  }, [text, critiqueLoading]);

  const launchKit = useCallback(async () => {
    if (!text.trim() || kitLoading) return;
    setKitLoading(true);
    setKitError(null);
    try {
      const res = await fetch('/api/plumai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'La génération a échoué.');
      setKit(data);
    } catch (e) {
      setKitError(e.message);
    } finally {
      setKitLoading(false);
    }
  }, [text, kitLoading]);

  const launchIdees = useCallback(async () => {
    if (!text.trim() || ideesLoading) return;
    setIdeesLoading(true);
    setIdeesError(null);
    try {
      const res = await fetch('/api/plumai/idees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textChunk: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'La génération a échoué.');
      setIdees(data);
    } catch (e) {
      setIdeesError(e.message);
    } finally {
      setIdeesLoading(false);
    }
  }, [text, ideesLoading]);

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

  const acceptProofreadSuggestion = (suggestion) => {
    const updatedText = text.replace(suggestion.original, suggestion.corrected.split(' / ')[0]);
    setText(updatedText);
    setProofreadReport(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestion.id)
    }));
  };

  const rejectProofreadSuggestion = (id) => {
    setProofreadReport(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== id)
    }));
  };

  const hasText = text.trim().length >= 200;
  const activeTab = TABS.find((t) => t.key === tab);

  return (
    <div className="bg-slate-950 text-slate-100 p-6 md:p-12 font-sans rounded-2xl border border-slate-900 max-w-6xl mx-auto space-y-8">
      <header className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent flex items-center gap-3">
          PlumAI
          <span className="text-xs font-mono px-2 py-1 bg-slate-800 text-slate-400 rounded-full">L'atelier d'écriture intelligent</span>
        </h1>
        <p className="text-sm text-slate-400 mt-3 max-w-3xl leading-relaxed">
          Votre critique littéraire, votre coach d'écriture et votre attaché de presse réunis :
          analyse instantanée de votre manuscrit, critique approfondie par IA, assistant conversationnel,
          kit marketing complet et aide contre la page blanche. Votre texte reste confidentiel.
        </p>
      </header>

      <WorkspaceArea
        text={text} setText={setText} loading={loading} isFormatting={isFormatting} error={error}
        steps={steps} scanStep={scanStep} handleFileUpload={handleFileUpload}
        handleAnalyze={handleAnalyze} handleFormatAndDownload={handleFormatAndDownload}
      />

      {/* Onglets */}
      <nav className="flex gap-2 overflow-x-auto pb-1 print:hidden" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                active
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-transparent text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </nav>
      <p className="text-xs text-slate-500 -mt-4 print:hidden">{activeTab?.desc}</p>

      {/* Contenu des onglets */}
      {tab === 'analyse' && (
        report ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center mt-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-200">Tableau de bord de votre manuscrit</h2>
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 font-medium rounded-lg text-xs flex items-center space-x-2 print:hidden">
                <Printer className="w-4 h-4" /><span>Exporter le rapport</span>
              </button>
            </div>

            <MetricsDashboard report={report} />
            <PublisherMatchingPanel data={publisherReport} />
            <ClassicalAncestryPanel data={classicalReport} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NeuroSynesthesiaPanel data={synesthesiaReport} />
              <StylisticMimicryPanel data={mimicryReport} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BetaReadingPanel data={betaReport} />
              <InteractiveProofreader
                data={proofreadReport}
                onAcceptSuggestion={acceptProofreadSuggestion}
                onRejectSuggestion={rejectProofreadSuggestion}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CharacterAuditPanel data={characterReport} />
              <TimelineContinuityPanel data={timelineReport} />
            </div>

            <EditorialReport report={report} marketingData={marketingData} />
          </div>
        ) : (
          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-10 text-center">
            <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Collez votre texte ci-dessus puis cliquez sur « Lancer le diagnostic littéraire »
              pour obtenir l'analyse instantanée : métriques de style, clichés, personnages, cohérence…
            </p>
          </div>
        )
      )}

      {tab === 'critique' && (
        <CritiquePanel data={critique} loading={critiqueLoading} error={critiqueError} onLaunch={launchCritique} hasText={hasText} />
      )}

      {tab === 'assistant' && (
        <AssistantChat text={text} />
      )}

      {tab === 'marketing' && (
        <MarketingPanel data={kit} loading={kitLoading} error={kitError} onLaunch={launchKit} hasText={hasText} />
      )}

      {tab === 'idees' && (
        <IdeesPanel idees={idees} ideesLoading={ideesLoading} ideesError={ideesError} onLaunchIdees={launchIdees} hasText={hasText} />
      )}
    </div>
  );
}

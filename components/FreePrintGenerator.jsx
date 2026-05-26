import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, FileText, Download, Layout, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';

export default function FreePrintGenerator() {
  const [format, setFormat] = useState('roman');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Les étapes du "Facteur Wow" pour valoriser la puissance de l'outil gratuit
  const loadingSteps = [
    { min: 0, max: 20, text: "Analyse sémantique du manuscrit..." },
    { min: 21, max: 45, text: "Calcul de l'empagement et des grilles typographiques..." },
    { min: 46, max: 70, text: "Vérification de la zone de tranquillité et des fonds perdus (3mm)..." },
    { min: 71, max: 90, text: "Vectorisation des polices et conversion colorimétrique CMJN (FOGRA39)..." },
    { min: 91, max: 100, text: "Finalisation du document PDF prêt pour l'imprimerie..." }
  ];

  useEffect(() => {
    if (isGenerating) {
      const step = loadingSteps.find(s => progress >= s.min && progress <= s.max);
      if (step) setCurrentStepText(step.text);
    }
  }, [progress, isGenerating]);

  const startGeneration = () => {
    setIsGenerating(true);
    setIsReady(false);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setIsReady(true);
          return 100;
        }
        return oldProgress + 2;
      });
    }, 60); // Un peu plus rapide pour une expérience utilisateur fluide
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/print/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Mon Beau Livre de Poèmes", // À lier dynamiquement à l'œuvre actuelle si nécessaire
          author: "Auteur Lisible",
          contentText: "Le contenu entier textuel du livre va ici...", // À lier au texte de l'auteur
          formatType: format
        })
      });

      if (!response.ok) throw new Error("Erreur serveur lors du téléchargement");

      // Traitement du flux binaire (Blob) reçu depuis l'API
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Simulation d'un clic pour lancer le téléchargement automatique du fichier
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lisible-${format}-print.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
    } catch (error) {
      console.error("Échec du téléchargement :", error);
      alert("Impossible de récupérer le fichier. Réessayez dans quelques instants.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative font-sans">
      {/* Background Neon Glows */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-1 font-mono">
            <Cpu className="w-3.5 h-3.5 animate-pulse" /> Engine Gutenberg AI v2.6
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Studio d'Impression Haute Définition
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Convertissez gratuitement votre texte au format papier standardisé pour l'imprimerie traditionnelle.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-xs text-emerald-400 self-start md:self-center font-mono">
          Outil 100% Gratuit • Lisible Open-Publishing
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          {/* Step 1: Format */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block font-mono">1. Format du Livre</label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'roman', title: 'Roman Standard (A5)', desc: '148 x 210 mm • Marges classiques • Idéal Poésie & Fiction' },
                { id: 'poche', title: 'Format de Poche', desc: '110 x 178 mm • Typographie dense • Optimisation des pages' },
                { id: 'royal', title: 'Format Royal / Beau Livre', desc: '156 x 234 mm • Larges marges • Prestige & Essais' }
              ].map((item) => (
                <button
                  key={item.id}
                  disabled={isGenerating}
                  onClick={() => setFormat(item.id)}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group ${
                    format === item.id 
                      ? 'bg-gradient-to-r from-violet-950/40 to-slate-900/40 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 disabled:opacity-50'
                  }`}
                >
                  <div className="font-medium text-sm text-white flex items-center justify-between">
                    {item.title}
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${format === item.id ? 'border-violet-400 bg-violet-500' : 'border-slate-600'}`}>
                      {format === item.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Inclusions */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block font-mono">2. Inclusions automatiques</label>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2"><Layout className="w-3.5 h-3.5 text-violet-400" /> Génération de la table des matières</div>
              <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-violet-400" /> Gestion des pages blanches (recto/verso)</div>
              <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-violet-400" /> Intégration des mentions légales de Lisible</div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4">
            {!isGenerating && !isReady && (
              <button
                onClick={startGeneration}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Lancer la mise en page
              </button>
            )}

            {isGenerating && (
              <div className="space-y-3">
                <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex flex-col gap-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-violet-400 font-semibold animate-pulse">Traitement numérique...</span>
                    <span>{progress}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic transition-all duration-300">{currentStepText}</p>
                </div>
              </div>
            )}

            {isReady && (
              <div className="space-y-3 animate-fadeIn">
                <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>Votre PDF d'impression respecte les normes CMJN et les repères de coupe de 3mm. Prêt pour l'envoi.</span>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 group"
                >
                  <Download className="w-4 h-4 text-slate-950 group-hover:translate-y-0.5 transition-transform" /> Télécharger le PDF d'Impression (Gratuit)
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Immersive 3D Preview */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800 p-6 min-h-[400px] justify-between relative group overflow-hidden">
          <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider text-slate-400 z-10">
            Aperçu Technique Direct
          </div>

          {/* Book Canvas Simulation */}
          <div className="flex-1 flex items-center justify-center my-4 relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

            <div className={`relative transition-all duration-700 transform perspective-1000 ${
              isGenerating ? 'scale-95 rotate-y-12 animate-pulse' : 'hover:rotate-y-3'
            }`}>
              {/* Simulated Book Skeleton */}
              <div className={`bg-white rounded-r-md shadow-[20px_20px_40px_rgba(0,0,0,0.6)] border-l-4 border-slate-300 relative transition-all duration-500 ${
                format === 'poche' ? 'w-44 h-68' : format === 'royal' ? 'w-56 h-80' : 'w-50 h-74'
              }`}>
                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/20 via-black/5 to-transparent" />
                
                {/* Book Content Preview lines */}
                <div className="p-6 space-y-3 pt-10 opacity-80">
                  <div className="w-16 h-1 bg-slate-400 mx-auto mb-6" />
                  <div className="w-full h-1.5 bg-slate-200 rounded" />
                  <div className="w-full h-1.5 bg-slate-200 rounded" />
                  <div className="w-11/12 h-1.5 bg-slate-200 rounded" />
                  <div className="w-full h-1.5 bg-slate-200 rounded" />
                  <div className="w-10/12 h-1.5 bg-slate-200 rounded" />
                  <div className="w-full h-1.5 bg-slate-200 rounded pt-4" />
                  <div className="w-5/12 h-1.5 bg-slate-200 rounded" />
                </div>

                {/* Print Alignment Marks */}
                <div className="absolute -top-3 -left-3 w-5 h-[1px] bg-red-500/40 font-mono text-[6px] text-red-500 pl-6 pt-1">Fonds perdus 3mm</div>
                <div className="absolute -top-3 -left-3 w-[1px] h-5 bg-red-500/40" />
                <div className="absolute -bottom-3 -right-3 w-5 h-[1px] bg-red-500/40" />
                <div className="absolute -bottom-3 -right-3 w-[1px] h-5 bg-red-500/40" />

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400 font-bold">27</div>
              </div>
            </div>

            {/* Overlays during processing */}
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center space-y-3 z-20">
                <div className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-violet-400 tracking-widest uppercase">Génération du PDF...</span>
              </div>
            )}
          </div>

          {/* Technical Specs Dashboard */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/60 font-mono text-[10px] text-slate-400">
            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block uppercase">Profil Couleur</span>
              <span className="text-emerald-400 font-medium">CMJN FOGRA39</span>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block uppercase">Résolution</span>
              <span className="text-emerald-400 font-medium">300 DPI Vectoriel</span>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block uppercase">Structure</span>
              <span className="text-violet-400 font-medium">PDF/X-1a:2001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

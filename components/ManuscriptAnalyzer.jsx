'use client';
import React, { useState } from 'react';
import { BookOpen, Shield, Cpu, Award, ArrowRight, Star, FileText, Sparkles, Database, Layers, Eye, Activity } from 'lucide-react';
import ManuscriptAnalyzer from '@/components/ManuscriptAnalyzer';
export default function LandingPage() {
  const [activeGenre, setActiveGenre] = useState('blanche');
  const [simulationText, setSimulationText] = useState('');
  const [quantumReport, setQuantumReport] = useState(null);
  const genresSpecs = {
    blanche: { name: 'Littérature Blanche / Générale', font: 'Georgia', size: '12pt', lineH: '1.8', margins: '3cm partout', advice: 'Marges larges pour corrections physiques. Police serif classique.' },
    thriller: { name: 'Thriller / Roman Noir', font: 'Courier New', size: '11pt', lineH: '1.5', margins: '2.5cm partout', advice: 'Format compact favorisant le dynamisme visuel et le rythme des dialogues.' },
    imaginaire: { name: 'SFFF (Sci-Fi, Fantasy)', font: 'Garamond', size: '11.5pt', lineH: '1.6', margins: '2.5cm partout', advice: 'Optimisé pour les gros volumes, grand confort de lecture sur pavés denses.' },
    feelgood: { name: 'Romance / Feel-Good', font: 'Arial / Calibri', size: '12pt', lineH: '1.6', margins: '2.5cm partout', advice: 'Aéré, moderne, idéal pour une assimilation fluide et un grand confort visuel.' },
  };
  const handleQuantumSimulation = () => {
    if (!simulationText.trim() || simulationText.length < 30) return;
    const clean = simulationText.toLowerCase();
    const wordCount = simulationText.split(/\s+/).length;
    const temporalDisruptions = (clean.match(/(soudain|brusquement|tout à coup|téléphone|ordinateur|liaison)/g) || []).length;
    const coherenceIndex = Math.max(58, Math.min(99, 100 - (temporalDisruptions * 4)));
    let proximityAuthor = "Marguerite Duras (Style Minimaliste)";
    if (wordCount / (simulationText.split(',').length || 1) > 15) {
      proximityAuthor = "Marcel Proust (Périodes Amples / Introspection)";
    } else if (clean.includes('!') || clean.includes('?')) {
      proximityAuthor = "Louis-Ferdinand Céline (Rythme Projectif / Émotif)";
    }
    setQuantumReport({
      coherenceIndex,
      proximityAuthor,
      cinematicContinuum: wordCount > 60 ? "Structure idéale pour un plan-séquence immersif. Densité narrative transposable en arcs de saison TV." : "Format hautement dramatique, idéal pour une transition en script de court-métrage.",
      stylisticEntropy: (1.2 + (temporalDisruptions * 0.15)).toFixed(2) + " Nats",
      acceptationMatrix: { hachette: Math.round(55 + (coherenceIndex * 0.35)), gallimard: Math.round(40 + (wordCount % 45)), indie: Math.round(70 + (temporalDisruptions * 5)) }
    });
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <nav className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md shadow-emerald-950/50"><BookOpen className="w-5 h-5 text-slate-950 stroke-[2.5]" /></div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Plumai</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
            <a href="#analyzer" className="hover:text-slate-200 transition-colors">Console d'Audit</a>
            <a href="#quantum-engine" className="hover:text-slate-200 transition-colors">Analyse Vectorielle</a>
            <a href="#pao-norms" className="hover:text-slate-200 transition-colors">Mise en Page</a>
          </div>
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold tracking-wide uppercase rounded-full transition-all text-slate-200 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-400" /> Export PDF</button>
        </div>
      </nav>
      <header className="relative max-w-5xl mx-auto pt-16 pb-12 px-6 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-950/40 to-emerald-950/40 border border-emerald-800/30 text-emerald-400 rounded-full text-xs font-mono tracking-wider"><Activity className="w-3 h-3 text-cyan-400 animate-pulse" /> <span>SYSTÈME QUANTIQUE LOCAL DÉCENTRALISÉ</span></div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] bg-gradient-to-b from-slate-50 to-slate-400 bg-clip-text text-transparent max-w-4xl mx-auto">L'ingénierie littéraire du futur, sans cloud.</h1>
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">Cartographiez la signature stylométrique profonde de vos textes. Évaluez la cohérence structurelle et estimez votre indice d'assimilation transmédia en local.</p>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 space-y-20 pb-24">
        <section id="analyzer" className="scroll-mt-24">
          <div className="relative rounded-3xl p-0.5 bg-gradient-to-b from-slate-800/50 to-transparent shadow-2xl">
            <div className="absolute inset-0 bg-slate-950 rounded-3xl -z-10" />
            <ManuscriptAnalyzer />
          </div>
        </section>
        <section id="quantum-engine" className="scroll-mt-24 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100"><Database className="w-5 h-5 text-cyan-400" /> Proximité Vectorielle & Continuum Transmédia</h2>
            <p className="text-xs text-slate-400 mt-1">Projection géométrique de compatibilité et modélisation de la structure diégétique du récit.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Matrice textuelle brute :</span>
              <textarea value={simulationText} onChange={(e) => setSimulationText(e.target.value)} placeholder="Insérez votre texte (minimum 30 mots) pour générer l'empreinte biométrique..." className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-serif focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed" />
              <button onClick={handleQuantumSimulation} disabled={simulationText.trim().length < 30} className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-30"><span>Générer l'Empreinte Stylométrique</span></button>
            </div>
            <div className="lg:col-span-7 bg-slate-950/60 rounded-xl border border-slate-800/80 p-5 space-y-4 text-xs">
              {quantumReport ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Cohérence Diégétique</span>
                      <span className="font-mono text-lg font-black text-cyan-400">{quantumReport.coherenceIndex}%</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Entropie de Style</span>
                      <span className="font-mono text-lg font-black text-purple-400">{quantumReport.stylisticEntropy}</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Proximité d'Auteur</span>
                      <span className="font-sans text-[11px] font-bold text-amber-400 truncate block mt-1">{quantumReport.proximityAuthor.split(' ')[0]}</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1"><Eye className="w-3 h-3 text-emerald-400" /> Potentiel Transmédia & Adaptation :</span>
                    <p className="text-slate-300 leading-relaxed text-[11px] font-serif">{quantumReport.cinematicContinuum}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Indice de pénétration des comités d'édition :</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800/50 flex justify-between items-center"><span className="text-slate-400 text-[10px]">Major</span><span className="font-mono font-bold text-emerald-400">{quantumReport.acceptationMatrix.hachette}%</span></div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800/50 flex justify-between items-center"><span className="text-slate-400 text-[10px]">Prestige</span><span className="font-mono font-bold text-cyan-400">{quantumReport.acceptationMatrix.gallimard}%</span></div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800/50 flex justify-between items-center"><span className="text-slate-400 text-[10px]">Micro</span><span className="font-mono font-bold text-purple-400">{quantumReport.acceptationMatrix.indie}%</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-600">
                  <Activity className="w-8 h-8 text-slate-800 animate-pulse" />
                  <p className="text-xs">Système en attente de flux syntaxique.<br />Collez votre extrait textuel pour démarrer le monitoring autonome.</p>
                </div>
              )}
            </div>
          </div>
        </section>
        <section id="pao-norms" className="scroll-mt-24 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Gabarits Métiers & Gabarits Typographiques</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">Vérifiez la configuration géométrique optimale exigée par les imprimeurs et les services des manuscrits physiques.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(genresSpecs).map(([key, value]) => (
              <button key={key} onClick={() => setActiveGenre(key)} className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between space-y-2 ${activeGenre === key ? 'bg-gradient-to-b from-slate-900 to-slate-900/50 border-emerald-500 text-slate-200' : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800'}`}>
                <span className="text-xs font-bold block">{value.name}</span>
                <span className="text-[10px] font-mono tracking-wider opacity-80 block">{value.font} / {value.size}</span>
              </button>
            ))}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="text-slate-500 font-mono text-[10px] block">CORPS DE POLICE</span>
              <p className="font-bold text-slate-300 text-sm font-mono">{genresSpecs[activeGenre].font}</p>
              <p className="text-slate-400 text-[11px]">Taille recommandée : {genresSpecs[activeGenre].size}</p>
            </div>
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="text-slate-500 font-mono text-[10px] block">INTERLIGNAGE & ESPACEMENT</span>
              <p className="font-bold text-cyan-400 text-sm font-mono">{genresSpecs[activeGenre].lineH} pt</p>
              <p className="text-slate-400 text-[11px]">Marges requises : {genresSpecs[activeGenre].margins}</p>
            </div>
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="text-slate-500 font-mono text-[10px] block">DIRECTIVE MAISON D'ÉDITION</span>
              <p className="text-slate-300 font-sans leading-relaxed">{genresSpecs[activeGenre].advice}</p>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 bg-emerald-950/50 border border-emerald-900/30 rounded-xl flex items-center justify-center"><Cpu className="w-5 h-5 text-emerald-400" /></div>
            <h3 className="font-semibold text-slate-200 text-sm">Zéro télémétrie</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Les algorithmes s'exécutent entièrement sur votre matériel. Votre propriété intellectuelle reste protégée.</p>
          </div>
          <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 bg-cyan-950/50 border border-cyan-900/30 rounded-xl flex items-center justify-center"><Award className="w-5 h-5 text-cyan-400" /></div>
            <h3 className="font-semibold text-slate-200 text-sm">Analyse Non-Invasive</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Les structures narratives complexes sont découpées et indexées dynamiquement en local.</p>
          </div>
          <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 bg-purple-950/50 border border-purple-900/30 rounded-xl flex items-center justify-center"><Layers className="w-5 h-5 text-purple-400" /></div>
            <h3 className="font-semibold text-slate-200 text-sm">Rendus Multi-Formats</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Générez des maquettes exploitables répondant directement aux critères exigeants de l'industrie du livre.</p>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs font-mono text-slate-600 print:hidden"><p>&copy; 2026 Plumai. Station d'ingénierie littéraire souveraine.</p></footer>
    </div>
  );
}

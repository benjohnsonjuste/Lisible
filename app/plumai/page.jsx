'use client';
import React from 'react';
import { BookOpen, Shield, Cpu, Award, ArrowRight, Star } from 'lucide-react';
import ManuscriptAnalyzer from '@/components/ManuscriptAnalyzer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <nav className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md shadow-emerald-950/50">
              <BookOpen className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Plumai</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#analyzer" className="hover:text-slate-200 transition-colors">Audit Quantique</a>
            <a href="#features" className="hover:text-slate-200 transition-colors">Matrice Éditoriale</a>
          </div>
          <a href="#analyzer" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold tracking-wide uppercase rounded-full transition-all text-slate-200">Accès Console</a>
        </div>
      </nav>

      <header className="relative max-w-5xl mx-auto pt-20 pb-16 px-6 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 rounded-full text-xs font-mono tracking-wider animate-pulse">
          <Star className="w-3 h-3 fill-emerald-400" /><span>INGÉNIERIE NARRATIVE</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] bg-gradient-to-b from-slate-50 to-slate-400 bg-clip-text text-transparent max-w-4xl mx-auto">Propulsez votre manuscrit au plus haut niveau.</h1>
        <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto font-normal leading-relaxed">Soumettez votre manuscrit à notre moteur d'audit macro-stylistique. Évaluez instantanément votre vélocité narrative, votre signature lexical et votre compatibilité avec les grands comités.</p>
        <div className="flex justify-center pt-2">
          <a href="#analyzer" className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-medium rounded-xl text-sm text-slate-950 shadow-xl shadow-emerald-950/20 transition-all flex items-center space-x-2 group">
            <span>Déployer la console d'analyse</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 space-y-24 pb-24">
        <section id="analyzer" className="scroll-mt-24">
          <div className="relative rounded-3xl p-0.5 bg-gradient-to-b from-slate-800/50 to-transparent shadow-2xl">
            <div className="absolute inset-0 bg-slate-950 rounded-3xl -z-10" />
            <ManuscriptAnalyzer />
          </div>
        </section>

        <section id="features" className="scroll-mt-24 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 bg-emerald-950/50 border border-emerald-900/30 rounded-xl flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Moteur Sémantique</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Évaluation de la dynamique des structures narratives directement à l'échelle du navigateur pour garantir une fluidité de style.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 bg-cyan-950/50 border border-cyan-900/30 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Calculateur Métrique</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Mesure immédiate de la densité lexicale et repérage automatique des formulations passives ou répétitives.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 bg-amber-950/50 border border-amber-900/30 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Zéro Stockage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Aucun transfert de données vers des serveurs tiers. Votre texte reste confiné dans l'environnement d'exécution éphémère local.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs font-mono text-slate-600">
        <p>&copy; 2026 Plumai. Conçu pour tous les écrivains de la nouvelle ère.</p>
      </footer>
    </div>
  );
}

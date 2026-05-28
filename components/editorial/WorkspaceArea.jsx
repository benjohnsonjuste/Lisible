'use client';
import React from 'react';
import { Loader2, Sparkles, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function WorkspaceArea({ 
  text, setText, loading, isFormatting, error, steps, scanStep, handleFileUpload, handleAnalyze, handleFormatAndDownload 
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 print:hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <label className="block text-sm font-semibold text-slate-300">Collez votre extrait ou déposez un fichier (.txt, .docx)</label>
        <div className="flex items-center space-x-3">
          <input 
            type="file" 
            accept=".txt,.docx" 
            onChange={handleFileUpload} 
            disabled={loading || isFormatting} 
            className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer" 
          />
          <span className="text-xs font-mono text-slate-500">{text.length} caractères</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg">
        <textarea 
          className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-serif leading-relaxed text-base" 
          placeholder="Le jour où la pluie cessa de tomber..." 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          disabled={loading || isFormatting} 
        />
        {loading && (
          <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none flex flex-col justify-end p-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[bounce_2s_infinite]" />
            <div className="bg-slate-950/90 border border-emerald-500/30 font-mono text-xs p-3 rounded shadow-lg text-emerald-400 max-w-md backdrop-blur-sm self-start space-y-1 animate-pulse">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-3 h-3 text-emerald-500 animate-spin"/>
                <span>[SYSTEM MONITOR] : IN PROGRESS</span>
              </div>
              <div className="text-slate-400">&gt; {steps[scanStep]}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={handleAnalyze} 
          disabled={loading || isFormatting || !text.trim()} 
          className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 font-medium rounded-lg text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <><Loader2 className="animate-spin h-4 w-4 text-emerald-400"/><span className="text-emerald-400 font-mono text-xs tracking-wider">SCAN SPATIAL EN COURS...</span></>
          ) : (
            <><Sparkles className="w-4 h-4"/><span>Lancer le diagnostic littéraire</span></>
          )}
        </button>
        <button 
          onClick={handleFormatAndDownload} 
          disabled={loading || isFormatting || !text.trim()} 
          className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 font-medium rounded-lg text-sm border border-slate-700 transition-all flex items-center justify-center space-x-2"
        >
          {isFormatting ? (
            <><Loader2 className="animate-spin h-4 w-4 text-cyan-400"/><span className="font-mono text-xs text-cyan-400">MISE EN PAGE PRO AUTO...</span></>
          ) : (
            <><FileText className="w-4 h-4 text-cyan-400"/><span>Mise en page pro & Télécharger (.doc)</span></>
          )}
        </button>
      </div>

      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-start space-x-3 max-w-2xl">
        <ShieldCheck className="w-5 h-5 text-emerald-500/80 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Garantie Souveraine de Confidentialité & Ingénierie Narrative</p>
          <p className="leading-relaxed">Votre œuvre est traitée exclusivement en mémoire vive locale (RAM). Aucun stockage distant n'est effectué.</p>
        </div>
      </div>
    </section>
  );
}

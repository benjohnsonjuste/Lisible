'use client';
import React,{useState,useEffect} from 'react';
import {Sparkles,ShieldCheck,Printer,Compass,Wrench,Ban,Flame,AlertTriangle,Loader2,Brain,Palette,Scale,MessageSquareCode,FileText,Scissors,Film} from 'lucide-react';
export default function ManuscriptAnalyzer(){
const[text,setText]=useState('');const[loading,setLoading]=useState(false);const[report,setReport]=useState(null);const[error,setError]=useState(null);const[scanStep,setScanStep]=useState(0);
const steps=["Initialisation...","Extraction de la matrice...","Analyse stylistique...","Calcul des indices...","Simulation...","Compilation du bilan..."];
useEffect(()=>{if(!window.mammoth){const s=document.createElement('script');s.src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";s.async=true;document.body.appendChild(s);}},[]);
useEffect(()=>{let iv;if(loading){setScanStep(0);iv=setInterval(()=>{setScanStep((p)=>(p<steps.length-1?p+1:p));},400);}return()=>clearInterval(iv);},[loading]);
const handleFileUpload=(e)=>{const f=e.target.files[0];if(!f)return;setError(null);const ext=f.name.split('.').pop().toLowerCase();if(ext==='txt'){const r=new FileReader();r.onload=(evt)=>setText(evt.target.result);r.readAsText(f);}else if(ext==='docx'){if(!window.mammoth){setError("Chargement du module Word...");return;}const r=new FileReader();r.onload=(evt)=>{window.mammoth.extractRawText({arrayBuffer:evt.target.result}).then((res)=>setText(res.value)).catch(()=>setError("Erreur Word."));};r.readAsArrayBuffer(f);}};
const handleAnalyze=async()=>{if(!text.trim()){setError("Texte insuffisant.");return;}setLoading(true);setError(null);setReport(null);try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({textChunk:text}),});const d=await r.json();if(!r.ok)throw new Error(d.error||"Erreur");setReport(d);}catch(err){setError(err.message);}finally{setLoading(false);}};
const handleFormatAndDownload=()=>{if(!text.trim())return;const blob=new Blob([text],{type:'application/msword'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='manuscrit.doc';a.click();URL.revokeObjectURL(url);};
return(
<div className="bg-slate-950 text-slate-100 p-4 md:p-8 font-sans rounded-xl border border-slate-900 max-w-5xl mx-auto space-y-6">
<header className="border-b border-slate-800 pb-4 flex justify-between items-center">
<div><h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Plumai</h1><p className="text-slate-400 text-xs">Audit stylistique et ingénierie éditoriale.</p></div>
<span className="text-xs font-mono text-slate-500">{text.length} car.</span>
</header>
<section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 print:hidden">
<div className="flex justify-between items-center"><input type="file" accept=".txt,.docx" onChange={handleFileUpload} disabled={loading} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-slate-800 file:text-slate-200 cursor-pointer" /></div>
<div className="relative">
<textarea className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-serif" placeholder="Collez votre extrait ici..." value={text} onChange={(e)=>setText(e.target.value)} disabled={loading} />
{loading && (
<div className="absolute inset-0 bg-slate-950/80 rounded-lg flex items-center justify-center p-4">
<div className="font-mono text-xs text-emerald-400 flex items-center space-x-2"><Loader2 className="w-4 h-4 animate-spin"/><span>{steps[scanStep]}</span></div>
</div>
)}
</div>
{error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> {error}</div>}
<div className="flex gap-3">
<button onClick={handleAnalyze} disabled={loading||!text.trim()} className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 font-medium rounded text-xs transition-all flex items-center justify-center space-x-2 text-white">{loading?<span>Analyse...</span>:(<><Sparkles className="w-3.5 h-3.5"/><span>Lancer l'audit</span></>)}</button>
<button onClick={handleFormatAndDownload} disabled={loading||!text.trim()} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded text-xs border border-slate-700 transition-all flex items-center justify-center space-x-2"><FileText className="w-3.5 h-3.5 text-cyan-400"/><span>Télécharger (.docx)</span></button>
</div>
</section>
{report && (
<div className="space-y-6">
<div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-200">Rapport d'analyse</h2><button onClick={()=>window.print()} className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs flex items-center space-x-1 print:hidden"><Printer className="w-3.5 h-3.5"/><span>PDF</span></button></div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center"><span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Ancrage Mnésique</span><span className="text-3xl font-black text-emerald-400 block my-1">{report.metrics?.hookScore}%</span></div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Style & Rythme</span><p className="text-xs text-slate-300">{report.metrics?.rhythmStyle}</p></div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Densité</span><p className="text-xs text-slate-300">{report.metrics?.adverbDensity}</p></div>
</div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
<div className="bg-slate-950 p-2 rounded"><span className="text-slate-400 block text-[10px]">Diversité lexicale</span><span className="font-bold text-cyan-400">{report.metrics?.vocabularyRichness||0}%</span></div>
<div className="bg-slate-950 p-2 rounded"><span className="text-slate-400 block text-[10px]">Verbes actifs</span><span className="font-bold text-amber-400">{report.metrics?.dynamicCoefficient||0}%</span></div>
<div className="bg-slate-950 p-2 rounded"><span className="text-slate-400 block text-[10px]">Lourdeurs</span><span className="font-bold text-rose-400">{report.metrics?.weakVerbsCount||0}</span></div>
<div className="bg-slate-950 p-2 rounded"><span className="text-slate-400 block text-[10px]">Lecture</span><span className="font-bold text-emerald-400">~{report.metrics?.readingTime||1} min</span></div>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{report.structuralMetrics && (
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
<h3 className="font-bold text-cyan-400 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5"/>Structure</h3>
<div className="flex justify-between"><span>Dialogues / Narrations :</span><span className="font-mono">{report.structuralMetrics.dialogueRatio}</span></div>
<div className="flex justify-between"><span>Anachronismes :</span><span className="font-mono text-amber-400">{report.structuralMetrics.anachronismsCount}</span></div>
<p className="text-slate-400 border-t border-slate-950 pt-2">{report.structuralMetrics.cadenceAnalysis}</p>
</div>
)}
{report.transmediaMetrics && (
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
<h3 className="font-bold text-purple-400 flex items-center gap-1.5"><Film className="w-3.5 h-3.5"/>Potentiel Écran</h3>
<div className="flex justify-between"><span>Score Cinématique :</span><span className="font-mono">{report.transmediaMetrics.cinematicScore}%</span></div>
<p className="text-slate-400 border-t border-slate-950 pt-2">{report.transmediaMetrics.scriptDoctorAdvice}</p>
</div>
)}
</div>
{report.publisherCompatibility && (
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
<h3 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1"><Compass className="w-3.5 h-3.5"/>Compatibilité Éditeurs</h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
{report.publisherCompatibility.map((pub,idx)=>(
<div key={idx} className="bg-slate-950 p-3 rounded space-y-1">
<div className="flex justify-between font-medium"><span>{pub.name}</span><span className="text-emerald-400">{pub.score}%</span></div>
<p className="text-slate-400 text-[11px]">{pub.reasons}</p>
</div>
))}
</div>
</div>
)}
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-1">
<div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]"><MessageSquareCode className="w-3.5 h-3.5 text-emerald-500"/>AVIS DU COMITÉ</div>
<p className="text-slate-300 italic">"{report.editorialVerdict}"</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
<h3 className="font-bold text-rose-400 flex items-center gap-1"><Ban className="w-3.5 h-3.5"/>Lourdeurs détectées ({report.heavyPhrases?.length||0})</h3>
<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
{report.heavyPhrases?.map((item,idx)=>(
<div key={idx} className="bg-slate-950 p-2 rounded border border-rose-500/5 space-y-1">
<p className="text-rose-300 italic">"{item.text}"</p>
<p className="text-[11px] text-emerald-400">&gt; {item.suggestion}</p>
</div>
))}
</div>
</div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
<h3 className="font-bold text-amber-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5"/>Clichés ({report.clichesDetected?.length||0})</h3>
<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
{report.clichesDetected?.map((item,idx)=>(
<div key={idx} className="bg-slate-950 p-2 rounded border border-amber-500/5 flex justify-between gap-2">
<span className="line-through text-slate-500">{item.expression}</span>
<span className="text-emerald-400 text-right">{item.alternative}</span>
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

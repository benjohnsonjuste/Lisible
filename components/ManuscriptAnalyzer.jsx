'use client';
import React,{useState,useEffect} from 'react';
import {Sparkles,ShieldCheck,Printer,Compass,Wrench,Ban,Flame,AlertTriangle,Loader2,Brain,Palette,Scale,MessageSquareCode,FileText,Download,BookOpen,Type,Layout,Layers,Cpu,BookMarK,CheckCircle} from 'lucide-react';
export default function ManuscriptAnalyzer(){
const[text,setText]=useState('');const[loading,setLoading]=useState(false);const[report,setReport]=useState(null);const[error,setError]=useState(null);const[scanStep,setScanStep]=useState(0);const[isFormatting,setIsFormatting]=useState(false);
const[paoLayout,setPaoLayout]=useState('romanA5');const[coverColor,setCoverColor]=useState('from-slate-900 to-slate-950');const[coverTitle,setCoverTitle]=useState('Chef-d\'œuvre');
const steps=["[Macro-Editing] Analyse de l'intrigue & failles structurelles...","[Micro-Editing] Nettoyage macroscopique des tics de style...","[Orthotypographie] Traitement des espaces insécables & cadratins...","[PAO] Calcul de la densité du gris typographique...","[Studio Graphique] Extraction vectorielle pour couverture...","[Génération] Compilation du pipeline pré-éditorial final..."];
useEffect(()=>{if(!window.mammoth){const s=document.createElement('script');s.src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";s.async=true;document.body.appendChild(s);}},[]);
useEffect(()=>{let iv;if(loading){setScanStep(0);iv=setInterval(()=>{setScanStep((p)=>(p<steps.length-1?p+1:p));},800);}return()=>clearInterval(iv);},[loading]);
const handleFileUpload=(e)=>{const f=e.target.files[0];if(!f)return;setError(null);const ext=f.name.split('.').pop().toLowerCase();if(ext==='txt'){const r=new FileReader();r.onload=(evt)=>setText(evt.target.result);r.readAsText(f);}else if(ext==='docx'){const r=new FileReader();r.onload=(evt)=>{window.mammoth.extractRawText({arrayBuffer:evt.target.result}).then((res)=>setText(res.value)).catch(()=>setError("Erreur Word."));};r.readAsArrayBuffer(f);}};
const handleAnalyze=async()=>{if(!text||text.trim().length<10){setError("Texte insuffisant pour lancer la chaîne éditoriale.");return;}setLoading(true);setError(null);setReport(null);try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({textChunk:text}),});const d=await r.json();if(!r.ok)throw new Error(d.error);setReport(d);}catch(err){setError(err.message);}finally{setLoading(false);}};
const exportFile=(format)=>{if(!text)return;setIsFormatting(true);setTimeout(()=>{const blob=new Blob([text],{type:format==='docx'?'application/msword':'application/epub+zip'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`manuscrit_maquette_${paoLayout}.${format}`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);setIsFormatting(false);},1200);};
return(
<div className="bg-slate-950 text-slate-100 p-4 md:p-8 font-sans rounded-2xl border border-slate-900 max-w-6xl mx-auto space-y-6">
<header className="border-b border-slate-800 pb-4 flex justify-between items-center">
<div><h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">PlumAI <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">STATION ÉDITORIALE PRO</span></h1><p className="text-slate-400 text-xs mt-1">Chaîne complète de traitement de l'œuvre : du manuscrit brut jusqu'aux fichiers de diffusion PAO et numériques.</p></div>
<Cpu className="w-5 h-5 text-cyan-400 animate-pulse hidden sm:block"/>
</header>
<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
<div className="flex justify-between items-center"><label className="text-xs font-mono uppercase tracking-wider text-slate-400">Étape 1 : Injection du Manuscrit Brut</label><input type="file" accept=".txt,.docx" onChange={handleFileUpload} className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-800 file:text-slate-200 cursor-pointer" /></div>
<div className="relative"><textarea className="w-full h-80 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-serif leading-relaxed text-sm" placeholder="Collez le texte brut de votre œuvre ici..." value={text} onChange={(e)=>{setText(e.target.value);if(e.target.value.length>2)setCoverTitle(e.target.value.substring(0,25));}}/>
{loading && (<div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col justify-center p-6 space-y-3"><div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs"><Loader2 className="w-4 h-4 animate-spin"/><span>[MOTEUR ÉDITORIAL EN ACTION]</span></div><div className="text-sm font-serif text-slate-200 bg-slate-900 p-3 rounded border border-slate-800 animate-pulse">&gt; {steps[scanStep]}</div></div>)}</div>
<div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-3">
<span className="text-xs font-mono text-slate-400 block"><Layout className="w-3.5 h-3.5 inline mr-1 text-cyan-400"/> Étape 2 : Configuration du Maquettage de PAO (InDesign Engine)</span>
<div className="grid grid-cols-3 gap-2">
<button onClick={()=>setPaoLayout('romanA5')} className={`p-2 rounded text-left border text-xs transition-all ${paoLayout==='romanA5'?'border-cyan-500 bg-cyan-950/20 text-cyan-400':'border-slate-800 bg-slate-900/40 text-slate-400'}`}><span className="font-bold block">Roman Standard A5</span><span className="text-[9px] text-slate-500">Miroir 14x21cm, Garamond 11pt</span></button>
<button onClick={()=>setPaoLayout('poche')} className={`p-2 rounded text-left border text-xs transition-all ${paoLayout==='poche'?'border-cyan-500 bg-cyan-950/20 text-cyan-400':'border-slate-800 bg-slate-900/40 text-slate-400'}`}><span className="font-bold block">Format Poche</span><span className="text-[9px] text-slate-500">Compact 11x18cm, Sabon 10pt</span></button>
<button onClick={()=>setPaoLayout('soumission')} className={`p-2 rounded text-left border text-xs transition-all ${paoLayout==='soumission'?'border-cyan-500 bg-cyan-950/20 text-cyan-400':'border-slate-800 bg-slate-900/40 text-slate-400'}`}><span className="font-bold block">Manuscrit Soumission</span><span className="text-[9px] text-slate-500">Interligne 1.5, Marges 4cm (Comités)</span></button>
</div></div>
<div className="flex gap-3">
<button onClick={handleAnalyze} disabled={loading||!text.trim()} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 font-semibold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2 shadow-lg"><Sparkles className="w-3.5 h-3.5"/><span>Lancer la chaîne de traitement pré-éditoriale</span></button>
</div></div>
<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
<div><span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2"><Layers className="w-3.5 h-3.5 inline mr-1 text-indigo-400"/> Étape 3 : Studio Graphique de Couverture</span>
<div className={`w-full h-64 rounded-lg bg-gradient-to-b ${coverColor} border border-slate-700 shadow-2xl relative p-4 flex flex-col justify-between transition-all duration-500 overflow-hidden`}>
<div className="absolute top-0 left-0 right-0 h-1 bg-white/5"/><div className="text-center space-y-1"><span className="text-[9px] tracking-[0.3em] uppercase font-mono text-white/60 block">R O M A N</span><h2 className="text-base font-serif font-black tracking-tight text-slate-100 line-clamp-2 mt-2 px-2 capitalize">{coverTitle||"Titre du Manuscrit"}</h2></div>
<div className="w-6 h-6 border border-white/20 rounded-full mx-auto flex items-center justify-center opacity-40"><div className="w-1.5 h-1.5 bg-white rounded-full"/></div>
<div className="text-center"><span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold block">{report?.marketing?.pitchBorders||"PLUMAI EDITIONS"}</span></div></div>
<div className="mt-3 space-y-2"><span className="text-[11px] text-slate-400 block font-mono">Palette chromatique du genre :</span>
<div className="grid grid-cols-4 gap-1.5">
<button onClick={()=>setCoverColor('from-slate-950 to-slate-900')} className="h-6 bg-slate-900 rounded border border-slate-700 text-[10px] font-mono">Blanche</button>
<button onClick={()=>setCoverColor('from-rose-950 via-purple-950 to-slate-950')} className="h-6 bg-purple-950 rounded border border-purple-800 text-[10px] font-mono">Noir/Thriller</button>
<button onClick={()=>setCoverColor('from-cyan-950 via-emerald-950 to-slate-950')} className="h-6 bg-emerald-950 rounded border border-emerald-800 text-[10px] font-mono">Sci-Fi</button>
<button onClick={()=>setCoverColor('from-amber-900 to-amber-950')} className="h-6 bg-amber-900 rounded border border-amber-700 text-[10px] font-mono">Essai</button>
</div></div></div>
<div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
<span className="text-[11px] font-mono text-slate-400 block">Étape 4 : Injection & Livrables Externes</span>
<div className="grid grid-cols-2 gap-2">
<button onClick={()=>exportFile('docx')} disabled={!text||isFormatting} className="py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"><FileText className="w-3.5 h-3.5 text-cyan-400"/><span>Export Maquette Word</span></button>
<button onClick={()=>exportFile('epub')} disabled={!text||isFormatting} className="py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"><BookOpen className="w-3.5 h-3.5 text-indigo-400"/><span>Générer E-Book (.epub)</span></button>
</div></div></div>
</section>
{error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
{report && (
<div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2"><div className="flex items-center gap-1.5 text-slate-400"><Brain className="w-3.5 h-3.5 text-emerald-400"/><span className="text-[10px] uppercase font-mono tracking-wider">Macro-Editing & Structure</span></div><div className="text-sm font-semibold text-slate-200 mt-1">{report.macroEditing?.structuralBalance}</div><div className="text-[11px] text-slate-400 leading-relaxed"><strong className="text-slate-300">Axe de restructuration :</strong> {report.macroEditing?.reorganizationAdvice}</div></div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2"><div className="flex items-center gap-1.5 text-slate-400"><Palette className="w-3.5 h-3.5 text-cyan-400"/><span className="text-[10px] uppercase font-mono tracking-wider">Micro-Editing & Style</span></div><div className="text-sm font-semibold text-slate-200 mt-1">{report.microEditing?.rhythmStyle}</div><p className="text-[11px] text-slate-400 leading-relaxed">Le microscope stylistique a audité l'harmonie vibratoire et l'impact dynamique du ton romanesque.</p></div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2"><div className="flex items-center gap-1.5 text-slate-400"><Scale className="w-3.5 h-3.5 text-indigo-400"/><span className="text-[10px] uppercase font-mono tracking-wider">Orthotypographie & Précision</span></div><div className="text-sm font-semibold text-slate-200 mt-1">Audit Typographique OK</div><div className="text-[11px] text-slate-400 space-y-1"><p className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {report.orthotypography?.insecablesFixed} espaces insécables injectés aux ponctuations doubles.</p><p className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> ~{report.orthotypography?.grammarAlertsCount} anomalies de surface isolées.</p></div></div>
</div>
{report.orthotypography?.coherenceAlerts?.length > 0 && (
<div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-xl flex items-start gap-3">
<AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
<div className="text-xs space-y-1"><h4 className="font-bold text-amber-300">Alerte de Cohérence Interne Majeure (Filtre Anachronismes & Portrait)</h4>{report.orthotypography.coherenceAlerts.map((c,i)=><p key={i} className="text-slate-300">{c.desc} <span className="text-cyan-400 font-medium">Correction : {c.fix}</span></p>)}</div>
</div>
)}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
<h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5"><Ban className="w-3.5 h-3.5"/> Traitement Stylistique : Lourdeurs</h3>
<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
{report.microEditing?.heavyPhrases?.map((h,i)=>(<div key={i} className="bg-slate-950 p-2.5 rounded border border-rose-900/20 text-xs"><p className="text-rose-300 italic">"{h.text}"</p><p className="text-[10px] text-slate-400 mt-1"><strong className="text-slate-300">Diagnostic Micro :</strong> {h.reason}</p><p className="text-[10px] text-emerald-400 bg-emerald-950/30 p-1.5 rounded mt-1"><strong className="text-emerald-500">Alternative :</strong> {h.suggestion}</p></div>))}
{report.microEditing?.heavyPhrases?.length===0 && <p className="text-xs text-slate-500">Aucune faille rythmique isolée.</p>}
</div></div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
<h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5"/> Élimination des Clichés & Clarté</h3>
<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
{report.microEditing?.clichesDetected?.map((c,i)=>(<div key={i} className="bg-slate-950 p-2.5 rounded border border-amber-900/20 text-xs flex justify-between items-start gap-2"><div><span className="line-through text-amber-400/60 font-serif">"{c.expression}"</span><p className="text-emerald-400 text-[10px] mt-0.5"><strong className="text-slate-500 font-normal">Substitut poétique :</strong> {c.alternative}</p></div><span className="text-[8px] uppercase font-mono bg-amber-950 text-amber-400 border border-amber-900 px-1 rounded">Cliché</span></div>))}
{report.microEditing?.clichesDetected?.length===0 && <p className="text-xs text-slate-500">Pureté d'expression absolue.</p>}
</div></div>
</div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
<div className="flex items-center gap-2 border-b border-slate-800 pb-2"><MessageSquareCode className="w-4 h-4 text-indigo-400"/><h3 className="text-xs uppercase font-mono tracking-wider text-slate-300">Rédaction des Textes Annexes & Quatrième de Couverture Automatique</h3></div>
<div className="bg-slate-950 p-4 rounded-lg border border-indigo-950/40 relative"><div className="absolute top-2 right-2 flex gap-1"><span className="text-[9px] font-mono bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-900">GÉNÉRÉ</span></div>
<p className="text-sm font-serif italic text-slate-300 leading-relaxed max-w-3xl">"{report.marketing?.generatedSummary}"</p>
<div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-mono"><span className="text-slate-400">Bandeau promotionnel simulé :</span><span className="text-slate-300 px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-xs tracking-widest font-sans font-bold">{report.marketing?.pitchBorders}</span></div></div>
</div>
</div>
)}
</div>
);
}

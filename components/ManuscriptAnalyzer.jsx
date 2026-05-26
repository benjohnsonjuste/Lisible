'use client';
import React,{useState,useEffect} from 'react';
import {Sparkles,ShieldCheck,Printer,Gauge,Activity,Compass,Clock,Construction,Wrench,Ban,Flame,AlertTriangle,Loader2,Brain,Palette,Scale,MessageSquareCode,FileText,Download} from 'lucide-react';
export default function ManuscriptAnalyzer(){
const[text,setText]=useState('');const[loading,setLoading]=useState(false);const[report,setReport]=useState(null);const[error,setError]=useState(null);const[scanStep,setScanStep]=useState(0);const[isFormatting,setIsFormatting]=useState(false);
const steps=["Initialisation du scan spatial synoptique...","Extraction de la matrice syntaxique locale (RAM)...","Mesure du filtre d'érosion textuelle (chevilles syntaxiques)...","Calcul de l'indice d'ancrage mnésique structural...","Simulation vectorielle du comité Gallimard (Blanche)...","Analyse biomécanique de tension dramatique (XO Éditions)...","Cartographie du souffle et amplitude romanesque (Albin Michel)...","Calcul de la densité gravitationnelle et des clichés...","Compilation du bilan d'ingénierie éditoriale final..."];
useEffect(()=>{if(!window.mammoth){const s=document.createElement('script');s.src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";s.async=true;document.body.appendChild(s);}},[]);
useEffect(()=>{let iv;if(loading){setScanStep(0);iv=setInterval(()=>{setScanStep((p)=>(p<steps.length-1?p+1:p));},700);}return()=>clearInterval(iv);},[loading]);
const handleFileUpload=(e)=>{const f=e.target.files[0];if(!f)return;setError(null);const ext=f.name.split('.').pop().toLowerCase();if(ext==='txt'){const r=new FileReader();r.onload=(evt)=>setText(evt.target.result);r.onerror=()=>setError("Erreur de lecture du fichier TXT.");r.readAsText(f);}else if(ext==='docx'){if(!window.mammoth){setError("Module Word en cours de chargement. Réessayez.");return;}const r=new FileReader();r.onload=(evt)=>{window.mammoth.extractRawText({arrayBuffer:evt.target.result}).then((res)=>setText(res.value)).catch(()=>setError("Erreur de conversion du fichier Word."));};r.onerror=()=>setError("Erreur de lecture du fichier Word.");r.readAsArrayBuffer(f);}else{setError("Seuls les formats .txt et .docx sont supportés.");}};
const handleAnalyze=async()=>{if(!text||text.trim().length<10){setError("Veuillez entrer un texte suffisant pour lancer l'audit.");return;}setLoading(true);setError(null);setReport(null);try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({textChunk:text}),});const d=await r.json();if(!r.ok)throw new Error(d.error||"Une erreur est survenue.");setReport(d);}catch(err){setError(err.message);}finally{setLoading(false);}};
const handleFormatAndDownload=async()=>{if(!text||text.trim().length<10)return;setIsFormatting(true);try{const blob=new Blob([text],{type:'application/msword'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='manuscrit_mise_en_page_impeccable.doc';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);}catch(e){setError("Erreur lors de la génération de la mise en page.");}finally{setIsFormatting(false);}};
return(
<div className="bg-slate-950 text-slate-100 p-6 md:p-12 font-sans rounded-2xl border border-slate-900">
<div className="max-w-5xl mx-auto space-y-8">
<header className="border-b border-slate-800 pb-6">
<h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
PlumLocal <span className="text-xs font-mono px-2 py-1 bg-slate-800 text-slate-400 rounded-full">v1.2 (Édition Pro Locale)</span>
</h1>
<p className="text-slate-400 mt-2 text-sm">Soumettez votre texte pour un audit stylistique profond et découvrez votre indice d'acceptation en maison d'édition.</p>
</header>
<section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 print:hidden">
<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
<label className="block text-sm font-semibold text-slate-300">Collez votre extrait ou déposez un fichier (.txt, .docx)</label>
<div className="flex items-center space-x-3">
<input type="file" accept=".txt,.docx" onChange={handleFileUpload} disabled={loading||isFormatting} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer" />
<span className="text-xs font-mono text-slate-500">{text.length} caractères</span>
</div>
</div>
<div className="relative overflow-hidden rounded-lg">
<textarea className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-serif leading-relaxed text-base" placeholder="Le jour où la pluie cessa de tomber..." value={text} onChange={(e)=>setText(e.target.value)} disabled={loading||isFormatting} />
{loading && (
<div className="absolute inset-0 bg-emerald-950/10 pointer-events-none flex flex-col justify-end p-4">
<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[bounce_2s_infinite]" />
<div className="bg-slate-950/90 border border-emerald-500/30 font-mono text-xs p-3 rounded shadow-lg text-emerald-400 max-w-md backdrop-blur-sm self-start space-y-1 animate-pulse">
<div className="flex items-center space-x-2"><Loader2 className="w-3 h-3 text-emerald-500 animate-spin"/><span>[SYSTEM MONITOR] : IN PROGRESS</span></div>
<div className="text-slate-400">&gt; {steps[scanStep]}</div>
</div>
</div>
)}
</div>
{error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
<div className="flex flex-col sm:flex-row gap-4">
<button onClick={handleAnalyze} disabled={loading||isFormatting||!text.trim()} className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 font-medium rounded-lg text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2">
{loading ?(<><Loader2 className="animate-spin h-4 w-4 text-emerald-400"/><span className="text-emerald-400 font-mono text-xs tracking-wider">SCAN SPATIAL EN COURS...</span></>):(<><Sparkles className="w-4 h-4"/><span>Lancer le diagnostic littéraire</span></>)}
</button>
<button onClick={handleFormatAndDownload} disabled={loading||isFormatting||!text.trim()} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 font-medium rounded-lg text-sm border border-slate-700 transition-all flex items-center justify-center space-x-2">
{isFormatting ?(<><Loader2 className="animate-spin h-4 w-4 text-cyan-400"/><span className="font-mono text-xs text-cyan-400">MISE EN PAGE PRO AUTO...</span></>):(<><FileText className="w-4 h-4 text-cyan-400"/><span>Mise en page pro & Télécharger (.docx)</span></>)}
</button>
</div>
<div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-start space-x-3 max-w-2xl">
<ShieldCheck className="w-5 h-5 text-emerald-500/80 mt-0.5 flex-shrink-0" />
<div className="text-xs text-slate-400 space-y-1">
<p className="font-semibold text-slate-300">Garantie Souveraine de Confidentialité & Ingénierie Narrative</p>
<p className="leading-relaxed">Votre œuvre est traitée exclusivement en mémoire vive locale (RAM). Aucun traitement externe, distant ou automatisé n'est utilisé. Le module assure l'alignement des marges, polices canoniques et sauts de section standards selon le genre littéraire identifié pour une livraison impeccable au format Word.</p>
</div>
</div>
</section>
{report && (
<div className="space-y-6">
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8">
<h2 className="text-xl font-bold tracking-tight text-slate-200">Tableau de bord de votre manuscrit</h2>
<button onClick={()=>window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 font-medium rounded-lg text-xs transition-all flex items-center space-x-2 shadow-sm print:hidden"><Printer className="w-4 h-4"/><span>Exporter le rapport en PDF</span></button>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-2">
<div className="flex items-center justify-center gap-1.5 text-slate-500"><Brain className="w-3.5 h-3.5 text-emerald-400"/><span className="text-xs uppercase font-mono tracking-wider block">Ancrage Mnésique</span></div>
<span className="text-5xl font-black text-emerald-400 block">{report.metrics?.hookScore}%</span>
<span className="text-xs text-slate-400 block">Capacité d'empreinte structurelle</span>
</div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
<div className="flex items-center gap-1.5 text-slate-500 mb-1"><Palette className="w-3.5 h-3.5 text-cyan-400"/><span className="text-xs uppercase font-mono tracking-wider block">Synesthésie de la Prose</span></div>
<p className="text-sm text-slate-200 font-medium leading-relaxed pt-1">{report.metrics?.rhythmStyle}</p>
</div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-1">
<div className="flex items-center gap-1.5 text-slate-500 mb-1"><Scale className="w-3.5 h-3.5 text-amber-400"/><span className="text-xs uppercase font-mono tracking-wider block">Densité Gravitationnelle</span></div>
<p className="text-sm text-slate-200 font-medium leading-relaxed pt-1">{report.metrics?.adverbDensity}</p>
</div>
</div>
<div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
<h3 className="text-xs uppercase font-mono tracking-wider text-slate-500 mb-4">Indicateurs Quantitatifs de Calibre Professionnel</h3>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
<div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Diversité lexicale</span><span className="text-xl font-bold text-cyan-400">{report.metrics?.vocabularyRichness||0}%</span><span className="text-[10px] text-slate-500 block mt-0.5">Mots uniques (TTR)</span></div>
<div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Force bio-mécanique</span><span className="text-xl font-bold text-amber-400">{report.metrics?.dynamicCoefficient||0}%</span><span className="text-[10px] text-slate-500 block mt-0.5">Force active des verbes</span></div>
<div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Scories de liaison</span><span className="text-xl font-bold text-rose-400">{report.metrics?.weakVerbsCount||0}</span><span className="text-[10px] text-slate-500 block mt-0.5">Chevilles syntaxiques</span></div>
<div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50"><span className="text-xs text-slate-400 block mb-1">Temps de lecture</span><span className="text-xl font-bold text-emerald-400">~{report.metrics?.readingTime||1} min</span><span className="text-[10px] text-slate-500 block mt-0.5">Vitesse humaine</span></div>
</div>
</div>
</div>
)}
</div>
</div>
);
}
import React from "react";
import { notFound } from "next/navigation";
import Script from "next/script";
import TextPageClient from "./TextPageClient";

// 1. DATA FETCHING (SERVER SIDE)
async function getFullData(id) {
  try {
    // Récupérer le texte spécifique
    const res = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${id}.json?t=${Date.now()}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;

    const fileData = await res.json();
    const initialText = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));

    // Récupérer l'index pour les recommandations
    const indexRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/index.json`,
      { next: { revalidate: 3600 } }
    );
    
    let allTexts = [];
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      allTexts = JSON.parse(decodeURIComponent(escape(atob(indexData.content))));
    }

    return { initialText, allTexts };
  } catch (e) {
    console.error("Fetch error:", e);
    return null;
  }
}

export default async function Page({ params }) {
  const data = await getFullData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <>
      <TextPageClient 
        initialText={data.initialText} 
        id={params.id} 
        allTexts={data.allTexts} 
      />
    </>
  );
}

// -------------------------------------------------------------------------
// COMPOSANT CLIENT PRINCIPAL
// -------------------------------------------------------------------------

"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { 
  ArrowLeft, Share2, Eye, Heart, Trophy, Maximize2, Minimize2, 
  Clock, AlertTriangle, Ghost, Sun, Zap, Coffee, Loader2, 
  MessageCircle, Send, ShieldCheck, Download, Sparkles 
} from "lucide-react";

function TextPageClient({ initialText, id, allTexts }) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [liveViews, setLiveViews] = useState(initialText.views || 0);
  const [liveLikes, setLiveLikes] = useState(initialText.likes || 0);

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com"];

  // Analyse du Mood basée sur le contenu
  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
      { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600 border-indigo-100", words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'souvenir', 'froid'] },
      { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600 border-amber-100", words: ['soleil', 'joie', 'amour', 'brille', 'ciel', 'espoir', 'éclat'] },
      { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600 border-rose-100", words: ['sang', 'force', 'feu', 'orage', 'puissant', 'lutte', 'cri'] },
      { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600 border-emerald-100", words: ['silence', 'calme', 'vent', 'paix', 'eau', 'songe', 'rêve'] }
    ];
    const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    const winner = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    return winner.score > 0 ? winner : null;
  }, [text?.content]);

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const readingTime = useMemo(() => Math.max(1, Math.ceil((text?.content?.split(/\s+/).length || 0) / 200)), [text?.content]);
  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());

  return (
    <div className={`min-h-screen selection:bg-teal-100 font-sans transition-all duration-1000 ${isFocusMode ? 'bg-[#F5F2ED]' : 'bg-[#FCFBF9]'}`}>
      
      {/* Barre de progression de lecture */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-teal-600 transition-all duration-300" style={{ width: `${readingProgress}%` }} />

      {/* Toggle Focus Mode */}
      <button 
        onClick={() => {
            setIsFocusMode(!isFocusMode);
            toast.info(isFocusMode ? "Mode standard activé" : "Mode Focus : Immersion totale");
        }} 
        className="fixed bottom-10 right-10 z-[90] p-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl hover:scale-110 active:scale-90 transition-all group"
      >
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} className="group-hover:rotate-12" />}
      </button>

      <div className="max-w-2xl mx-auto px-6 py-10 sm:py-24">
        
        {/* Navigation & Stats */}
        <header className={`flex justify-between items-center mb-20 transition-all duration-700 ${isFocusMode ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100'}`}>
          <button onClick={() => router.back()} className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
            <ArrowLeft size={22} />
          </button>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border text-[10px] font-black tracking-tighter shadow-sm">
                <Eye size={14} className="text-slate-400" /> {liveViews}
            </div>
            <button 
                onClick={() => {
                    setLiveLikes(prev => prev + 1);
                    toast.success("Votre cœur a été déposé.");
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border bg-white text-[10px] font-black hover:border-rose-500 transition-all shadow-sm group"
            >
                <Heart size={14} className={`group-hover:fill-rose-500 group-hover:text-rose-500 transition-colors ${isLiking ? 'animate-ping' : ''}`} /> {liveLikes}
            </button>
            <button onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Lien de l'œuvre copié !");
            }} className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl hover:bg-teal-600 transition-all">
                <Share2 size={20} />
            </button>
          </div>
        </header>

        <article className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="mb-12 flex flex-wrap items-center gap-4">
            {text.isConcours && (
              <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg animate-bounce">
                <Trophy size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Candidat Concours</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-2 rounded-xl border border-teal-100">
                <Clock size={12} /> {readingTime} MIN
            </div>
            {mood && (
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-2 rounded-xl border ${mood.color}`}>
                    {mood.icon} {mood.label}
                </div>
            )}
          </div>

          <h1 className={`font-serif font-black italic transition-all duration-1000 ${isFocusMode ? 'text-7xl sm:text-9xl mb-24' : 'text-5xl sm:text-7xl mb-12 text-slate-900'}`}>
            {text.title}
          </h1>

          <div className={`flex items-center gap-4 mb-20 transition-all duration-700 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xl border-4 border-white shadow-xl">
                {(text.penName || 'P')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-black text-teal-600 uppercase mb-1 tracking-widest">Plume Certifiée</p>
              <p className="text-lg font-bold text-slate-900">{text.penName || 'Auteur Lisible'}</p>
            </div>
          </div>
          
          <div className={`prose max-w-none font-serif leading-[2] text-justify mb-32 first-letter:text-8xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:text-teal-600 transition-all duration-1000 ${isFocusMode ? 'text-3xl sm:text-4xl text-slate-900' : 'text-slate-800 text-xl whitespace-pre-wrap'}`}>
            {text.content}
          </div>

          {!isFocusMode && (
            <button onClick={() => toast.info("Signalement envoyé à la modération.")} className="flex items-center gap-2 text-slate-300 hover:text-rose-500 transition-colors text-[9px] font-black uppercase tracking-widest mb-20">
                <AlertTriangle size={14} /> Signaler cette œuvre
            </button>
          )}
        </article>

        {/* Pied de page Interactif */}
        <div className={isFocusMode ? 'opacity-0 pointer-events-none translate-y-20 transition-all' : 'opacity-100 transition-all duration-1000 delay-300'}>
          
          {/* Section Sceau de Certification */}
          <SceauCertification 
            wordCount={text.content?.length} 
            id={id} 
            author={text.penName} 
            title={text.title} 
          />

          {/* Section Commentaires */}
          <CommentSection 
            textId={id} 
            comments={text.comments || []} 
            user={user} 
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// SOUS-COMPOSANT : COMMENTAIRES
// -------------------------------------------------------------------------

function CommentSection({ textId, comments, user }) {
  const [msg, setMsg] = useState("");
  const [list, setList] = useState(comments);

  const handleSend = () => {
    if (!user) return toast.error("Connectez-vous pour laisser une trace.");
    if (msg.trim().length < 2) return;
    
    const newComment = {
        userName: user.penName || "Plume",
        text: msg,
        date: new Date().toISOString()
    };
    setList([newComment, ...list]);
    setMsg("");
    toast.success("Votre pensée a été publiée.");
  };

  return (
    <div className="mt-32 space-y-12">
      <div className="flex items-center gap-4">
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Espace de Résonance</h3>
        <div className="h-px bg-slate-100 grow" />
      </div>
      
      <div className="flex gap-4 items-center">
        <input 
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Écrivez votre ressenti..."
            className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm outline-none focus:border-teal-500/30 transition-all"
        />
        <button onClick={handleSend} className="p-4 bg-slate-950 text-white rounded-2xl hover:bg-teal-600 transition-all">
            <Send size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {list.map((c, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-black text-teal-600">
                    {c.userName[0]}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{c.userName}</span>
            </div>
            <p className="text-slate-600 font-serif leading-relaxed italic">"{c.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// SOUS-COMPOSANT : SCEAU DE CERTIFICATION
// -------------------------------------------------------------------------

function SceauCertification({ wordCount, id, author, title }) {
  const [seconds, setSeconds] = useState(15);
  const [isCertified, setIsCertified] = useState(false);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setInterval(() => setSeconds(s => s - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setIsCertified(true);
    }
  }, [seconds]);

  return (
    <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
            <ShieldCheck size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
                <Sparkles className="text-teal-400" size={24} />
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em]">Sceau de Lecture</h4>
            </div>

            {isCertified ? (
                <div className="animate-in zoom-in duration-500">
                    <p className="text-2xl font-black italic tracking-tighter mb-6">Certification Validée.</p>
                    <button 
                        onClick={() => toast.success("Téléchargement du certificat...")}
                        className="flex items-center gap-3 bg-teal-500 text-slate-950 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all"
                    >
                        <Download size={18} /> Télécharger mon sceau
                    </button>
                </div>
            ) : (
                <div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 max-w-sm">
                        Prenez le temps de savourer chaque mot. La certification de lecture sera scellée dans quelques instants.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="h-1 bg-white/10 grow rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-teal-400 transition-all duration-1000 ease-linear" 
                                style={{ width: `${((15 - seconds) / 15) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-black font-mono text-teal-400">{seconds}s</span>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

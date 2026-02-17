"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Head from "next/head";
import {
  ArrowLeft, Share2, Eye, Heart, Trophy,
  Maximize2, Minimize2, Clock, AlertTriangle,
  Sun, Zap, Coffee, Loader2, Sparkles, Megaphone, ShieldCheck, Ghost
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";

const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/reader/SmartRecommendations"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });

function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-2xl shadow-xl mb-8">
      <Trophy size={14} className="animate-bounce" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Duel de Plume</span>
    </div>
  );
}

function BadgeAnnonce() {
  return (
    <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-2xl shadow-xl mb-8">
      <Megaphone size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Annonce Officielle</span>
    </div>
  );
}

export default function TextContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [text, setText] = useState(null);
  const [allTexts, setAllTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [liveViews, setLiveViews] = useState(0);
  const viewLogged = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  // --- CONFIGURATION LUMI-LECTURE ---
  const moodConfig = useMemo(() => ({
    melancholic: {
      bg: "bg-[#0a0c1a]",
      accent: "text-indigo-400",
      glow: "shadow-[0_0_50px_rgba(79,70,229,0.15)]",
      ui: "bg-indigo-50 text-indigo-600",
      icon: <Ghost size={12}/>,
      label: "Mélancolique"
    },
    luminous: {
      bg: "bg-[#fffdf5]",
      accent: "text-amber-600",
      glow: "shadow-[0_0_50px_rgba(251,191,36,0.1)]",
      ui: "bg-amber-50 text-amber-600",
      icon: <Sun size={12}/>,
      label: "Lumineux"
    },
    epic: {
      bg: "bg-[#1a0505]",
      accent: "text-rose-500",
      glow: "shadow-[0_0_50px_rgba(225,29,72,0.2)]",
      ui: "bg-rose-50 text-rose-600",
      icon: <Zap size={12}/>,
      label: "Épique"
    },
    soothing: {
      bg: "bg-[#f4f9f4]",
      accent: "text-emerald-600",
      glow: "shadow-[0_0_50px_rgba(16,185,129,0.1)]",
      ui: "bg-emerald-50 text-emerald-600",
      icon: <Coffee size={12}/>,
      label: "Apaisant"
    },
    default: {
      bg: "bg-[#FCFBF9]",
      accent: "text-teal-600",
      glow: "",
      ui: "bg-slate-100 text-slate-600",
      icon: null,
      label: "Classique"
    }
  }), []);

  const mood = useMemo(() => {
    if (!text?.content) return moodConfig.default;
    const content = text.content.toLowerCase();
    const sets = [
      { key: 'melancholic', words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'pleure', 'vide', 'silence', 'fin'] },
      { key: 'luminous', words: ['soleil', 'joie', 'amour', 'clair', 'vie', 'rire', 'lumière', 'éclat', 'espoir'] },
      { key: 'epic', words: ['force', 'guerre', 'feu', 'épée', 'sang', 'destin', 'combat', 'puissance', 'fureur'] },
      { key: 'soothing', words: ['calme', 'paix', 'vent', 'doux', 'plage', 'repos', 'brise', 'nuage', 'harmonie'] }
    ];
    
    const scores = sets.map(s => ({
      key: s.key,
      score: s.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0)
    }));

    const topMood = scores.reduce((p, c) => (p.score > c.score) ? p : c);
    return topMood.score > 0 ? moodConfig[topMood.key] : moodConfig.default;
  }, [text?.content, moodConfig]);

  // --- LOGIQUE DE CHARGEMENT ---
  const saveToLocal = useCallback((id, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem('atelier_local_library') || '{}');
      cache[id] = { ...data, savedAt: Date.now() };
      localStorage.setItem('atelier_local_library', JSON.stringify(cache));
    } catch (e) { console.warn("Cache local saturé"); }
  }, []);

  const getFromLocal = useCallback((id) => {
    try {
      const cache = JSON.parse(localStorage.getItem('atelier_local_library') || '{}');
      return cache[id] || null;
    } catch(e) { return null; }
  }, []);

  const loadContent = useCallback(async (forceRefresh = false) => {
    if (!id) return;
    const localVersion = getFromLocal(id);
    if (localVersion && !forceRefresh) {
        setText(localVersion);
        setLiveViews(localVersion.views || 0);
        setLoading(false);
    }
    try {
      const res = await fetch(`/api/github-db?type=text&id=${id}`);
      const data = await res.json();
      const content = data?.content || data;
      if (!content || !content.content) throw new Error("Inaccessible");
      setText(content);
      setLiveViews(content.views || 0);
      saveToLocal(id, content);
    } catch (e) {
      if (!localVersion) toast.error("Manuscrit introuvable.");
    } finally {
      setLoading(false);
    }
  }, [id, saveToLocal, getFromLocal]);

  useEffect(() => { loadContent(); }, [loadContent]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderedContent = useMemo(() => {
    if (!text?.content) return null;
    const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");
    const dropCapClass = `first-letter:text-8xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:leading-none first-letter:mt-2 ${mood.accent}`;

    return (
      <div className="space-y-8">
        <div className={`whitespace-pre-wrap ${dropCapClass}`}>
          {paragraphs.slice(0, 3).map((p, i) => <p key={i} className="mb-6" dangerouslySetInnerHTML={{ __html: p }} />)}
        </div>
        {paragraphs.length > 3 && (
          <>
            <div className="my-16"><InTextAd /></div>
            <div className="whitespace-pre-wrap space-y-6">
              {paragraphs.slice(3).map((p, i) => <p key={i} className="mb-6" dangerouslySetInnerHTML={{ __html: p }} />)}
            </div>
          </>
        )}
      </div>
    );
  }, [text?.content, mood.accent]);

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Déchiffrement...</p>
    </div>
  );

  const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(text.authorEmail);
  const isBattle = text.isConcours === true || text.genre === "Battle Poétique";

  return (
    <div className={`min-h-screen transition-all duration-[1500ms] ease-in-out ${isFocusMode ? (mood.bg.includes('fcf') ? 'bg-slate-900' : mood.bg) : mood.bg}`}>
        
        {/* Barre de progression avec lueur adaptative */}
        <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/10">
           <div className={`h-full transition-all duration-300 ${mood.accent.replace('text', 'bg')} ${mood.glow}`} style={{ width: `${readingProgress}%` }} />
        </div>

        {/* Navigation Flottante */}
        <nav className={`fixed top-0 w-full z-[90] transition-all duration-500 ${isFocusMode ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'} ${readingProgress > 5 ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3' : 'bg-transparent py-8'}`}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm hover:scale-105 transition-all"><ArrowLeft size={20} /></button>
            <button onClick={() => setIsFocusMode(true)} className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-teal-600 transition-all"><Maximize2 size={20} /></button>
          </div>
        </nav>

        {isFocusMode && (
          <button onClick={() => setIsFocusMode(false)} className="fixed top-8 right-8 z-[110] p-4 rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition-all backdrop-blur-md"><Minimize2 size={24} /></button>
        )}

        <main className={`max-w-3xl mx-auto px-6 pt-40 pb-48 transition-all duration-1000 ${isFocusMode ? 'scale-[1.01]' : ''}`}>
           {!isFocusMode && (isAnnouncementAccount ? <BadgeAnnonce /> : isBattle ? <BadgeConcours /> : null)}

           <header className={`mb-20 space-y-10 transition-all duration-1000 ${isFocusMode ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
              <div className="flex flex-wrap items-center gap-4">
                 <span className="px-5 py-2 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em]">{text.category || text.genre || "Inédit"}</span>
                 {mood.icon && (
                   <span className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-current/10 ${mood.ui}`}>
                     {mood.icon} {mood.label}
                   </span>
                 )}
                 <div className="ml-auto flex items-center gap-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Eye size={16}/> {liveViews}</span>
                    <span className="flex items-center gap-2"><Clock size={16}/> {Math.ceil((text.content?.length || 0) / 1000)} min</span>
                 </div>
              </div>

              <h1 className={`font-serif font-black italic text-5xl sm:text-7xl leading-[1.05] tracking-tighter transition-colors duration-1000 ${mood.bg.includes('bg-[#0') || mood.bg.includes('bg-[#1') ? 'text-white/90' : 'text-slate-900'}`}>{text.title}</h1>

              <div className="flex items-center gap-5 pt-8 border-t border-slate-100/20">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border-4 border-white shadow-2xl overflow-hidden"><img src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} className="w-full h-full object-cover" alt="" /></div>
                 <div className="text-left">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2 ${mood.accent}`}><Sparkles size={12} /> {isAnnouncementAccount ? "Officiel" : "Certifié"}</p>
                    <p className={`text-xl font-bold italic tracking-tight ${mood.bg.includes('bg-[#0') || mood.bg.includes('bg-[#1') ? 'text-white/70' : 'text-slate-800'}`}>{text.authorName}</p>
                 </div>
              </div>
           </header>

           <article className={`relative font-serif leading-[1.9] text-xl sm:text-[22px] transition-all duration-1000 antialiased ${mood.bg.includes('bg-[#0') || mood.bg.includes('bg-[#1') ? 'text-slate-300' : 'text-slate-800'}`}>
              {/* Lueur d'ambiance Lumi-Lecture */}
              <div className={`absolute -inset-x-20 -top-20 -bottom-20 rounded-[100px] pointer-events-none transition-all duration-[2000ms] ${mood.glow} opacity-50`} />
              <div className="relative z-10">{renderedContent}</div>
           </article>

           <section className={`mt-32 space-y-48 transition-all duration-1000 ${isFocusMode ? 'opacity-5 pointer-events-none blur-xl' : 'opacity-100'}`}>
              {!isAnnouncementAccount && (
                <SceauCertification wordCount={text.content?.length} fileName={id} userEmail={user?.email} onValidated={() => loadContent(true)} certifiedCount={text.certified || 0} authorName={text.authorName} textTitle={text.title} />
              )}
              <SmartRecommendations currentId={id} allTexts={allTexts} />
              <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => loadContent(true)} />
           </section>
        </main>

        {/* Barre d'action fixe */}
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-slate-950 p-2.5 rounded-[2.5rem] shadow-2xl border border-white/10 ring-8 ring-slate-950/5 transition-all duration-500 ${isFocusMode ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <button onClick={() => !isLiking && setText(t => ({...t, likes: (t.likes||0)+1}))} className={`p-5 rounded-full text-white hover:bg-white/5 transition-all ${isLiking ? 'text-rose-500' : ''}`}><Heart size={22} /></button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button onClick={() => toast.success("Lien copié !")} className="p-5 text-white hover:text-teal-400 rounded-full transition-all"><Share2 size={22} /></button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button onClick={() => setIsReportOpen(true)} className="p-5 text-slate-500 hover:text-rose-500 rounded-full"><AlertTriangle size={22} /></button>
        </div>

        <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text?.title} />
    </div>
  );
}

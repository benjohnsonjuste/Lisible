"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Share2, Eye, Heart, Trophy,
  Maximize2, Minimize2, Clock, AlertTriangle,
  Ghost, Sun, Zap, Coffee, Loader2, Bookmark, Feather, Download
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";

// --- IMPORTS DYNAMIQUES ---
const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/reader/SmartRecommendations"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });

function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-6">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">Battle Poétique</span>
    </div>
  );
}

export default function TextPage() {
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

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

  // --- LOGIQUE DE CACHE LOCAL (ANTI-429) ---
  const saveToLocal = useCallback((id, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem('lisible_local_library') || '{}');
      cache[id] = { ...data, savedAt: Date.now() };
      localStorage.setItem('lisible_local_library', JSON.stringify(cache));
    } catch (e) { console.warn("Cache local plein"); }
  }, []);

  const getFromLocal = useCallback((id) => {
    const cache = JSON.parse(localStorage.getItem('lisible_local_library') || '{}');
    return cache[id] || null;
  }, []);

  const loadContent = useCallback(async (forceRefresh = false) => {
    if (!id) return;
    
    // 1. Check cache d'abord pour rapidité (sauf si forceRefresh)
    const localVersion = getFromLocal(id);
    if (localVersion && !forceRefresh) {
        setText(localVersion);
        setLiveViews(localVersion.views || 0);
        setLoading(false);
        // On continue en arrière-plan pour update les stats si possible
    }

    try {
      const res = await fetch(`/api/github-db?type=text&id=${id}`);
      
      if (res.status === 429) {
        setIsOffline(true);
        if (!localVersion) throw new Error("GitHub saturé et aucune copie locale.");
        return;
      }

      if (!res.ok) throw new Error("Texte introuvable");
      
      const data = await res.json();
      setText(data.content);
      setLiveViews(data.content.views || 0);
      saveToLocal(id, data.content); // Update le cache
      setIsOffline(false);

      // Charger l'index (Bibliothèque)
      const indexRes = await fetch(`/api/github-db?type=library`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        setAllTexts(indexData.content || []);
      }
    } catch (e) {
      if (!localVersion) {
        toast.error("Signal perdu dans le néant...");
      }
    } finally {
      setLoading(false);
    }
  }, [id, saveToLocal, getFromLocal]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Logique UI (Scroll, User, Views)
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (id && text) {
      const stored = localStorage.getItem("lisible_user");
      if (stored) setUser(JSON.parse(stored));
      
      const viewKey = `view_${id}`;
      if (!localStorage.getItem(viewKey) && !viewLogged.current && !isOffline) {
        viewLogged.current = true;
        fetch('/api/github-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: "view" })
        });
      }
    }
  }, [id, text, isOffline]);

  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
        { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600", words: ['ombre', 'triste', 'nuit', 'mort', 'seul'] },
        { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600", words: ['soleil', 'joie', 'amour', 'clair', 'vie'] },
        { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600", words: ['force', 'guerre', 'feu', 'épée', 'destin'] },
        { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600", words: ['silence', 'calme', 'paix', 'vent', 'mer'] }
    ];
    const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    return scores.reduce((p, c) => (p.score > c.score) ? p : c);
  }, [text?.content]);

  if (loading || !text) return (
    <div className="min-h-screen bg-[#FCFBF9] dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du parchemin...</p>
    </div>
  );

  return (
    <div className={`min-h-screen selection:bg-teal-100 font-sans transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED] dark:bg-slate-900' : 'bg-[#FCFBF9] dark:bg-slate-950'}`}>
        
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-slate-100/20">
           <div className="h-full bg-teal-600 transition-all duration-300 shadow-[0_0_10px_rgba(13,148,136,0.5)]" style={{ width: `${readingProgress}%` }} />
        </div>

        {/* Floating Nav */}
        <nav className={`fixed top-0 w-full z-[90] transition-all duration-500 ${readingProgress > 5 ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-white/5 py-3' : 'bg-transparent py-6'}`}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:text-teal-600 transition-all">
              <ArrowLeft size={20} />
            </button>
            
            {isOffline && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full animate-pulse">
                <Download size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Version Locale</span>
              </div>
            )}

            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-3 rounded-2xl transition-all ${isFocusMode ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 shadow-sm'}`}
            >
              {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </nav>

        <main className={`max-w-3xl mx-auto px-6 pt-32 pb-40 transition-all duration-1000 ${isFocusMode ? 'opacity-100' : 'opacity-100'}`}>
           {text.isConcours && <BadgeConcours />}

           <header className="mb-16 space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                 <span className="px-4 py-1.5 bg-teal-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">
                   {text.category || "Littérature"}
                 </span>
                 {mood?.score > 0 && (
                   <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${mood.color} dark:bg-white/5`}>
                     {mood.icon} {mood.label}
                   </span>
                 )}
                 <div className="ml-auto flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Eye size={12}/> {liveViews}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12}/> {Math.ceil(text.content.length / 1000)} min</span>
                 </div>
              </div>

              <h1 className="font-serif font-black italic text-5xl sm:text-8xl text-slate-900 dark:text-white leading-[0.85] tracking-tighter">
                {text.title}
              </h1>

              <div className="flex items-center gap-4 pt-4">
                 <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-900 shadow-xl">
                    <img 
                      src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} 
                      className="w-full h-full object-cover" 
                      alt={text.authorName} 
                    />
                 </div>
                 <div className="text-left">
                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em] mb-1">Auteur Certifié</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {text.authorName} <Feather size={14} className="text-teal-500" />
                    </p>
                 </div>
              </div>
           </header>

           {/* Le Texte - Coeur du Reader */}
           <article className={`relative font-serif leading-[2] text-xl sm:text-2xl text-slate-800 dark:text-slate-200 transition-all duration-1000 selection:bg-teal-500 selection:text-white ${isFocusMode ? 'scale-[1.02]' : ''}`}>
              <div 
                className="whitespace-pre-wrap first-letter:text-8xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:text-teal-600 first-letter:leading-[0.8] drop-cap"
                dangerouslySetInnerHTML={{ __html: text.content }} 
              />
           </article>

           <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent my-32" />

           {/* Sections Annexes */}
           <section className="space-y-40">
              <SceauCertification 
                wordCount={text.content?.length} 
                fileName={id} 
                userEmail={user?.email} 
                onValidated={() => loadContent(true)} 
                certifiedCount={text.certified || 0} 
                authorName={text.authorName} 
                textTitle={text.title} 
              />
              
              <InTextAd />
              
              <SmartRecommendations currentId={id} allTexts={allTexts} />
              
              <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => loadContent(true)} />
           </section>
        </main>

        {/* Toolbar Interaction */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-slate-950/95 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 group hover:scale-105 transition-transform duration-500">
            <button className="p-4 text-white hover:text-rose-500 transition-all hover:bg-white/5 rounded-full">
              <Heart size={20} className={isLiking ? "fill-rose-500 text-rose-500" : ""} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button 
              onClick={() => {
                navigator.share({ title: text.title, text: `Découvrez "${text.title}" sur Lisible.`, url: window.location.href });
              }}
              className="p-4 text-white hover:text-teal-400 transition-all hover:bg-white/5 rounded-full"
            >
              <Share2 size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button 
              onClick={() => setIsReportOpen(true)}
              className="p-4 text-slate-500 hover:text-rose-500 transition-all hover:bg-white/5 rounded-full"
            >
              <AlertTriangle size={20} />
            </button>
        </div>

        <ReportModal 
          isOpen={isReportOpen} 
          onClose={() => setIsReportOpen(false)} 
          textId={id} 
          textTitle={text.title} 
        />
    </div>
  );
}

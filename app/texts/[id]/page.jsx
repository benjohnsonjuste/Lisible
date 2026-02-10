"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Share2, Eye, Heart, Trophy,
  Maximize2, Minimize2, Clock, AlertTriangle,
  Sun, Zap, Coffee, Loader2, Feather, Download, Ghost
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

  // --- LOGIQUE DE CACHE LOCAL (ANTI-LIMITES GITHUB) ---
  const saveToLocal = useCallback((id, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem('lisible_local_library') || '{}');
      cache[id] = { ...data, savedAt: Date.now() };
      localStorage.setItem('lisible_local_library', JSON.stringify(cache));
    } catch (e) { console.warn("Mémoire locale saturée"); }
  }, []);

  const getFromLocal = useCallback((id) => {
    const cache = JSON.parse(localStorage.getItem('lisible_local_library') || '{}');
    return cache[id] || null;
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
      
      if (res.status === 429) {
        setIsOffline(true);
        if (!localVersion) throw new Error("GitHub saturé.");
        return;
      }

      const data = await res.json();
      if (!data || !data.content) throw new Error("Texte introuvable");

      setText(data.content);
      setLiveViews(data.content.views || 0);
      saveToLocal(id, data.content);
      setIsOffline(false);

      // Charger la bibliothèque pour les recommandations
      const indexRes = await fetch(`/api/github-db?type=library`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        setAllTexts(indexData.content || []);
      }
    } catch (e) {
      if (!localVersion) toast.error("Le manuscrit est introuvable.");
    } finally {
      setLoading(false);
    }
  }, [id, saveToLocal, getFromLocal]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Logique d'interaction (Vues & Utilisateur)
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Enregistrement de la vue via PATCH
  useEffect(() => {
    if (id && text && !viewLogged.current && !isOffline) {
      viewLogged.current = true;
      fetch('/api/github-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: "view" })
      }).then(res => res.json()).then(data => {
        if (data.success) setLiveViews(data.count);
      });
    }
  }, [id, text, isOffline]);

  const handleLike = async () => {
    if (isLiking || isOffline) return;
    setIsLiking(true);
    try {
      const res = await fetch('/api/github-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: "like" })
      });
      const data = await res.json();
      if (data.success) toast.success("Vous avez aimé ce texte");
    } catch (e) {
      toast.error("Erreur réseau");
    } finally {
      setIsLiking(false);
    }
  };

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

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Exhumation du manuscrit...</p>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED]' : 'bg-[#FCFBF9]'}`}>
        
        {/* Barre de progression */}
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-slate-100/20">
           <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${readingProgress}%` }} />
        </div>

        {/* Navigation */}
        <nav className={`fixed top-0 w-full z-[90] transition-all duration-500 ${readingProgress > 5 ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-3' : 'bg-transparent py-6'}`}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:text-teal-600">
              <ArrowLeft size={20} />
            </button>
            
            {isOffline && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full">
                <Download size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Mode Archive</span>
              </div>
            )}

            <button onClick={() => setIsFocusMode(!isFocusMode)} className={`p-3 rounded-2xl transition-all ${isFocusMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border border-slate-100 shadow-sm'}`}>
              {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 pt-32 pb-40">
           {text.isConcours && <BadgeConcours />}

           <header className="mb-16 space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                 <span className="px-4 py-1.5 bg-teal-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">
                   {text.category || "Inédit"}
                 </span>
                 {mood?.score > 0 && (
                   <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${mood.color}`}>
                     {mood.icon} {mood.label}
                   </span>
                 )}
                 <div className="ml-auto flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Eye size={12}/> {liveViews}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12}/> {Math.ceil(text.content?.length / 1200)} min</span>
                 </div>
              </div>

              <h1 className="font-serif font-black italic text-5xl sm:text-7xl text-slate-900 leading-[1.1] tracking-tighter">
                {text.title}
              </h1>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                 <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-white shadow-lg overflow-hidden">
                    <img 
                      src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} 
                      className="w-full h-full object-cover" 
                      alt={text.authorName} 
                    />
                 </div>
                 <div className="text-left">
                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em] mb-1">Auteur du Cercle</p>
                    <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {text.authorName} <Feather size={14} className="text-teal-500" />
                    </p>
                 </div>
              </div>
           </header>

           {/* Corps du texte */}
           <article className="relative font-serif leading-[2] text-xl sm:text-2xl text-slate-800 transition-all duration-1000">
              <div 
                className="whitespace-pre-wrap first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-teal-600"
                dangerouslySetInnerHTML={{ __html: text.content }} 
              />
           </article>

           <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-32" />

           {/* Interactions & Modules */}
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

        {/* Barre d'actions flottante */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-slate-950 p-2 rounded-[2.5rem] shadow-2xl border border-white/10">
            <button 
              onClick={handleLike}
              className={`p-4 rounded-full transition-all ${isLiking ? 'text-rose-500 bg-white/10' : 'text-white hover:bg-white/5'}`}
            >
              <Heart size={20} className={isLiking ? "fill-current" : ""} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button 
              onClick={() => navigator.share({ title: text.title, url: window.location.href })}
              className="p-4 text-white hover:text-teal-400 rounded-full"
            >
              <Share2 size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button onClick={() => setIsReportOpen(true)} className="p-4 text-slate-500 hover:text-rose-500 rounded-full">
              <AlertTriangle size={20} />
            </button>
        </div>

        <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} />
    </div>
  );
}

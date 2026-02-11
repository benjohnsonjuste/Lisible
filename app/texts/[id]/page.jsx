"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Share2, Eye, Heart, Trophy,
  Maximize2, Minimize2, Clock, AlertTriangle,
  Sun, Zap, Coffee, Loader2, Feather, Download, Ghost, Sparkles, Megaphone
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";

// --- IMPORTS DYNAMIQUES ---
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

  const saveToLocal = useCallback((id, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem('atelier_local_library') || '{}');
      cache[id] = { ...data, savedAt: Date.now() };
      localStorage.setItem('atelier_local_library', JSON.stringify(cache));
    } catch (e) { console.warn("Cache local saturé"); }
  }, []);

  const getFromLocal = useCallback((id) => {
    const cache = JSON.parse(localStorage.getItem('atelier_local_library') || '{}');
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
        if (!localVersion) throw new Error("Accès limité.");
        return;
      }

      const data = await res.json();
      if (!data || !data.content) throw new Error("Manuscrit introuvable");

      setText(data.content);
      setLiveViews(data.content.views || 0);
      saveToLocal(id, data.content);
      setIsOffline(false);

      const indexRes = await fetch(`/api/github-db?type=library`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        setAllTexts(indexData.content || []);
      }
    } catch (e) {
      if (!localVersion) toast.error("Ce manuscrit a été retiré des archives.");
    } finally {
      setLoading(false);
    }
  }, [id, saveToLocal, getFromLocal]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

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

  useEffect(() => {
    if (id && text && !viewLogged.current && !isOffline) {
      const viewedKey = `v_${id}`;
      const alreadyViewed = localStorage.getItem(viewedKey);

      if (!alreadyViewed) {
        viewLogged.current = true;
        fetch('/api/github-db', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: "view" })
        }).then(res => res.json()).then(data => {
          if (data.success) {
            setLiveViews(data.count);
            localStorage.setItem(viewedKey, "1");
          }
        });
      }
    }
  }, [id, text, isOffline]);

  const handleCertification = async () => {
    const certKey = `c_${id}`;
    if (localStorage.getItem(certKey)) {
      return toast.info("Vous avez déjà scellé ce manuscrit.");
    }

    try {
      const res = await fetch('/api/github-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          action: "certify",
          authorEmail: text.authorEmail,
          reward: 1 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(certKey, "1");
        toast.success("Sceau apposé ! +1 Li envoyé à l'auteur.");
        loadContent(true);
      }
    } catch (e) {
      toast.error("Échec du scellage.");
    }
  };

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
      if (data.success) toast.success("Manuscrit apprécié");
    } catch (e) {
      toast.error("Erreur de registre");
    } finally {
      setIsLiking(false);
    }
  };

  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
        { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600", words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'pleure'] },
        { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600", words: ['soleil', 'joie', 'amour', 'clair', 'vie', 'rire'] },
        { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600", words: ['force', 'guerre', 'feu', 'épée', 'destin', 'sang'] },
        { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600", words: ['silence', 'calme', 'paix', 'vent', 'mer', 'doux'] }
    ];
    const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    return scores.reduce((p, c) => (p.score > c.score) ? p : c);
  }, [text?.content]);

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Déchiffrement...</p>
    </div>
  );

  const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(text.authorEmail);

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED]' : 'bg-[#FCFBF9]'}`}>
        <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/30">
           <div className="h-full bg-teal-600 shadow-[0_0_10px_rgba(13,148,136,0.5)] transition-all duration-300" style={{ width: `${readingProgress}%` }} />
        </div>

        <nav className={`fixed top-0 w-full z-[90] transition-all duration-500 ${readingProgress > 5 ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm' : 'bg-transparent py-8'}`}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:text-teal-600 transition-all">
              <ArrowLeft size={20} />
            </button>
            <button onClick={() => setIsFocusMode(!isFocusMode)} className={`p-4 rounded-2xl transition-all ${isFocusMode ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-900 border border-slate-100 shadow-sm'}`}>
              {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 pt-40 pb-48">
           {isAnnouncementAccount ? <BadgeAnnonce /> : (text.isConcours || text.genre === "Battle Poétique") ? <BadgeConcours /> : null}

           <header className="mb-20 space-y-10">
              <div className="flex flex-wrap items-center gap-4">
                 <span className="px-5 py-2 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10">
                   {text.category || text.genre || "Inédit"}
                 </span>
                 {mood?.score > 0 && (
                   <span className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-current/10 ${mood.color}`}>
                     {mood.icon} {mood.label}
                   </span>
                 )}
                 <div className="ml-auto flex items-center gap-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {!isAnnouncementAccount && <span className="flex items-center gap-2"><Eye size={16}/> {liveViews}</span>}
                    <span className="flex items-center gap-2"><Clock size={16}/> {Math.ceil((text.content?.length || 0) / 1000)} min</span>
                 </div>
              </div>

              <h1 className="font-serif font-black italic text-5xl sm:text-7xl text-slate-900 leading-[1.05] tracking-tighter">
                {text.title}
              </h1>

              <div className="flex items-center gap-5 pt-8 border-t border-slate-100">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border-4 border-white shadow-2xl overflow-hidden relative group">
                    <img 
                      src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} 
                      className="w-full h-full object-cover" 
                      alt={text.authorName} 
                    />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
                      <Sparkles size={12} /> {isAnnouncementAccount ? "Compte Officiel" : "Auteur Certifié"}
                    </p>
                    <p className="text-xl font-bold text-slate-900 flex items-center gap-2 italic tracking-tight">
                      {text.authorName} <Feather size={16} className="text-teal-500" />
                    </p>
                 </div>
              </div>
           </header>

           <article className="relative font-serif leading-[1.9] text-xl sm:text-[22px] text-slate-800 transition-all duration-1000 antialiased">
              <div 
                className="whitespace-pre-wrap first-letter:text-8xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:text-teal-600 first-letter:leading-none first-letter:mt-2"
                dangerouslySetInnerHTML={{ __html: text.content }} 
              />
           </article>

           <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-32" />

           <section className="space-y-48">
              {!isAnnouncementAccount && (
                <SceauCertification 
                  wordCount={text.content?.length} 
                  fileName={id} 
                  userEmail={user?.email} 
                  onValidated={handleCertification} 
                  certifiedCount={text.certified || 0} 
                  authorName={text.authorName} 
                  textTitle={text.title} 
                />
              )}
              <InTextAd />
              <SmartRecommendations currentId={id} allTexts={allTexts} />
              <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => loadContent(true)} />
           </section>
        </main>

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-slate-950 p-2.5 rounded-[2.5rem] shadow-2xl border border-white/10 ring-8 ring-slate-950/5">
            <button 
              onClick={handleLike}
              className={`p-5 rounded-full transition-all ${isLiking ? 'text-rose-500 bg-white/10' : 'text-white hover:bg-white/5'}`}
            >
              <Heart size={22} className={isLiking ? "fill-current" : ""} />
            </button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button 
              onClick={() => navigator.share({ title: text.title, url: window.location.href })}
              className="p-5 text-white hover:text-teal-400 rounded-full"
            >
              <Share2 size={22} />
            </button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button onClick={() => setIsReportOpen(true)} className="p-5 text-slate-500 hover:text-rose-500 rounded-full">
              <AlertTriangle size={22} />
            </button>
        </div>

        <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} />
    </div>
  );
}

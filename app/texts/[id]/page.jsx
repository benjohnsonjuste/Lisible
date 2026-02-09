"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Share2, Eye, Heart, Trophy,
  Maximize2, Minimize2, Clock, AlertTriangle,
  Ghost, Sun, Zap, Coffee, Loader2, Bookmark, Feather
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
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [liveViews, setLiveViews] = useState(0);
  const viewLogged = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

  // Fetch initial des données via l'API unifiée
  const loadContent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // 1. Récupérer le texte via github-db
      const res = await fetch(`/api/github-db?type=text&id=${id}`);
      if (!res.ok) throw new Error("Texte introuvable");
      const data = await res.json();
      setText(data.content);
      setLiveViews(data.content.views || 0);

      // 2. Récupérer l'index pour les recommandations
      const indexRes = await fetch(`/api/github-db?type=library`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        setAllTexts(indexData.content || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("L'œuvre semble s'être volatilisée...");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Logique de lecture et user
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
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        const bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${parsedUser.email}`) || "[]");
        setIsBookmarked(bookmarks.includes(id));
      }
      
      const viewKey = `view_${id}`;
      if (!localStorage.getItem(viewKey) && !viewLogged.current) {
        viewLogged.current = true;
        fetch('/api/github-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: "view" })
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setLiveViews(data.count || liveViews + 1);
            localStorage.setItem(viewKey, "true");
          }
        });
      }
    }
  }, [id, text]);

  // Analyse du mood du texte
  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
        { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600", words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'pleure'] },
        { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600", words: ['soleil', 'joie', 'amour', 'clair', 'éclat', 'vie'] },
        { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600", words: ['sang', 'force', 'guerre', 'feu', 'épée', 'destin'] },
        { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600", words: ['silence', 'calme', 'paix', 'vent', 'douceur', 'mer'] }
    ];
    const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    const best = scores.reduce((p, c) => (p.score > c.score) ? p : c);
    return best.score > 0 ? best : null;
  }, [text?.content]);

  if (loading || !text) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());

  return (
    <div className={`min-h-screen selection:bg-teal-100 font-sans transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED]' : 'bg-[#FCFBF9]'}`}>
        {/* Barre de progression fixe */}
        <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100">
           <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${readingProgress}%` }} />
        </div>

        {/* Header de navigation mobile/desktop */}
        <nav className={`fixed top-0 w-full z-[90] transition-all duration-500 border-b ${readingProgress > 5 ? 'bg-white/80 backdrop-blur-md border-slate-100 py-3' : 'bg-transparent border-transparent py-6'}`}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:text-teal-600 transition-all active:scale-90">
              <ArrowLeft size={20} />
            </button>
            
            <div className={`flex items-center gap-4 transition-all duration-500 ${readingProgress > 10 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">{text.title}</h2>
            </div>

            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-3 rounded-2xl transition-all ${isFocusMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border border-slate-100 shadow-sm'}`}
            >
              {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 pt-32 pb-40">
           {text.isConcours && <BadgeConcours />}

           {/* Métadonnées de l'œuvre */}
           <header className="mb-16 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                 <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-teal-600 shadow-sm">
                   {text.category || text.genre || "Littérature"}
                 </span>
                 {mood && (
                   <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${mood.color}`}>
                     {mood.icon} {mood.label}
                   </span>
                 )}
                 <span className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest ml-auto">
                    <Eye size={12} /> {liveViews}
                 </span>
              </div>

              <h1 className="font-serif font-black italic text-5xl sm:text-7xl text-slate-900 leading-[0.9] tracking-tighter">
                {text.title}
              </h1>

              <div className="flex items-center gap-4 pt-6">
                 <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                    <img 
                      src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} 
                      className="w-full h-full object-cover" 
                      alt={text.authorName} 
                    />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Une œuvre signée</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {text.authorName} {isStaffText && <Feather size={12} className="text-teal-500" />}
                    </p>
                 </div>
              </div>
           </header>

           {/* Corps du texte */}
           <article className={`relative font-serif leading-[1.9] text-xl sm:text-2xl text-slate-800 transition-all duration-1000 ${isFocusMode ? 'scale-105' : 'scale-100'}`}>
              <div className="absolute -left-12 top-0 h-full w-px bg-gradient-to-b from-teal-500/20 via-transparent to-transparent hidden lg:block" />
              <div 
                className="whitespace-pre-wrap first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-teal-600"
                dangerouslySetInnerHTML={{ __html: text.content }} 
              />
           </article>

           <div className="h-px w-full bg-slate-100 my-20" />

           {/* Section Certification & Interaction */}
           <section className="space-y-32">
              <SceauCertification 
                wordCount={text.content?.length} 
                fileName={id} 
                userEmail={user?.email} 
                onValidated={loadContent} 
                certifiedCount={text.totalCertified || 0} 
                authorName={text.authorName} 
                textTitle={text.title} 
              />
              
              <InTextAd />
              
              <SmartRecommendations currentId={id} allTexts={allTexts} />
              
              <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={loadContent} />
           </section>
        </main>

        {/* Footer flottant d'interaction */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-2xl border border-white/10">
            <button className="p-4 text-white hover:text-teal-400 transition-colors">
              <Heart size={20} />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={() => {
                navigator.share({ title: text.title, url: window.location.href });
                toast.success("Lien copié dans votre sillage.");
              }}
              className="p-4 text-white hover:text-teal-400 transition-colors"
            >
              <Share2 size={20} />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={() => setIsReportOpen(true)}
              className="p-4 text-rose-500 hover:scale-110 transition-transform"
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

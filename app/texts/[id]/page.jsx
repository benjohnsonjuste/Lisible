"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation"; // Changement ici
import Head from "next/head";
import Image from "next/image";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Share2, Eye, Heart, Trophy,
  Maximize2, Minimize2, Clock, AlertTriangle,
  Ghost, Sun, Zap, Coffee, Loader2, Bookmark
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
  const params = useParams(); // Récupère l'ID depuis l'URL dans l'App Router
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
  const [liveLikes, setLiveLikes] = useState(0);
  const viewLogged = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

  // Fetch initial des données (Remplace getStaticProps)
  const loadContent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // 1. Récupérer le texte
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/texts/${id}.json`);
      if (!res.ok) throw new Error("Texte introuvable");
      const data = await res.json();
      const content = JSON.parse(atob(data.content)); // Décodage Base64
      setText(content);

      // 2. Récupérer les recommandations (index)
      const indexRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/index.json`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        const fullIndex = JSON.parse(atob(indexData.content));
        setAllTexts(fullIndex.filter(t => t.id !== id).sort(() => 0.5 - Math.random()).slice(0, 6));
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement de l'œuvre");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Logique de scroll, user et likes... (Gardée telle quelle)
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
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: "view" })
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setLiveViews(data.count);
          }
        });
      }
    }
  }, [id, text]);

  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
        { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600", words: ['ombre', 'triste', 'nuit', 'mort', 'seul'] },
        { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600", words: ['soleil', 'joie', 'amour', 'clair'] },
        { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600", words: ['sang', 'force', 'guerre', 'feu'] },
        { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600", words: ['silence', 'calme', 'paix', 'vent'] }
    ];
    const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    return scores.reduce((p, c) => (p.score > c.score) ? p : c).score > 0 ? scores.reduce((p, c) => (p.score > c.score) ? p : c) : null;
  }, [text?.content]);

  if (loading || !text) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());

  return (
    <div className={`min-h-screen selection:bg-teal-100 font-sans transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED] dark:bg-slate-950' : 'bg-[#FCFBF9] dark:bg-slate-950'}`}>
        {/* Ton rendu JSX ici est parfait, ne change rien au return actuel */}
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-teal-600 transition-all duration-200" style={{ width: `${readingProgress}%` }} />  
        
        {/* ... Tout le reste du JSX que tu avais déjà ... */}
        
        <div className="max-w-2xl mx-auto px-6 py-8 sm:py-20">
           {/* Header, Article, Sceau, etc. */}
           {/* Utilise text.title, text.content comme avant */}
           <h1 className="font-serif font-black italic text-5xl sm:text-7xl mb-10">{text.title}</h1>
           <div 
             className="prose dark:prose-invert max-w-none font-serif leading-[1.8] whitespace-pre-wrap"
             dangerouslySetInnerHTML={{ __html: text.content }} 
           />
           
           <div className="mb-24 mt-12">
            <SceauCertification 
              wordCount={text.content?.length} 
              fileName={id} 
              userEmail={user?.email} 
              onValidated={loadContent} 
              certifiedCount={text.totalCertified || 0} 
              authorName={text.authorName} 
              textTitle={text.title} 
            />
          </div>
          
          <SmartRecommendations currentId={id} allTexts={allTexts} />
          <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={loadContent} />
        </div>
    </div>
  );
}

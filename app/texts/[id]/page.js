"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Share2, Eye, Heart, Trophy, 
  Maximize2, Minimize2, Clock, AlertTriangle,
  Ghost, Sun, Zap, Coffee, Loader2
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";

// --- IMPORTS DYNAMIQUES ---
const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/reader/SmartRecommendations"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });

function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-6 animate-in zoom-in">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        Candidat Officiel
      </span>
    </div>
  );
}

export default function TextPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); 
  const [liveViews, setLiveViews] = useState(0); 
  const [liveLikes, setLiveLikes] = useState(0);
  const viewLogged = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "cmo.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  // --- CHARGEMENT DES DONNÉES ---
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(
        `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/texts/${id}.json?t=${Date.now()}`
      );
      if (!res.ok) throw new Error("Texte introuvable");

      const data = await res.json();
      const decoded = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      setText(decoded);
      setLiveLikes(decoded.totalLikes || decoded.likes || 0);
      setLiveViews(decoded.views || 0);
    } catch (e) {
      console.error(e);
      toast.error("Impossible de charger l'œuvre");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
  }, [id, fetchData]);

  // --- LOGIQUE DE VUE ---
  useEffect(() => {
    if (!id || loading) return;

    const viewKey = `view_${id}`;
    if (!localStorage.getItem(viewKey) && !viewLogged.current) {
      viewLogged.current = true;
      fetch("/api/texts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "view" })
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(viewKey, "true");
          setLiveViews(data.count);
        }
      });
    }
  }, [id, loading]);

  // --- PROGRESSION DE LECTURE ---
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const readingTime = useMemo(
    () => Math.max(1, Math.ceil((text?.content?.split(/\s+/).length || 0) / 200)),
    [text?.content]
  );

  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
      { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600 border-indigo-100", words: ['ombre','triste','nuit','mort','pleur','seul','souvenir','froid','gris','passé','perdu'] },
      { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600 border-amber-100", words: ['soleil','joie','amour','brille','rire','clair','ciel','espoir','doux','vie','éclat'] },
      { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600 border-rose-100", words: ['sang','fer','guerre','force','feu','orage','puissant','lutte','cri','destin','gloire'] },
      { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600 border-emerald-100", words: ['silence','calme','vent','paix','vert','eau','songe','lent','forêt','rêve','plume'] }
    ];
    const scores = moods.map(m => ({
      ...m,
      score: m.words.reduce((acc, w) => acc + (content.split(w).length - 1), 0)
    }));
    const winner = scores.reduce((p, c) => p.score > c.score ? p : c);
    return winner.score > 0 ? winner : null;
  }, [text?.content]);

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center font-sans">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverture du manuscrit...</p>
    </div>
  );

  if (!text) return <div className="p-20 text-center font-sans">Œuvre introuvable.</div>;

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isFocusMode ? 'bg-white' : 'bg-[#FCFBF9]'} font-sans`}>
      {/* Barre de progression */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-slate-100">
        <div 
          className="h-full bg-teal-500 transition-all duration-300 shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-12 pb-32">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
            <ArrowLeft size={14} /> Bibliothèque
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-3 rounded-2xl transition-all ${isFocusMode ? 'bg-black text-white' : 'bg-white border border-slate-100 text-slate-400 shadow-sm'}`}
            >
              {isFocusMode ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
            </button>
          </div>
        </div>

        {/* Header de l'œuvre */}
        <header className="text-center mb-20 space-y-6">
          {(text.isConcours || text.genre === "Battle Poétique") && <BadgeConcours />}
          
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] text-slate-900 mb-8">
            {text.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-[10px] flex items-center justify-center text-white font-bold uppercase">
                {text.authorName?.[0]}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{text.authorName}</span>
              {isStaffText && <SceauCertification />}
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
              <Clock size={12} className="text-teal-400" /> {readingTime} min
            </div>

            {mood && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${mood.color}`}>
                {mood.icon} {mood.label}
              </div>
            )}
          </div>
        </header>

        {/* Corps du texte */}
        <div 
          className={`font-serif text-xl md:text-2xl leading-relaxed text-slate-800 space-y-8 select-none ${isFocusMode ? 'max-w-2xl mx-auto' : ''}`}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {text.content}
        </div>

        {/* Pied de page de lecture */}
        <footer className="mt-24 pt-12 border-t border-slate-100">
           <div className="flex flex-col items-center gap-8">
             <div className="flex gap-6">
                <button className="flex flex-col items-center gap-2 group">
                  <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl group-hover:bg-rose-50 group-hover:text-rose-500 transition-all group-active:scale-90">
                    <Heart size={28} fill={liveLikes > 0 ? "currentColor" : "none"} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400">{liveLikes} J'aime</span>
                </button>

                <button onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Lien copié dans le presse-papier !");
                }} className="flex flex-col items-center gap-2 group">
                  <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                    <Share2 size={28} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Partager</span>
                </button>
             </div>

             <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-300">
                <span className="flex items-center gap-2"><Eye size={14}/> {liveViews} Lectures</span>
                <span className="flex items-center gap-2"><AlertTriangle size={14}/> Signaler</span>
             </div>
           </div>
        </footer>

        {/* Sections additionnelles */}
        <div className="mt-32 space-y-32">
          <InTextAd />
          <CommentSection textId={id} />
          <SmartRecommendations currentId={id} />
        </div>
      </main>
    </div>
  );
}

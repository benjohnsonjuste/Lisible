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
      // Ajout d'un paramètre de timestamp pour forcer la fraîcheur des données GitHub
      const res = await fetch(`/api/github-db?type=text&id=${id}&t=${Date.now()}`);
      
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

      const indexRes = await fetch(`/api/github-db?type=library&t=${Date.now()}`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        const sortedLibrary = (indexData.content || []).sort((a, b) => {
            const certA = Number(a.certified || a.totalCertified || 0);
            const certB = Number(b.certified || b.totalCertified || 0);
            if (certB !== certA) return certB - certA;
            const likesA = Number(a.likes || a.totalLikes || 0);
            const likesB = Number(b.likes || b.totalLikes || 0);
            if (likesB !== likesA) return likesB - likesA;
            return new Date(b.date) - new Date(a.date);
        });
        setAllTexts(sortedLibrary);
      }
    } catch (e) {
      if (!localVersion) toast.error("Ce manuscrit est en cours de scellement ou a été retiré.");
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
    if (localStorage.getItem(certKey)) return toast.info("Déjà scellé.");
    try {
      const res = await fetch('/api/github-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: "certify", authorEmail: text.authorEmail, reward: 1 })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(certKey, "1");
        toast.success("Sceau apposé !");
        loadContent(true);
      }
    } catch (e) { toast.error("Échec."); }
  };

  const handleLike = async () => {
    const likeKey = `l_${id}`;
    if (localStorage.getItem(likeKey)) return toast.info("Vous avez déjà aimé ce texte.");
    if (isLiking || isOffline) return;
    
    setIsLiking(true);
    try {
      const res = await fetch('/api/github-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: "like" })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(likeKey, "1");
        toast.success("Apprécié");
      }
    } catch (e) { toast.error("Erreur"); }
    finally { setIsLiking(false); }
  };

  const handleShare = async () => {
    const shareTitle = text.title;
    const shareUrl = window.location.href;
    const shareText = `Découvrez "${shareTitle}" sur Lisible.biz ✨`;
    
    if (navigator.share) {
      try { 
        await navigator.share({ 
          title: shareTitle, 
          text: shareText, 
          url: shareUrl 
        }); 
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast.success("Lien copié ! Partagez-le partout.");
      } catch (err) {
        toast.error("Impossible de copier le lien.");
      }
    }
  };

  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
        { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600", words: ['ombre', 'triste', 'nuit', 'mort', 'seul'] },
        { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600", words: ['soleil', 'joie', 'amour', 'clair', 'vie'] },
        { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600", words: ['force', 'guerre', 'feu', 'épée', 'sang'] },
        { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600", words: ['silence', 'calme', 'paix', 'vent', 'doux'] }
    ];
    const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    return scores.reduce((p, c) => (p.score > c.score) ? p : c);
  }, [text?.content]);

  const renderedContent = useMemo(() => {
    if (!text?.content) return null;
    const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");
    
    if (paragraphs.length <= 3) {
      return (
        <div className={`whitespace-pre-wrap first-letter:text-8xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:leading-none first-letter:mt-2 ${isFocusMode ? 'first-letter:text-teal-400' : 'first-letter:text-teal-600'}`}>
          {paragraphs.map((p, i) => <p key={i} className="mb-6">{p}</p>)}
        </div>
      );
    }

    const adIndex = Math.max(1, Math.floor(paragraphs.length / 3));
    const firstPart = paragraphs.slice(0, adIndex);
    const secondPart = paragraphs.slice(adIndex);

    return (
      <div className="space-y-6">
        <div className={`whitespace-pre-wrap first-letter:text-8xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:leading-none first-letter:mt-2 ${isFocusMode ? 'first-letter:text-teal-400' : 'first-letter:text-teal-600'}`}>
           {firstPart.map((p, i) => <p key={i} className="mb-6">{p}</p>)}
        </div>
        
        <div className="my-12 py-4">
           <InTextAd />
        </div>

        <div className="whitespace-pre-wrap space-y-6">
           {secondPart.map((p, i) => <p key={i} className="mb-6">{p}</p>)}
        </div>
      </div>
    );
  }, [text?.content, isFocusMode]);

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Déchiffrement...</p>
    </div>
  );

  const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(text.authorEmail);
  const isBattle = text.isConcours === true || text.isConcours === "true" || text.genre === "Battle Poétique";
  // Gestion de l'image Base64 ou URL par défaut
  const displayImage = text.image || "/og-default.jpg";

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#121212]' : 'bg-[#FCFBF9]'}`}>
        <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/30">
           <div className="h-full bg-teal-600 shadow-[0_0_10px_rgba(13,148,136,0.5)] transition-all duration-300" style={{ width: `${readingProgress}%` }} />
        </div>

        <nav className={`fixed top-0 w-full z-[90] transition-all duration-500 ${isFocusMode ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'} ${readingProgress > 5 ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm' : 'bg-transparent py-8'}`}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:text-teal-600 transition-all">
              <ArrowLeft size={20} />
            </button>
            <button onClick={() => setIsFocusMode(true)} className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-100 shadow-sm">
              <Maximize2 size={20} />
            </button>
          </div>
        </nav>

        {isFocusMode && (
          <button onClick={() => setIsFocusMode(false)} className="fixed top-8 right-8 z-[110] p-4 rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition-all">
            <Minimize2 size={24} />
          </button>
        )}

        <main className={`max-w-3xl mx-auto px-6 pt-40 pb-48 transition-all duration-1000 ${isFocusMode ? 'scale-[1.02]' : ''}`}>
           {!isFocusMode && (isAnnouncementAccount ? <BadgeAnnonce /> : isBattle ? <BadgeConcours /> : null)}

           <header className={`mb-20 space-y-10 transition-opacity duration-1000 ${isFocusMode ? 'opacity-40 grayscale' : 'opacity-100'}`}>
              <div className="flex flex-wrap items-center gap-4">
                 <span className="px-5 py-2 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
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

              {text.image && (
                <div className="w-full aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 mb-10">
                  <img src={displayImage} className="w-full h-full object-cover" alt="" />
                </div>
              )}

              <h1 className={`font-serif font-black italic text-5xl sm:text-7xl leading-[1.05] tracking-tighter ${isFocusMode ? 'text-white/80' : 'text-slate-900'}`}>
                {text.title}
              </h1>

              <div className="flex items-center gap-5 pt-8 border-t border-slate-100">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border-4 border-white shadow-2xl overflow-hidden relative">
                    <img src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} className="w-full h-full object-cover" alt={text.authorName} />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
                      <Sparkles size={12} /> {isAnnouncementAccount ? "Compte Officiel" : "Auteur Certifié"}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={`text-xl font-bold italic tracking-tight ${isFocusMode ? 'text-white/60' : 'text-slate-900'}`}>{text.authorName}</p>
                      <ShieldCheck size={18} className="text-teal-500" />
                    </div>
                 </div>
              </div>
           </header>

           <article className={`relative font-serif leading-[1.9] text-xl sm:text-[22px] transition-all duration-1000 antialiased ${isFocusMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {renderedContent}
           </article>

           <div className={`h-px w-full my-32 transition-opacity duration-1000 ${isFocusMode ? 'bg-white/5 opacity-50' : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'}`} />

           <section className={`space-y-48 transition-all duration-1000 ${isFocusMode ? 'opacity-10 pointer-events-none blur-sm' : 'opacity-100'}`}>
              {!isAnnouncementAccount && (
                <SceauCertification wordCount={text.content?.length} fileName={id} userEmail={user?.email} onValidated={handleCertification} certifiedCount={text.certified || 0} authorName={text.authorName} textTitle={text.title} />
              )}
              <SmartRecommendations currentId={id} allTexts={allTexts} />
              <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => loadContent(true)} />
           </section>
        </main>

        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-slate-950 p-2.5 rounded-[2.5rem] shadow-2xl border border-white/10 ring-8 ring-slate-950/5 transition-all duration-500 ${isFocusMode ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <button onClick={handleLike} className={`p-5 rounded-full transition-all ${isLiking ? 'text-rose-500 bg-white/10' : 'text-white hover:bg-white/5'}`}>
              <Heart size={22} className={isLiking ? "fill-current" : ""} />
            </button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button onClick={handleShare} className="p-5 text-white hover:text-teal-400 rounded-full transition-all active:scale-90">
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
         

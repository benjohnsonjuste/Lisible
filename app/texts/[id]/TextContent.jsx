"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Share2, Heart, Trophy, Bookmark,
  Maximize2, Minimize2, AlertTriangle,
  Sun, Zap, Loader2, Sparkles, Megaphone, Ghost,
  ShieldCheck
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";
import SecurityLock from "@/components/SecurityLock";
import FloatingActions from "@/components/reader/FloatingActions";

const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/reader/SmartRecommendations"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });
const SocialMargins = dynamic(() => import("@/components/reader/SocialMargins"), { ssr: false });

// --- FONCTIONS BADGES ---
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

export default function TextContent({ id: propsId }) {
  const router = useRouter();
  const params = useParams();
  const id = propsId || params?.id;

  const [text, setText] = useState(null);
  const [allTexts, setAllTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [liveViews, setLiveViews] = useState(0);
  const viewLogged = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  // --- LOGIQUE CACHE & CHARGEMENT ---
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
        const sortedLibrary = (indexData.content || []).sort((a, b) => (Number(b.certified || 0) - Number(a.certified || 0)));
        setAllTexts(sortedLibrary);
      }
    } catch (e) {
      if (!localVersion) toast.error("Manuscrit inaccessible.");
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
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
    
    if (isFocusMode) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFocusMode]);

  useEffect(() => {
    if (id && text && !viewLogged.current && !isOffline) {
      const viewedKey = `v_${id}`;
      if (!localStorage.getItem(viewedKey)) {
        viewLogged.current = true;
        fetch('/api/github-db', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: "view" })
        }).then(() => {
          setLiveViews(prev => prev + 1);
          localStorage.setItem(viewedKey, "1");
        });
      }
    }
  }, [id, text, isOffline]);

  // --- ACTIONS ---
  const handleLike = async () => {
    if (localStorage.getItem(`l_${id}`)) return toast.info("Déjà aimé");
    setIsLiking(true);
    try {
      const res = await fetch('/api/github-db', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, action: "like" }) 
      });
      if (res.ok) { 
        localStorage.setItem(`l_${id}`, "1"); 
        toast.success("Aimé !");
        setText(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
      }
    } finally { setIsLiking(false); }
  };

  const handleBookmark = async () => {
    if (!user) return toast.error("Connectez-vous pour sauvegarder");
    setIsBookmarking(true);
    try {
      const res = await fetch('/api/github-db', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          action: "toggle_bookmark", 
          userEmail: user.email, 
          textId: id, 
          title: text.title, 
          authorName: text.authorName 
        }) 
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...user, bookmarks: data.bookmarks };
        setUser(updated);
        localStorage.setItem("lisible_user", JSON.stringify(updated));
        toast.success(user.bookmarks?.some(b => b.id === id) ? "Retiré de la bibliothèque" : "Ajouté à votre bibliothèque");
      }
    } finally { setIsBookmarking(false); }
  };

  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
        { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600", words: ['ombre', 'triste', 'nuit', 'mort'] },
        { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600", words: ['soleil', 'joie', 'amour', 'clair'] },
        { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600", words: ['force', 'guerre', 'feu', 'sang'] }
    ];
    return moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }))
                .reduce((p, c) => (p.score > c.score) ? p : c);
  }, [text?.content]);

  const renderedContent = useMemo(() => {
    if (!text?.content) return null;
    const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");
    const dropCapClass = `first-letter:text-8xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:leading-none first-letter:mt-2 ${isFocusMode ? 'first-letter:text-teal-400' : 'first-letter:text-teal-600'}`;

    return (
      <div className="space-y-6">
        <div className={`whitespace-pre-wrap ${dropCapClass}`}>
           {paragraphs.map((p, i) => <p key={i} className="mb-6">{p}</p>)}
        </div>
        {!isFocusMode && <InTextAd />}
      </div>
    );
  }, [text?.content, isFocusMode]);

  if (loading || !text) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(text.authorEmail);
  const isBattle = text.isConcours === true || text.genre === "Battle Poétique";
  const isBookmarked = user?.bookmarks?.some(b => b.id === id);

  return (
    <SecurityLock userEmail={user?.email}>
      <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#0a0a0a] text-slate-300' : 'bg-[#FCFBF9]'}`}>
          
          {/* Progress Bar */}
          <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-white/5">
             <div className="h-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.8)] transition-all duration-300" style={{ width: `${readingProgress}%` }} />
          </div>

          {/* Navigation */}
          <nav className={`fixed top-0 w-full z-[90] transition-all duration-500 ${isFocusMode ? 'translate-y-[-100%]' : 'translate-y-0'} ${readingProgress > 5 ? 'bg-white/95 backdrop-blur-md py-3 shadow-sm' : 'bg-transparent py-8'}`}>
            <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
              <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:text-teal-600 transition-all"><ArrowLeft size={20} /></button>
              <button onClick={() => setIsFocusMode(true)} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(29,78,216,0.4)] hover:bg-blue-800 transition-all">
                <Maximize2 size={16} /> Mode Focus
              </button>
            </div>
          </nav>

          {/* Focus Mode Close */}
          {isFocusMode && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-4">
               <button onClick={() => setIsFocusMode(false)} className="px-8 py-3 rounded-full bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-800 shadow-[0_0_30px_rgba(29,78,216,0.6)] backdrop-blur-md transition-all">
                 <Minimize2 size={14} className="inline mr-2" /> Quitter le Focus
               </button>
            </div>
          )}

          <main className={`max-w-3xl mx-auto px-6 transition-all duration-1000 ${isFocusMode ? 'pt-32 pb-64' : 'pt-40 pb-48'}`}>
             
             {/* Header Section */}
             <header className={`mb-16 space-y-8 transition-all duration-1000 ${isFocusMode ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}>
                {!isFocusMode && (isAnnouncementAccount ? <BadgeAnnonce /> : isBattle ? <BadgeConcours /> : null)}
                
                <div className="flex flex-wrap items-center gap-4">
                   <span className="px-5 py-2 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{text.category || "Inédit"}</span>
                   {mood?.score > 0 && <span className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-current/10 ${mood.color}`}>{mood.icon} {mood.label}</span>}
                </div>

                <h1 className={`font-serif font-black italic text-5xl sm:text-7xl leading-none tracking-tighter ${isFocusMode ? 'text-white' : 'text-slate-900'}`}>{text.title}</h1>

                <div className="flex items-center gap-5 pt-8 border-t border-slate-100">
                   <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-white shadow-xl overflow-hidden">
                      <img src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 flex items-center gap-2"><Sparkles size={12} /> {isAnnouncementAccount ? "Officiel" : "Auteur Certifié"}</p>
                      <p className={`text-xl font-bold italic ${isFocusMode ? 'text-white/80' : 'text-slate-900'}`}>{text.authorName} <ShieldCheck className="inline text-teal-500" size={18}/></p>
                   </div>
                </div>
             </header>

             {/* Content Area */}
             <div className="relative">
                {!isFocusMode && <SocialMargins textId={id} textTitle={text.title} />}
                <article className={`relative font-serif leading-[1.9] text-xl sm:text-[23px] transition-all duration-1000 antialiased ${isFocusMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {renderedContent}
                </article>
             </div>

             {/* Footer Sections */}
             <div className={`h-px w-full my-32 ${isFocusMode ? 'bg-white/5' : 'bg-slate-100'}`} />

             <section className={`transition-all duration-1000 ${isFocusMode ? 'opacity-5 blur-md pointer-events-none' : 'opacity-100'}`}>
                {!isAnnouncementAccount && (
                  <SceauCertification wordCount={text.content?.length} fileName={id} userEmail={user?.email} onValidated={() => loadContent(true)} certifiedCount={text.certified || 0} authorName={text.authorName} textTitle={text.title} />
                )}
                <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => loadContent(true)} />
                <SmartRecommendations currentId={id} allTexts={allTexts} />
             </section>
          </main>

          {/* Floating Actions */}
          <FloatingActions 
            isFocusMode={isFocusMode} 
            handleLike={handleLike} 
            isLiking={isLiking}
            handleBookmark={handleBookmark} 
            isBookmarking={isBookmarking} 
            isBookmarked={isBookmarked}
            handleShare={() => {}} 
            onReport={() => setIsReportOpen(true)} 
          />

          <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} />
      </div>
    </SecurityLock>
  );
}

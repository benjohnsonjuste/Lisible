"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Maximize2, Minimize2, ArrowLeft, Eye, Clock, Sun, Zap, Coffee, Ghost, Megaphone, Trophy, Sparkles } from "lucide-react";
import AdSocialBar from "@/components/AdSocialBar";
import FloatingActions from "@/components/reader/FloatingActions";
import SecurityLock from "@/components/SecurityLock";
import ReportModal from "@/components/ReportModal";
import SceauCertification from "@/components/reader/SceauCertification";
import CommentSection from "@/components/reader/CommentSection";
import SocialMargins from "@/components/reader/SocialMargins";
import { InTextAd } from "@/components/InTextAd";

// --- COMPOSANTS DE BADGES (Ancienne méthode) ---
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

const TextContent = ({ id }) => {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // --- CONFIGURATION DU MOOD (Ancienne méthode) ---
  const moodConfig = useMemo(() => ({
    melancholic: { bg: "bg-[#0a0c1a]", accent: "text-indigo-400", ui: "bg-indigo-50 text-indigo-600", icon: <Ghost size={12}/>, label: "Mélancolique" },
    luminous: { bg: "bg-[#fffdf5]", accent: "text-amber-600", ui: "bg-amber-50 text-amber-600", icon: <Sun size={12}/>, label: "Lumineux" },
    epic: { bg: "bg-[#1a0505]", accent: "text-rose-500", ui: "bg-rose-50 text-rose-600", icon: <Zap size={12}/>, label: "Épique" },
    soothing: { bg: "bg-[#f4f9f4]", accent: "text-emerald-600", ui: "bg-emerald-50 text-emerald-600", icon: <Coffee size={12}/>, label: "Apaisant" },
    default: { bg: "bg-white", accent: "text-teal-600", ui: "bg-slate-100 text-slate-600", icon: null, label: "Classique" }
  }), []);

  const mood = useMemo(() => {
    if (!data?.content) return moodConfig.default;
    const content = data.content.toLowerCase();
    const sets = [
      { key: 'melancholic', words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'pleure', 'vide'] },
      { key: 'luminous', words: ['soleil', 'joie', 'amour', 'clair', 'vie', 'rire', 'espoir'] },
      { key: 'epic', words: ['force', 'guerre', 'feu', 'épée', 'sang', 'combat', 'fureur'] },
      { key: 'soothing', words: ['calme', 'paix', 'vent', 'doux', 'plage', 'repos', 'harmonie'] }
    ];
    const scores = sets.map(s => ({ key: s.key, score: s.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    const topMood = scores.reduce((p, c) => (p.score > c.score) ? p : c);
    return topMood.score > 0 ? moodConfig[topMood.key] : moodConfig.default;
  }, [data?.content, moodConfig]);

  const loadContent = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`https://lisible.biz/api/github-db?type=text&id=${id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.content);
      }
    } catch (error) { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    loadContent();
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadContent]);

  // --- RENDU DU TEXTE AVEC PUBLICITÉ (Ancienne méthode) ---
  const renderedContent = useMemo(() => {
    if (!data?.content) return null;
    const paragraphs = data.content.split('\n').filter(p => p.trim() !== "");
    
    return (
      <div className="space-y-8">
        <div className="whitespace-pre-wrap">
          {paragraphs.slice(0, 3).map((p, i) => <p key={i} className="mb-6">{p}</p>)}
        </div>
        {paragraphs.length > 3 && (
          <>
            <div className="my-16"><InTextAd /></div>
            <div className="whitespace-pre-wrap">
              {paragraphs.slice(3).map((p, i) => <p key={i + 3} className="mb-6">{p}</p>)}
            </div>
          </>
        )}
      </div>
    );
  }, [data?.content]);

  if (loading) return <div className="flex justify-center p-10 font-serif">Chargement...</div>;
  if (!data) return null;

  const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(data.authorEmail);
  const isBattle = data.isConcours === true || data.genre === "Battle Poétique" || data.category === "Duel Des Nouvelles" || data.category === "Battle Poétique International";

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-slate-900' : mood.bg}`}>
      
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/10">
        <div className={`h-full transition-all duration-300 ${mood.accent.replace('text', 'bg')}`} style={{ width: `${readingProgress}%` }} />
      </div>

      <SocialMargins />
      {!isFocusMode && <AdSocialBar />}

      <nav className={`fixed top-0 w-full z-[90] transition-all p-6 flex justify-between ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
        <button onClick={() => router.back()} className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100"><ArrowLeft size={20}/></button>
        <button onClick={() => setIsFocusMode(true)} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-teal-600 transition-all"><Maximize2 size={20}/></button>
      </nav>

      {isFocusMode && (
        <button onClick={() => setIsFocusMode(false)} className="fixed top-8 right-8 z-[110] p-4 rounded-full bg-white/10 text-white/50 hover:text-white backdrop-blur-md">
          <Minimize2 size={24} />
        </button>
      )}

      <main className="max-w-3xl mx-auto px-6 pt-40 pb-48">
        {!isFocusMode && (isAnnouncementAccount ? <BadgeAnnonce /> : isBattle ? <BadgeConcours /> : null)}

        <header className={`mb-20 space-y-8 transition-all ${isFocusMode ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-5 py-2 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
              {data.category || data.genre || "Inédit"}
            </span>
            {mood.icon && (
              <span className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-current/10 ${mood.ui}`}>
                {mood.icon} {mood.label}
              </span>
            )}
            <div className="ml-auto flex items-center gap-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Eye size={16}/> {data.views || 0}</span>
              <span className="flex items-center gap-2"><Clock size={16}/> {Math.ceil((data.content?.length || 0) / 1000)} min</span>
            </div>
          </div>

          <h1 className={`text-5xl sm:text-7xl font-serif font-black italic leading-tight ${isFocusMode || mood.bg.includes('0a') ? 'text-white' : 'text-slate-900'}`}>{data.title}</h1>
          
          <div className="flex items-center gap-5 pt-8 border-t border-slate-100/20">
            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border-4 border-white shadow-2xl overflow-hidden">
              <img src={data.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${data.authorEmail}`} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="text-left">
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2 ${mood.accent}`}>
                <Sparkles size={12} /> {isAnnouncementAccount ? "Officiel" : "Certifié"}
              </p>
              <p className={`text-xl font-bold italic ${isFocusMode || mood.bg.includes('0a') ? 'text-white/80' : 'text-slate-800'}`}>{data.authorName}</p>
            </div>
          </div>
        </header>

        <SecurityLock>
          <article className={`font-serif leading-[1.9] text-xl sm:text-[22px] transition-all ${isFocusMode || mood.bg.includes('0a') ? 'text-slate-300' : 'text-slate-800'}`}>
            {renderedContent}
          </article>
        </SecurityLock>

        <section className={`mt-32 space-y-48 transition-all ${isFocusMode ? 'opacity-5 blur-xl' : 'opacity-100'}`}>
          {/* Sceau déplacé à la fin comme demandé */}
          {!isAnnouncementAccount && (
            <SceauCertification 
              wordCount={data.content?.length} 
              fileName={id} 
              userEmail={user?.email} 
              onValidated={() => loadContent()} 
              certifiedCount={data.certified || 0} 
              authorName={data.authorName} 
              textTitle={data.title} 
            />
          )}
          <CommentSection textId={id} comments={data.comments || []} user={user} onCommented={() => loadContent()} />
        </section>
      </main>

      <FloatingActions 
        isFocusMode={isFocusMode}
        onReport={() => setReportModalOpen(true)} 
        title={data.title}
      />

      <ReportModal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} textId={id} textTitle={data.title} />
    </div>
  );
};

export default TextContent;

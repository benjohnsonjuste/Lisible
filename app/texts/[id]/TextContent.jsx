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

// --- COMPOSANTS DE BADGES ---
function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-2xl shadow-xl mb-8">
      <Trophy size={14} className="animate-bounce" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Duel de Plume</span>
    </div>
  );
}

function BadgeAnnonce() {
  return (
    <div className="inline-flex items-center gap-2 bg-indigo-700 text-white px-5 py-2.5 rounded-2xl shadow-xl mb-8">
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
  const [authorProfile, setAuthorProfile] = useState(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // --- CONFIGURATION DU MOOD (Couleurs optimisées pour la lecture) ---
  const moodConfig = useMemo(() => ({
    melancholic: { bg: "bg-[#0F111A]", text: "text-slate-300", title: "text-white", accent: "text-indigo-400", ui: "bg-indigo-900/30 text-indigo-300", icon: <Ghost size={12}/>, label: "Mélancolique" },
    luminous: { bg: "bg-[#FCF9F0]", text: "text-[#2C2C2C]", title: "text-slate-900", accent: "text-amber-700", ui: "bg-amber-100 text-amber-800", icon: <Sun size={12}/>, label: "Lumineux" },
    epic: { bg: "bg-[#1C0A0A]", text: "text-rose-100/80", title: "text-rose-50", accent: "text-rose-500", ui: "bg-rose-900/40 text-rose-300", icon: <Zap size={12}/>, label: "Épique" },
    soothing: { bg: "bg-[#F4F9F4]", text: "text-slate-800", title: "text-emerald-950", accent: "text-emerald-700", ui: "bg-emerald-100 text-emerald-800", icon: <Coffee size={12}/>, label: "Apaisant" },
    default: { bg: "bg-white", text: "text-slate-800", title: "text-slate-900", accent: "text-teal-600", ui: "bg-slate-100 text-slate-600", icon: null, label: "Classique" }
  }), []);

  const mood = useMemo(() => {
    if (!data?.content) return moodConfig.default;
    const content = data.content.toLowerCase();
    const sets = [
      { key: 'melancholic', words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'pleure', 'vide', 'silence'] },
      { key: 'luminous', words: ['soleil', 'joie', 'amour', 'clair', 'vie', 'rire', 'espoir', 'lumière'] },
      { key: 'epic', words: ['force', 'guerre', 'feu', 'épée', 'sang', 'combat', 'fureur', 'destin'] },
      { key: 'soothing', words: ['calme', 'paix', 'vent', 'doux', 'plage', 'repos', 'harmonie', 'nature'] }
    ];
    const scores = sets.map(s => ({ key: s.key, score: s.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    const topMood = scores.reduce((p, c) => (p.score > c.score) ? p : c);
    return topMood.score > 1 ? moodConfig[topMood.key] : moodConfig.default;
  }, [data?.content, moodConfig]);

  const loadContent = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`https://lisible.biz/api/github-db?type=text&id=${id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.content);

        const usersRes = await fetch(`/api/realtime-data?folder=users`);
        const usersJson = await usersRes.json();
        const allUsers = Array.isArray(usersJson.content) ? usersJson.content : [];
        const author = allUsers.find(u => (u.email || "").toLowerCase().trim() === (result.content.authorEmail || "").toLowerCase().trim());
        if (author) setAuthorProfile(author.profilePic || author.image || null);
      }
    } catch (error) { 
      toast.error("Erreur de chargement"); 
    } finally { 
      setLoading(false); 
    }
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

  // --- LOGIQUE LIKE CORRIGÉE ---
  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer ce texte");
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "like", 
          textId: id, 
          userEmail: user.email 
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        toast.success("Coup de cœur enregistré !");
        // Mise à jour optimiste de l'UI
        setData(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      } else {
        toast.error(result.error || "Action impossible");
      }
    } catch (err) {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: data.title,
        text: `Découvrez "${data.title}" sur Lisible.`,
        url: window.location.href,
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  const renderedContent = useMemo(() => {
    if (!data?.content) return null;
    const paragraphs = data.content.split('\n').filter(p => p.trim() !== "");
    return (
      <div className="space-y-8">
        <div className="whitespace-pre-wrap">
          {paragraphs.slice(0, 3).map((p, i) => <p key={i} className="mb-6 leading-relaxed">{p}</p>)}
        </div>
        {paragraphs.length > 3 && (
          <>
            <div className="my-16 py-8 border-y border-slate-200/10">
              <AdSocialBar />
            </div>
            <div className="whitespace-pre-wrap">
              {paragraphs.slice(3).map((p, i) => <p key={i + 3} className="mb-6 leading-relaxed">{p}</p>)}
            </div>
          </>
        )}
      </div>
    );
  }, [data?.content]);

  if (loading) return <div className="flex justify-center items-center min-h-screen font-serif animate-pulse">Immersion en cours...</div>;
  if (!data) return null;

  const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(data.authorEmail);
  const isBattle = data.isConcours === true || ["Battle Poétique", "Duel Des Nouvelles", "Battle Poétique International"].includes(data.genre || data.category);

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#050505]' : mood.bg}`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-black/10">
        <div className={`h-full transition-all duration-300 ${mood.accent.replace('text', 'bg')}`} style={{ width: `${readingProgress}%` }} />
      </div>

      <SocialMargins />
      
      <nav className={`fixed top-0 w-full z-[90] transition-all p-6 flex justify-between items-center ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
        <button onClick={() => router.back()} className="p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-slate-200 text-slate-800 hover:scale-105 transition-transform"><ArrowLeft size={20}/></button>
        <button onClick={() => setIsFocusMode(true)} className="p-3 bg-slate-900 text-white rounded-xl shadow-xl hover:bg-teal-700 transition-all flex items-center gap-2 text-sm font-bold">
          <Maximize2 size={18}/> Focus
        </button>
      </nav>

      {isFocusMode && (
        <button onClick={() => setIsFocusMode(false)} className="fixed top-8 right-8 z-[110] p-4 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10">
          <Minimize2 size={24} />
        </button>
      )}

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-48">
        {!isFocusMode && (isAnnouncementAccount ? <BadgeAnnonce /> : isBattle ? <BadgeConcours /> : null)}

        <header className={`mb-20 space-y-8 transition-all duration-700 ${isFocusMode ? 'opacity-20 blur-md scale-95' : 'opacity-100'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">
              {data.category || data.genre || "Inédit"}
            </span>
            {mood.icon && (
              <span className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm ${mood.ui}`}>
                {mood.icon} {mood.label}
              </span>
            )}
            <div className="ml-auto flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md"><Eye size={14}/> {data.views || 0}</span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md"><Clock size={14}/> {Math.ceil((data.content?.length || 0) / 1000)} min</span>
            </div>
          </div>

          <h1 className={`text-5xl sm:text-7xl font-serif font-black italic leading-[1.1] tracking-tight ${mood.title}`}>{data.title}</h1>
          
          <div className="flex items-center gap-5 pt-8 border-t border-slate-200/50">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-white shadow-xl overflow-hidden shrink-0">
              <img 
                src={authorProfile || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${data.authorEmail}`} 
                className="w-full h-full object-cover" 
                alt={data.authorName} 
              />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 ${mood.accent}`}>
                <Sparkles size={12} /> {isAnnouncementAccount ? "Officiel" : "Plume Certifiée"}
              </p>
              <p className={`text-xl font-bold italic ${mood.title}`}>{data.authorName}</p>
            </div>
          </div>
        </header>

        <SecurityLock>
          <article className={`font-serif leading-[2] text-xl sm:text-[23px] transition-colors duration-500 ${isFocusMode ? 'text-slate-200' : mood.text}`}>
            {renderedContent}
          </article>
        </SecurityLock>

        <section className={`mt-32 space-y-32 transition-all ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
        handleLike={handleLike}
        handleShare={handleShare}
        isLiking={isLiking}
        title={data.title}
        likeCount={data.likes || 0}
      />

      <ReportModal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} textId={id} textTitle={data.title} />
    </div>
  );
};

export default TextContent;

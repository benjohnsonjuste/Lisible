"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Maximize2, Minimize2, ArrowLeft } from "lucide-react";
import AdSocialBar from "@/components/AdSocialBar";
import FloatingActions from "@/components/reader/FloatingActions";
import SecurityLock from "@/components/SecurityLock";
import ReportModal from "@/components/ReportModal";
import SceauCertification from "@/components/reader/SceauCertification";
import CommentSection from "@/components/reader/CommentSection";
import SocialMargins from "@/components/reader/SocialMargins";

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

  // --- LOGIQUE DE CHARGEMENT ---
  const loadContent = useCallback(async () => {
    if (!id) return;
    try {
      const baseUrl = "https://lisible.biz";
      const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.content);
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
        setData(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
      }
    } finally { setIsLiking(false); }
  };

  const handleBookmark = async () => {
    if (!user) return toast.error("Connectez-vous");
    setIsBookmarking(true);
    try {
      const res = await fetch('/api/github-db', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          action: "toggle_bookmark", 
          userEmail: user.email, 
          textId: id, 
          title: data.title, 
          authorName: data.authorName 
        }) 
      });
      const result = await res.json();
      if (result.success) {
        const updated = { ...user, bookmarks: result.bookmarks };
        setUser(updated);
        localStorage.setItem("lisible_user", JSON.stringify(updated));
        toast.success("Bibliothèque mise à jour");
      }
    } finally { setIsBookmarking(false); }
  };

  const handleShare = async () => {
    const shareData = {
      title: data.title,
      text: `Découvrez "${data.title}" sur Lisible`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié !");
      }
    } catch (err) { console.error(err); }
  };

  const isBookmarked = user?.bookmarks?.some(b => b.id === id);

  if (loading) return <div className="flex justify-center p-10 font-serif">Chargement...</div>;
  if (!data) return <div className="flex justify-center p-10">Texte introuvable.</div>;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#121212]' : 'bg-white'}`}>
      
      {/* Barre de progression */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/30">
        <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${readingProgress}%` }} />
      </div>

      <SocialMargins />
      {!isFocusMode && <AdSocialBar />}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[90] transition-all p-6 flex justify-between ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-900"><ArrowLeft size={20}/></button>
        <button onClick={() => setIsFocusMode(true)} className="p-4 bg-blue-700 text-white rounded-2xl shadow-[0_0_20px_rgba(29,78,216,0.5)] hover:bg-blue-800 transition-all active:scale-95"><Maximize2 size={20}/></button>
      </nav>

      {isFocusMode && (
        <button onClick={() => setIsFocusMode(false)} className="fixed top-8 right-8 z-[110] p-4 rounded-full bg-blue-700 text-white shadow-[0_0_30px_rgba(29,78,216,0.6)] hover:bg-blue-800 transition-all scale-110 active:scale-95">
          <Minimize2 size={24} />
        </button>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 pt-40">
        <header className={`mb-8 text-center transition-all ${isFocusMode ? 'opacity-40' : ''}`}>
          <h1 className={`text-4xl font-serif font-bold mb-4 ${isFocusMode ? 'text-white' : 'text-slate-900'}`}>{data.title}</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <span className={isFocusMode ? 'text-white/60' : ''}>Par {data.authorName}</span>
            <SceauCertification 
              wordCount={data.content?.length} 
              fileName={id} 
              userEmail={user?.email} 
              onValidated={() => loadContent()} 
              certifiedCount={data.certified} 
            />
          </div>
        </header>

        <SecurityLock>
          <article className={`font-serif leading-[1.9] text-xl sm:text-2xl transition-all ${isFocusMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <div className="whitespace-pre-wrap">
              {data.content}
            </div>
          </article>
        </SecurityLock>

        <footer className={`mt-12 border-t pt-8 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
          <CommentSection 
            textId={id} 
            comments={data.comments || []} 
            user={user} 
            onCommented={() => loadContent()} 
          />
        </footer>
      </main>

      <FloatingActions 
        isFocusMode={isFocusMode}
        handleLike={handleLike}
        isLiking={isLiking}
        handleBookmark={handleBookmark}
        isBookmarking={isBookmarking}
        isBookmarked={isBookmarked}
        handleShare={handleShare}
        onReport={() => setReportModalOpen(true)} 
        title={data.title}
      />

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        textId={id}
        textTitle={data.title}
      />
    </div>
  );
};

export default TextContent;

"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Eye, Clock, Maximize2, Minimize2, 
  Loader2, Sparkles, ShieldCheck, Lock, Zap, Gem, Crown
} from "lucide-react";

// Imports des utilitaires et composants extraits
import { getMood } from "@/utils/reader-utils";
import FloatingActions from "@/components/reader/FloatingActions";
import SecurityLock from "@/components/SecurityLock"; 
import AdSocialBar from "@/components/AdSocialBar";

const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });

export default function TextContent() {
  const router = useRouter();
  const { id } = useParams();

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const loadContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/github-db?type=text&id=${id}`);
      const data = await res.json();
      if (data?.content) {
        setText(data.content);
      }
    } catch (e) { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { 
    loadContent(); 
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
  }, [loadContent]);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleUnlock = async () => {
    if (!user) return toast.error("Connectez-vous pour débloquer ce texte");
    if (user.li < text.price) return toast.error("Solde Li insuffisant");

    setIsUnlocking(true);
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "unlock_content",
          userEmail: user.email,
          textId: id
        })
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, li: data.li, unlocked_texts: [...(user.unlocked_texts || []), id] };
        setUser(updatedUser);
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        toast.success("Œuvre débloquée ! Bonne lecture.");
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast.error(e.message || "Erreur lors du déblocage");
    } finally {
      setIsUnlocking(false);
    }
  };

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
        setText(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      }
    } catch (e) {
      toast.error("Échec de l'interaction");
    } finally { setIsLiking(false); }
  };

  const handleShare = async () => {
    const shareData = {
      title: text.title,
      text: `Je vous invite à lire "${text.title}" de ${text.authorName} sur Lisible. ✨`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié !");
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error("Erreur de partage");
    }
  };

  const isAuthor = user?.email === text?.authorEmail;
  const isUnlocked = user?.unlocked_texts?.includes(id);
  const isPremium = text?.isPremium && text?.price > 0;
  const canReadFull = !isPremium || isUnlocked || isAuthor;

  const mood = useMemo(() => getMood(text?.content), [text?.content]);

  if (loading) return <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center"><Loader2 className="animate-spin text-blue-700" size={40} /></div>;
  if (!text) return null;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#121212]' : 'bg-[#FCFBF9]'}`}>
      
      <AdSocialBar />

      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/30">
        <div className="h-full bg-blue-700 transition-all duration-300" style={{ width: `${readingProgress}%` }} />
      </div>

      <nav className={`fixed top-0 w-full z-[90] transition-all p-6 flex justify-between ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-900"><ArrowLeft size={20}/></button>
        <button onClick={() => setIsFocusMode(true)} className="p-4 bg-blue-700 text-white rounded-2xl shadow-[0_0_20px_rgba(29,78,216,0.5)] hover:bg-blue-800 transition-all active:scale-95"><Maximize2 size={20}/></button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-40 pb-48">
        <header className="mb-20 space-y-8">
          <div className="flex gap-4 items-center">
            <span className="px-5 py-2 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
              {text.category} • Duel Des Nouvelles
            </span>
          </div>
        </header>

        <SecurityLock userEmail={user?.email}>
          <article className="font-serif leading-[1.9] text-xl sm:text-2xl">
            <div className="whitespace-pre-wrap">
              {text.content}
            </div>
          </article>
        </SecurityLock>

        {canReadFull && (
          <section className="mt-32 space-y-48">
            <SceauCertification wordCount={text.content?.length} fileName={id} userEmail={user?.email} onValidated={() => loadContent()} certifiedCount={text.certified} />
            <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => loadContent()} />
          </section>
        )}
      </main>

      <FloatingActions 
        isFocusMode={isFocusMode} 
        handleLike={handleLike} 
        isLiking={isLiking}
        handleShare={handleShare} 
        onReport={() => setIsReportOpen(true)} 
      />

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} />
    </div>
  );
}
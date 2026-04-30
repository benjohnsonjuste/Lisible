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
import { InTextAd } from "@/components/InTextAd";
import { AdSocialBar } from "@/components/AdSocialBar";
import FloatingActions from "@/components/reader/FloatingActions";
import SecurityLock from "@/components/SecurityLock"; 

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

  // --- LOGIQUE DE CHARGEMENT ---
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

  // --- ACTIONS ---
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

  // --- ÉTATS DE LECTURE ---
  const isAuthor = user?.email === text?.authorEmail;
  const isUnlocked = user?.unlocked_texts?.includes(id);
  const isPremium = text?.isPremium && text?.price > 0;
  const canReadFull = !isPremium || isUnlocked || isAuthor;

  const mood = useMemo(() => getMood(text?.content), [text?.content]);

  if (loading) return <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center"><Loader2 className="animate-spin text-blue-700" size={40} /></div>;
  if (!text) return null;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#121212]' : 'bg-[#FCFBF9]'}`}>
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/30">
        <div className="h-full bg-blue-700 transition-all duration-300" style={{ width: `${readingProgress}%` }} />
      </div>

      <nav className={`fixed top-0 w-full z-[90] transition-all p-6 flex justify-between ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-900"><ArrowLeft size={20}/></button>
        <button onClick={() => setIsFocusMode(true)} className="p-4 bg-blue-700 text-white rounded-2xl shadow-[0_0_20px_rgba(29,78,216,0.5)] hover:bg-blue-800 transition-all active:scale-95"><Maximize2 size={20}/></button>
      </nav>

      {isFocusMode && (
        <button onClick={() => setIsFocusMode(false)} className="fixed top-8 right-8 z-[110] p-4 rounded-full bg-blue-700 text-white shadow-[0_0_30px_rgba(29,78,216,0.6)] hover:bg-blue-800 transition-all scale-110 active:scale-95">
          <Minimize2 size={24} />
        </button>
      )}

      <main className="max-w-3xl mx-auto px-6 pt-40 pb-48">
        <header className={`mb-20 space-y-8 transition-all ${isFocusMode ? 'opacity-40' : ''}`}>
          <div className="flex gap-4 items-center">
            <span className="px-5 py-2 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{text.category}</span>
            {isPremium && (
              <span className="px-5 py-2 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <Lock size={10}/> Premium {text.price} Li
              </span>
            )}
            {/* TAGS DE CONCOURS */}
            {(text.category === "Duel Des Nouvelles" || text.isConcours === "Duel Des Nouvelles") && (
              <span className="px-5 py-2 bg-amber-500 text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                🏆 Duel Des Nouvelles
              </span>
            )}
            {(text.category === "Battle Poétique" || text.isConcours === "Battle Poétique") && (
              <span className="px-5 py-2 bg-blue-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                ✍️ Battle Poétique
              </span>
            )}
            {mood?.score > 0 && <span className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase border border-current/10 ${mood.color}`}>{mood.icon} {mood.label}</span>}
          </div>
          <h1 className={`font-serif font-black italic text-5xl sm:text-7xl leading-tight ${isFocusMode ? 'text-white/80' : 'text-slate-900'}`}>{text.title}</h1>
          <div className="flex items-center gap-5 pt-8 border-t border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 overflow-hidden border-4 border-white shadow-xl">
              <img src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} className="w-full h-full object-cover" alt="Author" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12}/> Auteur Certifié</p>
              <p className={`text-xl font-bold italic ${isFocusMode ? 'text-white/60' : 'text-slate-900'}`}>{text.authorName} <ShieldCheck className="inline text-blue-600" size={18}/></p>
            </div>
          </div>
        </header>

        <SecurityLock userEmail={user?.email}>
          <article className={`font-serif leading-[1.9] text-xl sm:text-2xl transition-all ${isFocusMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {canReadFull ? (
              <div className="whitespace-pre-wrap">
                {text.content?.split('\n').slice(0, 3).join('\n')}
                
                {!isFocusMode && (
                  <div className="my-12 w-full flex items-center justify-center">
                    <InTextAd />
                  </div>
                )}

                {text.content?.split('\n').slice(3).join('\n')}
              </div>
            ) : (
              <div className="relative">
                <div className="whitespace-pre-wrap opacity-30 select-none pointer-events-none blur-sm">
                  {text.content?.substring(0, 400)}...
                  <div className="h-64" />
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-t from-[#FCFBF9] via-[#FCFBF9]/90 to-transparent">
                  <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm">
                    <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                      {text.price <= 25 ? <Zap size={30} /> : text.price <= 50 ? <Gem size={30} /> : <Crown size={30} />}
                    </div>
                    <h3 className="text-xl font-black italic text-slate-900 mb-2 tracking-tighter uppercase">Contenu Privilégié</h3>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed mb-8">
                      Cette œuvre est réservée aux mécènes. Soutenez l'auteur pour accéder à l'intégralité du manuscrit.
                    </p>
                    <button 
                      onClick={handleUnlock}
                      disabled={isUnlocking}
                      className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-3"
                    >
                      {isUnlocking ? <Loader2 className="animate-spin" size={16}/> : <>DÉBLOQUER • {text.price} LI</>}
                    </button>
                    {user && user.li < text.price && (
                      <p className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-widest">
                        Il vous manque {text.price - user.li} Li
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>
        </SecurityLock>

        {canReadFull && (
          <section className={`mt-32 space-y-48 ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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

      <AdSocialBar />

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} />
    </div>
  );
}

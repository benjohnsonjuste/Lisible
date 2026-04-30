"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Head from "next/head";
import {
  ArrowLeft, Eye, Clock, Maximize2, Minimize2, 
  Loader2, Sparkles, ShieldCheck
} from "lucide-react";

// Imports des utilitaires et composants extraits
import { getMood } from "@/utils/reader-utils";
import AdSocialBar from "@/components/AdSocialBar";
import FloatingActions from "@/components/reader/FloatingActions";

const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/reader/SmartRecommendations"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });

export default function TextContent({ id: propsId }) {
  const router = useRouter();
  const params = useParams();
  
  // Utilisation de l'ID passé par le serveur ou récupéré via l'URL
  const id = propsId || params?.id;

  const [text, setText] = useState(null);
  const [allTexts, setAllTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [liveViews, setLiveViews] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const viewLogged = useRef(false);

  // --- LOGIQUE DE CHARGEMENT ---
  const loadContent = useCallback(async (force = false) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/github-db?type=text&id=${id}`);
      const data = await res.json();
      if (data?.content) {
        setText(data.content);
        setLiveViews(data.content.views || 0);
      }
      const libRes = await fetch(`/api/github-db?type=library`);
      if (libRes.ok) {
        const libData = await libRes.json();
        setAllTexts(libData.content || []);
      }
    } catch (e) { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadContent(); }, [loadContent]);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- ACTIONS ---
  const handleLike = async () => {
    if (localStorage.getItem(`l_${id}`)) return toast.info("Déjà aimé");
    setIsLiking(true);
    try {
      const res = await fetch('/api/github-db', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: "like" }) });
      if (res.ok) { 
        localStorage.setItem(`l_${id}`, "1"); 
        toast.success("Aimé !");
        setText(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
      }
    } finally { setIsLiking(false); }
  };

  const handleBookmark = async () => {
    if (!user) return toast.error("Connectez-vous");
    setIsBookmarking(true);
    try {
      const res = await fetch('/api/github-db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: "toggle_bookmark", userEmail: user.email, textId: id, title: text.title, authorName: text.authorName }) });
      const data = await res.json();
      if (data.success) {
        const updated = { ...user, bookmarks: data.bookmarks };
        setUser(updated);
        localStorage.setItem("lisible_user", JSON.stringify(updated));
        toast.success("Bibliothèque mise à jour");
      }
    } finally { setIsBookmarking(false); }
  };

  // --- RENDU DU CONTENU ---
  const mood = useMemo(() => getMood(text?.content), [text?.content]);
  const isBookmarked = user?.bookmarks?.some(b => b.id === id);

  if (loading) return <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
  if (!text) return null;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#121212]' : 'bg-[#FCFBF9]'}`}>
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100/30">
        <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${readingProgress}%` }} />
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
            {mood?.score > 0 && <span className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase border border-current/10 ${mood.color}`}>{mood.icon} {mood.label}</span>}
          </div>
          <h1 className={`font-serif font-black italic text-5xl sm:text-7xl leading-tight ${isFocusMode ? 'text-white/80' : 'text-slate-900'}`}>{text.title}</h1>
          <div className="flex items-center gap-5 pt-8 border-t border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 overflow-hidden border-4 border-white shadow-xl">
              <img src={text.authorPic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} className="w-full h-full object-cover" alt="Author" />
            </div>
            <div>
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12}/> Auteur Certifié</p>
              <p className={`text-xl font-bold italic ${isFocusMode ? 'text-white/60' : 'text-slate-900'}`}>{text.authorName} <ShieldCheck className="inline text-teal-500" size={18}/></p>
            </div>
          </div>
        </header>

        <article className={`font-serif leading-[1.9] text-xl sm:text-2xl transition-all ${isFocusMode ? 'text-slate-200' : 'text-slate-800'}`}>
          <div className="whitespace-pre-wrap">
            {text.content?.split('\n').slice(0, 3).join('\n')}
          </div>
          
          {!isFocusMode && (
            <div className="my-12 py-4 border-y border-slate-100/50">
              <AdSocialBar />
            </div>
          )}

          <div className="whitespace-pre-wrap">
            {text.content?.split('\n').slice(3).join('\n')}
          </div>
        </article>

        <section className={`mt-32 space-y-48 ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <SceauCertification wordCount={text.content?.length} fileName={id} userEmail={user?.email} onValidated={() => loadContent(true)} certifiedCount={text.certified} />
          <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => loadContent(true)} />
        </section>
      </main>

      <FloatingActions 
        isFocusMode={isFocusMode} handleLike={handleLike} isLiking={isLiking}
        handleBookmark={handleBookmark} isBookmarking={isBookmarking} isBookmarked={isBookmarked}
        handleShare={() => {}} onReport={() => setIsReportOpen(true)} 
      />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} />
    </div>
  );
}

"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation"; // Changé pour navigation
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Share2, Eye, Heart, Trophy, 
  Maximize2, Minimize2, Clock, AlertTriangle,
  Ghost, Sun, Zap, Coffee, Loader2
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";

// IMPORTS DYNAMIQUES
const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/reader/SmartRecommendations"), { ssr: false });
const SceauCertification = dynamic(() => import("@/components/reader/SceauCertification"), { ssr: false });
const CommentSection = dynamic(() => import("@/components/reader/CommentSection"), { ssr: false });

function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-6 animate-in zoom-in">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">Candidat Officiel</span>
    </div>
  );
}

export default function TextPageClient({ initialText, id, allTexts }) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); 
  const [liveViews, setLiveViews] = useState(0); 
  const [liveLikes, setLiveLikes] = useState(0);
  const viewLogged = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

  // Analyse du Mood
  const mood = useMemo(() => {
    if (!text?.content) return null;
    const content = text.content.toLowerCase();
    const moods = [
      { label: "Mélancolique", icon: <Ghost size={12}/>, color: "bg-indigo-50 text-indigo-600 border-indigo-100", words: ['ombre', 'triste', 'nuit', 'mort', 'pleur', 'seul', 'souvenir', 'froid', 'gris', 'passé', 'perdu'] },
      { label: "Lumineux", icon: <Sun size={12}/>, color: "bg-amber-50 text-amber-600 border-amber-100", words: ['soleil', 'joie', 'amour', 'brille', 'rire', 'clair', 'ciel', 'espoir', 'doux', 'vie', 'éclat'] },
      { label: "Épique", icon: <Zap size={12}/>, color: "bg-rose-50 text-rose-600 border-rose-100", words: ['sang', 'fer', 'guerre', 'force', 'feu', 'orage', 'puissant', 'lutte', 'cri', 'destin', 'gloire'] },
      { label: "Apaisant", icon: <Coffee size={12}/>, color: "bg-emerald-50 text-emerald-600 border-emerald-100", words: ['silence', 'calme', 'vent', 'paix', 'vert', 'eau', 'songe', 'lent', 'forêt', 'rêve', 'plume'] }
    ];
    const scores = moods.map(m => ({ ...m, score: m.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));
    const winner = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    return winner.score > 0 ? winner : null;
  }, [text?.content]);

  // Sync Data
  const fetchData = useCallback(async (tid) => {
    if (!tid) return;
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${tid}.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        setText(content);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
    
    const viewKey = `view_${id}`;
    if (!localStorage.getItem(viewKey) && !viewLogged.current) {
      viewLogged.current = true;
      fetch('/api/track-view', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ textId: id }) 
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(viewKey, "true");
          setLiveViews(data.views);
          setLiveLikes(data.likes || initialText.totalLikes || 0);
        }
      });
    }
  }, [id, initialText.totalLikes]);

  const readingTime = useMemo(() => Math.max(1, Math.ceil((text?.content?.split(/\s+/).length || 0) / 200)), [text?.content]);

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());

  return (
    <div className={`min-h-screen selection:bg-teal-100 font-sans transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED] dark:bg-slate-950' : 'bg-[#FCFBF9] dark:bg-slate-950'}`}>
      
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-teal-600 transition-all duration-200" style={{ width: `${readingProgress}%` }} />

      <button onClick={() => setIsFocusMode(!isFocusMode)} className="fixed bottom-8 right-8 z-[90] p-4 bg-slate-900 text-white rounded-full shadow-2xl transition-transform active:scale-90">
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="max-w-2xl mx-auto px-6 py-8 sm:py-20">
        <header className={`flex justify-between items-center mb-16 transition-all duration-700 ${isFocusMode ? 'opacity-0 -translate-y-10' : ''}`}>
          <button onClick={() => router.back()} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex gap-2">
            {!isStaffText && (
              <>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border text-[10px] font-black"><Eye size={14} /> {liveViews || text.views || 0}</div>
                <button 
                  onClick={async () => {
                    const lKey = `like_${id}`; 
                    if (localStorage.getItem(lKey) || isLiking) return;
                    setIsLiking(true);
                    const res = await fetch('/api/texts', { 
                      method: 'PATCH', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify({ id, action: "like" }) 
                    });
                    if (res.ok) { 
                      const d = await res.json(); 
                      setLiveLikes(d.count); 
                      localStorage.setItem(lKey, "true"); 
                      toast.success("Coup de cœur ajouté !"); 
                    }
                    setIsLiking(false);
                  }} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-[10px] font-black hover:border-rose-500 transition-colors"
                >
                  <Heart size={14} className={isLiking ? "animate-ping" : ""} /> {liveLikes || text.totalLikes || 0}
                </button>
              </>
            )}
            <button onClick={() => {navigator.clipboard.writeText(window.location.href); toast.success("Lien copié dans le presse-papier");}} className="p-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl shadow-xl hover:scale-105 transition-transform"><Share2 size={20} /></button>
          </div>
        </header>

        <article className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-10 flex flex-wrap items-center gap-4">
            {text.isConcours && <BadgeConcours />}
            <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-lg border border-teal-100"><Clock size={12} /> {readingTime} MIN DE LECTURE</div>
            {mood && <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border ${mood.color}`}>{mood.icon} {mood.label}</div>}
          </div>

          <h1 className={`font-serif font-black italic transition-all duration-1000 ${isFocusMode ? 'text-6xl sm:text-8xl mb-20' : 'text-5xl sm:text-7xl mb-10 text-slate-900 dark:text-white'}`}>{text.title}</h1>

          <div className={`flex items-center gap-4 mb-16 transition-all duration-700 ${isFocusMode ? 'opacity-0' : ''}`}>
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 font-bold border border-teal-200">{(text.authorName || 'A')[0].toUpperCase()}</div>
            <div>
              <p className="text-[10px] font-black text-teal-600 uppercase mb-1 tracking-tighter">Plume certifiée</p>
              <p className="text-sm font-bold dark:text-white">{text.authorName || 'Anonyme'}</p>
            </div>
          </div>
          
          <div className={`prose dark:prose-invert max-w-none font-serif leading-[1.8] text-justify mb-24 first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:text-teal-600 ${isFocusMode ? 'text-2xl sm:text-3xl' : 'text-slate-800 dark:text-slate-200 whitespace-pre-wrap'}`}>
            {text.content}
          </div>

          <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 text-slate-300 hover:text-rose-500 transition-colors text-[9px] font-black uppercase"><AlertTriangle size={14} /> Signaler un contenu inapproprié</button>
        </article>

        {/* Pied de page et interactions */}
        <div className={isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-all duration-700'}>
          <div className="my-12"><InTextAd /></div>
          {!isStaffText && (
            <SceauCertification 
              wordCount={text.content?.length} 
              fileName={id} 
              userEmail={user?.email} 
              onValidated={() => fetchData(id)} 
              certifiedCount={text.totalCertified} 
              authorName={text.authorName} 
              textTitle={text.title} 
            />
          )}
          <SmartRecommendations currentId={id} allTexts={allTexts} />
          <CommentSection textId={id} comments={text.comments} user={user} onCommented={() => fetchData(id)} />
        </div>
        
        {isReportOpen && <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} userEmail={user?.email} />}
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  Heart, ArrowLeft, Eye, Loader2, MessageSquare, 
  Send, Share2, BookOpen, Trophy, RefreshCcw,
  Clock, Star, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { InTextAd } from "@/components/InTextAd";

// --- COMPOSANT INTERNE : PROOF OF READING ---
function ProofOfReading({ wordCount, fileName, onValidated }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Temps requis : 1 seconde par tranche de 50 mots (minimum 10s pour éviter le spam)
  const requiredTime = Math.max(10, Math.floor(wordCount / 50));

  useEffect(() => {
    if (isValidated) return;
    setSecondsLeft(requiredTime);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [wordCount, isValidated, requiredTime]);

  useEffect(() => {
    setProgress(((requiredTime - secondsLeft) / requiredTime) * 100);
  }, [secondsLeft, requiredTime]);

  const handleValidation = async () => {
    setIsSyncing(true);
    const loadingToast = toast.loading("Certification en cours...");
    try {
      const res = await fetch('/api/verify-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `${fileName}.json` })
      });

      if (res.ok) {
        setIsValidated(true);
        toast.success("Lecture certifiée !", { id: loadingToast });
        if (onValidated) onValidated();
      } else throw new Error();
    } catch (err) {
      toast.error("Erreur de synchronisation", { id: loadingToast });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="my-20 p-10 rounded-[3.5rem] border-2 border-dashed border-slate-100 bg-slate-50/30 flex flex-col items-center text-center space-y-6">
      {!isValidated ? (
        <>
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" 
                className="text-teal-500 transition-all duration-1000"
                strokeDasharray={226} strokeDashoffset={226 - (226 * progress) / 100} 
              />
            </svg>
            <Clock className="text-slate-300" size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Analyse de lecture</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px]">Prenez le temps de parcourir l'œuvre pour obtenir votre Sceau de Lecture.</p>
          </div>
          <button
            disabled={secondsLeft > 0 || isSyncing}
            onClick={handleValidation}
            className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              secondsLeft > 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl'
            }`}
          >
            {secondsLeft > 0 ? `Disponible dans ${secondsLeft}s` : "Certifier ma lecture"}
          </button>
        </>
      ) : (
        <div className="animate-in zoom-in duration-700 flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-28 h-28 bg-rose-600 rounded-full border-4 border-rose-700 shadow-2xl flex flex-col items-center justify-center text-rose-100 rotate-12 transition-transform hover:rotate-0 duration-500">
                <Star size={32} fill="currentColor" />
                <span className="text-[8px] font-black tracking-tighter mt-1">CERTIFIÉ</span>
            </div>
          </div>
          <h4 className="text-xl font-black italic text-slate-900">Lecture Approuvée</h4>
        </div>
      )}
    </div>
  );
}

// --- PAGE PRINCIPALE ---
export default function TextPage() {
  const router = useRouter();
  const { id: textId } = router.query;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  const handleGlobalShare = async () => {
    const shareData = {
      title: text?.title || "Lisible",
      text: `Lisez "${text?.title}" de ${text?.authorName} sur Lisible.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié !");
      }
    } catch (err) { if (err.name !== "AbortError") toast.error("Erreur de partage"); }
  };

  const fetchData = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${id}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Introuvable");
      
      const fileData = await res.json();
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      setText(content);

      if (!silent) {
        const viewKey = `v_u_${id}`;
        if (!localStorage.getItem(viewKey)) {
          await fetch("/api/texts", { 
            method: "PATCH", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ id: id, action: "view" }) 
          });
          localStorage.setItem(viewKey, "true");
        }
      }
    } catch (e) { if (!silent) toast.error("Erreur de chargement"); } 
    finally { setLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => { 
    if (router.isReady && textId) {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setUser(JSON.parse(logged));
      fetchData(textId);
      const interval = setInterval(() => fetchData(textId, true), 30000);
      return () => clearInterval(interval);
    }
  }, [router.isReady, textId, fetchData]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer");
    try {
      const res = await fetch("/api/texts", {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id: textId, action: "like", payload: { email: user.email } })
      });
      if (res.ok) {
        const updated = await res.json();
        setText(updated);
      }
    } catch (e) { toast.error("Action impossible"); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/texts", {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ 
          id: textId, 
          action: "comment", 
          payload: { userName: user.penName || user.name, text: newComment, date: new Date().toISOString() } 
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setText(updated);
        setNewComment("");
        toast.success("Publié !");
      }
    } catch (e) { toast.error("Échec"); } finally { setIsSubmitting(false); }
  };

  if (loading || !router.isReady) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Immersion...</p>
    </div>
  );
  
  if (!text) return <div className="py-40 text-center font-black uppercase text-slate-300 tracking-widest">Manuscrit introuvable</div>;

  const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");
  const wordCount = text.content.split(/\s+/).length;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16 animate-in fade-in duration-1000">
      
      <header className="pt-12 flex justify-between items-center">
        <button onClick={() => router.back()} className="group text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] hover:text-teal-600 transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour
        </button>
        <div className="flex items-center gap-4">
          {isRefreshing && <RefreshCcw size={14} className="animate-spin text-teal-600/50" />}
          <Link href="/bibliotheque" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-600 shadow-xl">
             <BookOpen size={14}/> Bibliothèque
          </Link>
        </div>
      </header>
      
      <article className="bg-white rounded-[4rem] p-10 md:p-20 shadow-2xl border border-slate-50 relative">
        {text.isConcours && (
          <div className="mb-8 inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 animate-pulse">
            <Trophy size={16} /> Battle Poétique International
          </div>
        )}

        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-[0.85] text-slate-900 mb-12">
          {text.title}
        </h1>
        
        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl mb-16 selection:bg-teal-100">
          {paragraphs.map((para, index) => (
            <React.Fragment key={index}>
              <p className={`mb-10 whitespace-pre-wrap ${index === 0 ? "first-letter:text-7xl first-letter:font-black first-letter:text-teal-600 first-letter:mr-4 first-letter:float-left first-letter:leading-[0.8]" : ""}`}>
                {para}
              </p>
              {index === 1 && <div className="my-12"><InTextAd /></div>}
            </React.Fragment>
          ))}
        </div>

        {/* NOUVEAU : SYSTÈME DE PREUVE DE LECTURE */}
        <ProofOfReading 
          wordCount={wordCount} 
          fileName={textId} 
          onValidated={() => fetchData(textId, true)} 
        />

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100/50">
              <Eye size={18} className="text-teal-500"/> 
              <span className="font-black text-xs text-slate-600">{text.views || 0}</span>
            </div>
            
            <button onClick={handleLike} className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all active:scale-90 ${text.likes?.includes(user?.email) ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 border border-slate-100/50 hover:bg-slate-100'}`}>
              <Heart size={18} fill={text.likes?.includes(user?.email) ? "currentColor" : "none"}/> 
              <span className="font-black text-xs">{text.likes?.length || 0}</span>
            </button>

            <button onClick={handleGlobalShare} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-600 hover:text-white transition-all">
              <Share2 size={18} />
              <span className="font-black text-[10px] uppercase tracking-widest">Partager</span>
            </button>
          </div>

          <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Auteur</p>
             <div className="text-teal-600 font-black italic text-2xl uppercase tracking-tighter">@{text.authorName}</div>
          </div>
        </div>
      </article>

      {/* SECTION COMMENTAIRES */}
      <section className="space-y-10 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black italic flex items-center gap-4 text-slate-900">
          <MessageSquare className="text-teal-500" size={28} /> Échanges 
        </h2>
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl">
          {user ? (
            <div className="space-y-6">
              <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="w-full bg-slate-50 rounded-[2rem] p-8 min-h-[160px] outline-none border border-slate-100 focus:bg-white transition-all text-slate-700" placeholder="Votre ressenti..." />
              <div className="flex justify-end">
                <button onClick={handlePostComment} disabled={isSubmitting || !newComment.trim()} className="bg-slate-900 text-white px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-3 shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Envoyer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Connectez-vous pour rejoindre la discussion</p>
          )}
        </div>

        <div className="space-y-8">
          {text.comments && [...text.comments].reverse().map((c, i) => (
            <div key={i} className="group bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-[12px] uppercase text-slate-900 tracking-wider">{c.userName}</span>
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600 leading-relaxed pl-6 border-l-4 border-teal-50 group-hover:border-teal-500 transition-colors italic">"{c.text}"</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center pt-20 border-t border-slate-50">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Lisible • Expérience Littéraire Certifiée</p>
      </footer>
    </div>
  );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  Heart, ArrowLeft, Eye, Loader2, MessageSquare, 
  Send, Share2, BookOpen, Trophy, RefreshCcw,
  Clock, Star, ShieldCheck, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { InTextAd } from "@/components/InTextAd";

// --- COMPOSANT INTERNE : PROOF OF READING ---
function ProofOfReading({ wordCount, fileName, onValidated }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

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
    const loadingToast = toast.loading("Certification de votre lecture...");
    try {
      // 1. On appelle l'API pour incrémenter le compteur de lectures certifiées
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: fileName, 
            action: "certify" // Nouvelle action pour le compteur de lectures
        })
      });

      if (res.ok) {
        setIsValidated(true);
        toast.success("Lecture certifiée et enregistrée !", { id: loadingToast });
        // 2. On déclenche la mise à jour automatique des données sur la page parente
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
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Analyse de temps de lecture</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px]">Veuillez parcourir l'œuvre pour obtenir votre Sceau de Lecture.</p>
          </div>
          <button
            disabled={secondsLeft > 0 || isSyncing}
            onClick={handleValidation}
            className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              secondsLeft > 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl shadow-teal-900/20'
            }`}
          >
            {secondsLeft > 0 ? `Sceau disponible dans ${secondsLeft}s` : "Obtenir mon Sceau de Cire"}
          </button>
        </>
      ) : (
        <div className="animate-in zoom-in duration-700 flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-28 h-28 bg-rose-600 rounded-full border-4 border-rose-700 shadow-2xl flex flex-col items-center justify-center text-rose-100 rotate-12 transition-transform hover:rotate-0 duration-500">
                <Star size={32} fill="currentColor" />
                <span className="text-[8px] font-black tracking-tighter mt-1">LECTURE</span>
                <span className="text-[7px] font-bold tracking-tighter">CERTIFIÉE</span>
            </div>
          </div>
          <h4 className="text-xl font-black italic text-slate-900">Vous avez lu cette œuvre avec attention.</h4>
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
    } catch (e) { if (!silent) toast.error("Erreur de rafraîchissement"); } 
    finally { setLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => { 
    if (router.isReady && textId) {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setUser(JSON.parse(logged));
      fetchData(textId);
      const interval = setInterval(() => fetchData(textId, true), 30000); // Sync auto toutes les 30s
      return () => clearInterval(interval);
    }
  }, [router.isReady, textId, fetchData]);

  if (loading || !router.isReady) return <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
  if (!text) return <div className="py-40 text-center font-black uppercase text-slate-300 tracking-widest">Manuscrit introuvable</div>;

  const wordCount = text.content.split(/\s+/).length;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16 animate-in fade-in duration-1000">
      
      {/* HEADER AVEC COMPTEURS */}
      <header className="pt-12 flex justify-between items-center">
        <button onClick={() => router.back()} className="group text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] hover:text-teal-600 transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour
        </button>
        <div className="flex items-center gap-4">
            {/* STATS RAPIDES DANS LE HEADER */}
            <div className="hidden md:flex items-center gap-6 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <Eye size={14} className="text-slate-300"/>
                    <span className="text-[10px] font-black text-slate-900">{text.views || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-teal-500"/>
                    <span className="text-[10px] font-black text-slate-900">{text.certifiedReads || 0} Lectures</span>
                </div>
            </div>
            <Link href="/bibliotheque" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-600 shadow-xl">
                <BookOpen size={14}/> Bibliothèque
            </Link>
        </div>
      </header>
      
      <article className="bg-white rounded-[4rem] p-10 md:p-20 shadow-2xl border border-slate-50 relative">
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-[0.85] text-slate-900 mb-12">
          {text.title}
        </h1>
        
        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl mb-16 selection:bg-teal-100">
          {text.content.split('\n').filter(p => p.trim() !== "").map((para, index) => (
            <React.Fragment key={index}>
              <p className="mb-10 whitespace-pre-wrap">{para}</p>
              {index === 1 && <div className="my-12"><InTextAd /></div>}
            </React.Fragment>
          ))}
        </div>

        {/* SYSTÈME DE PREUVE DE LECTURE : on repasse textId pour fileName */}
        <ProofOfReading 
          wordCount={wordCount} 
          fileName={textId} 
          onValidated={() => fetchData(textId, true)} 
        />

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            {/* COMPTEUR DE VUES */}
            <div className="flex flex-col items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vues</span>
               <span className="font-black text-sm text-slate-900">{text.views || 0}</span>
            </div>

            {/* COMPTEUR DE LECTURES CERTIFIÉES (Automatique) */}
            <div className="flex flex-col items-center bg-teal-50 px-5 py-3 rounded-2xl border border-teal-100">
               <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Lectures</span>
               <span className="font-black text-sm text-teal-900">{text.certifiedReads || 0}</span>
            </div>

            <button onClick={handleGlobalShare} className="ml-4 p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all shadow-lg">
              <Share2 size={20} />
            </button>
          </div>

          <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Auteur</p>
             <div className="text-teal-600 font-black italic text-2xl uppercase tracking-tighter">@{text.authorName}</div>
          </div>
        </div>
      </article>

      {/* FOOTER */}
      <footer className="text-center pt-20 border-t border-slate-50">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Lisible.biz • Certifié par l'Attention</p>
      </footer>
    </div>
  );
}

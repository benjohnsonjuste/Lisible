"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  ArrowLeft, Eye, Loader2, Share2, BookOpen, 
  Clock, Star, CheckCircle2, Sparkles 
} from "lucide-react";
import Link from "next/link";
import { InTextAd } from "@/components/InTextAd";

// --- COMPOSANT : PREUVE DE LECTURE (LOGIQUE ÉCONOMIQUE) ---
function ProofOfReading({ wordCount, fileName, onValidated, userEmail, currentCertified }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calcul du temps requis (vitesse de lecture humaine moyenne)
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
    const loadingToast = toast.loading("Sécurisation de vos Li...");
    
    try {
      // 1. Créditer le Wallet et incrémenter le fichier texte individuel
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: fileName, 
            action: "certify",
            payload: { readerEmail: userEmail }
        })
      });

      if (!res.ok) throw new Error("Échec de la certification");

      // 2. Mettre à jour l'index global pour la bibliothèque
      await fetch('/api/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          textId: fileName, 
          certifiedReads: (currentCertified || 0) + 1 
        })
      });

      setIsValidated(true);
      toast.success("Sceau de Cire obtenu ! +Li ajoutés.", { 
        id: loadingToast,
        icon: <Sparkles className="text-amber-500" /> 
      });
      
      if (onValidated) onValidated();
    } catch (err) {
      toast.error("Erreur de synchronisation GitHub", { id: loadingToast });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="my-20 p-10 rounded-[3.5rem] border-2 border-dashed border-slate-100 bg-slate-50/30 flex flex-col items-center text-center space-y-6">
      {!isValidated ? (
        <>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" 
                className="text-teal-500 transition-all duration-1000"
                strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} 
              />
            </svg>
            <div className="flex flex-col items-center">
                <Clock className="text-slate-300 mb-1" size={20} />
                <span className="text-[10px] font-black text-slate-900">{secondsLeft}s</span>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Sceau de Cire en préparation</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px]">Le Li récompense l'attention, pas la vitesse.</p>
          </div>
          <button
            disabled={secondsLeft > 0 || isSyncing || !userEmail}
            onClick={handleValidation}
            className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              (secondsLeft > 0 || !userEmail) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl'
            }`}
          >
            {!userEmail ? "Connectez-vous pour gagner des Li" : secondsLeft > 0 ? "Lecture en cours..." : "Certifier et recevoir mes Li"}
          </button>
        </>
      ) : (
        <div className="animate-in zoom-in duration-700 flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-20" />
            <div className="relative w-28 h-28 bg-slate-900 rounded-full border-4 border-white shadow-2xl flex flex-col items-center justify-center text-teal-400 rotate-12 transition-transform hover:rotate-0 duration-500">
                <Star size={32} fill="currentColor" />
                <span className="text-[10px] font-black tracking-tighter mt-1 italic">LI CERTIFIÉ</span>
            </div>
          </div>
          <h4 className="text-xl font-black italic text-slate-900 leading-tight">Attention validée.<br/><span className="text-teal-600 text-sm tracking-widest uppercase not-italic">Votre Li a été déposé.</span></h4>
        </div>
      )}
    </div>
  );
}

// --- PAGE PRINCIPALE : TEXT PAGE ---
export default function TextPage() {
  const router = useRouter();
  const { id: textId } = router.query;
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchData = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
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
    } catch (e) { if (!silent) toast.error("Erreur réseau"); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    if (router.isReady && textId) {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setUser(JSON.parse(logged));
      fetchData(textId);
    }
  }, [router.isReady, textId, fetchData]);

  if (loading || !router.isReady) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  if (!text) return (
    <div className="py-40 text-center font-black uppercase text-slate-300 tracking-[0.5em]">
      Manuscrit Introuvable
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16 animate-in fade-in duration-1000">
      <header className="pt-12 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] hover:text-teal-600 transition-colors">
          <ArrowLeft size={16}/> Retour
        </button>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-teal-500"/>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{text.certifiedReads || 0} Lectures Certifiées</span>
                </div>
            </div>
            <Link href="/bibliotheque" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-600 shadow-xl transition-all">
                <BookOpen size={14}/> Explorer
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

        {/* --- SYSTÈME DE VALIDATION --- */}
        <ProofOfReading 
          wordCount={text.content.split(/\s+/).length} 
          fileName={textId} 
          textTitle={text.title}
          userEmail={user?.email}
          currentCertified={text.certifiedReads}
          onValidated={() => fetchData(textId, true)} 
        />

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-slate-50 px-6 py-4 rounded-[2rem] border border-slate-100">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vues</span>
               <span className="font-black text-lg text-slate-900 italic">{text.views || 0}</span>
            </div>

            <div className="flex flex-col items-center bg-teal-50 px-6 py-4 rounded-[2rem] border border-teal-100 shadow-lg shadow-teal-500/5">
               <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">Attention (Li)</span>
               <span className="font-black text-lg text-slate-900 italic">{text.certifiedReads || 0}</span>
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Lien copié dans le presse-papier");
              }} 
              className="ml-4 p-5 bg-slate-900 text-white rounded-[1.5rem] hover:bg-teal-600 transition-all shadow-xl"
            >
              <Share2 size={20} />
            </button>
          </div>

          <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 underline decoration-teal-500 underline-offset-4">Auteur Certifié</p>
             <div className="text-slate-900 font-black italic text-2xl uppercase tracking-tighter">@{text.authorName}</div>
          </div>
        </div>
      </article>

      <footer className="text-center pt-20 border-t border-slate-50">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Lisible.biz • Certifié par l'Attention Humaine</p>
      </footer>
    </div>
  );
}

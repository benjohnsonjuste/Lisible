"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  ArrowLeft, Share2, BookOpen, Clock, Star, 
  CheckCircle2, Sparkles, Coins, Gift, Loader2, Heart 
} from "lucide-react";
import Link from "next/link";
import { InTextAd } from "@/components/InTextAd";

// --- NOUVEAU COMPOSANT : SOUTIEN DIRECT (OFFRIR DES LI) ---
function SupportAuthor({ authorEmail, authorName, textTitle, userEmail, currentBalance }) {
  const [isGifting, setIsGifting] = useState(false);

  const handleGift = async (amount) => {
    if (!userEmail) return toast.error("Connectez-vous pour offrir des Li");
    if (currentBalance < amount) return toast.error("Solde Li insuffisant");

    setIsGifting(true);
    try {
      const res = await fetch('/api/gift-li', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          readerEmail: userEmail, 
          authorEmail, 
          amount, 
          textTitle 
        })
      });

      if (!res.ok) throw new Error();
      toast.success(`Vous avez envoyé ${amount} Li à ${authorName} !`, {
        icon: <Gift className="text-rose-500" />
      });
    } catch (e) {
      toast.error("Échec du transfert");
    } finally {
      setIsGifting(false);
    }
  };

  return (
    <div className="my-16 p-8 rounded-[3rem] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-sm relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-200">
            <Coins size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800">Soutenir l'auteur</h4>
            <p className="text-xs font-bold text-amber-900/60">Offrez des Li pour encourager cette plume.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[50, 100, 500].map((val) => (
            <button
              key={val}
              disabled={isGifting}
              onClick={() => handleGift(val)}
              className="px-6 py-3 bg-white border-2 border-amber-200 rounded-2xl text-[10px] font-black uppercase tracking-tighter text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all active:scale-95 flex items-center gap-2"
            >
              <Heart size={12} fill="currentColor" /> +{val} Li
            </button>
          ))}
          <Link href="/shop" className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-tighter hover:bg-teal-600 transition-all flex items-center gap-2">
            Acheter des Li <Sparkles size={12} />
          </Link>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 duration-700">
          <Coins size={120} />
      </div>
    </div>
  );
}

// --- COMPOSANT : PREUVE DE LECTURE ---
function ProofOfReading({ wordCount, fileName, onValidated, userEmail, currentCertified }) {
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
    const loadingToast = toast.loading("Sécurisation de vos Li...");
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: fileName, 
            action: "certify",
            payload: { readerEmail: userEmail }
        })
      });
      if (!res.ok) throw new Error();

      setIsValidated(true);
      toast.success("Attention validée ! +Li ajoutés.", { id: loadingToast });
      if (onValidated) onValidated();
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
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" 
                className="text-teal-500 transition-all duration-1000"
                strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} 
              />
            </svg>
            <span className="text-[10px] font-black text-slate-900">{secondsLeft}s</span>
          </div>
          <button
            disabled={secondsLeft > 0 || isSyncing || !userEmail}
            onClick={handleValidation}
            className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              (secondsLeft > 0 || !userEmail) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl'
            }`}
          >
            {!userEmail ? "Connectez-vous pour gagner" : secondsLeft > 0 ? "Lecture en cours..." : "Certifier la lecture"}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-4">
           <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-xl">
             <Star size={30} fill="currentColor" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 italic">Li déposé dans votre portefeuille</p>
        </div>
      )}
    </div>
  );
}

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
      if (!res.ok) throw new Error();
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

  if (loading || !router.isReady) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
  if (!text) return <div className="py-40 text-center font-black uppercase text-slate-300 tracking-[0.5em]">Introuvable</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24 animate-in fade-in duration-1000">
      <header className="pt-12 flex justify-between items-center mb-16">
        <button onClick={() => router.back()} className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] hover:text-teal-600 transition-colors">
          <ArrowLeft size={16}/> Retour
        </button>
        <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-5 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-teal-500"/>
                <span className="text-[10px] font-black text-slate-900 uppercase italic">{text.certifiedReads || 0} Certifiés</span>
            </div>
        </div>
      </header>
      
      <article className="bg-white rounded-[4rem] p-10 md:p-20 shadow-2xl border border-slate-50">
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-[0.85] text-slate-900 mb-12">
          {text.title}
        </h1>
        
        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl mb-16">
          {text.content.split('\n').filter(p => p.trim() !== "").map((para, index) => (
            <React.Fragment key={index}>
              <p className="mb-10">{para}</p>
              {index === 1 && <div className="my-12"><InTextAd /></div>}
            </React.Fragment>
          ))}
        </div>

        {/* --- ACTIONS ÉCONOMIQUES --- */}
        <SupportAuthor 
          authorEmail={text.authorEmail}
          authorName={text.authorName}
          textTitle={text.title}
          userEmail={user?.email}
          currentBalance={user?.wallet?.balance || 0}
        />

        <ProofOfReading 
          wordCount={text.content.split(/\s+/).length} 
          fileName={textId} 
          userEmail={user?.email}
          onValidated={() => fetchData(textId, true)} 
        />

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-center bg-slate-50 px-6 py-4 rounded-[2rem] border border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vues</span>
                <span className="font-black text-lg text-slate-900 italic">{text.views || 0}</span>
             </div>
             <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié"); }} className="p-5 bg-slate-900 text-white rounded-[1.5rem] hover:bg-teal-600 transition-all shadow-xl">
               <Share2 size={20} />
             </button>
          </div>
          <div className="text-right italic font-black text-2xl uppercase tracking-tighter text-slate-900">
            @{text.authorName}
          </div>
        </div>
      </article>
    </div>
  );
}

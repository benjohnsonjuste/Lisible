"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ArrowLeft, Share2, Star, CheckCircle2, Coins, Gift, Loader2, Heart } from "lucide-react";
import Link from "next/link";

// SOUTIEN DIRECT
function SupportAuthor({ authorEmail, authorName, textTitle, userEmail, currentBalance, onGiftSuccess }) {
  const [isGifting, setIsGifting] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handleGift = async (amount) => {
    const finalAmount = parseInt(amount);
    if (!userEmail) return toast.error("Connectez-vous pour soutenir");
    if (!finalAmount || finalAmount <= 0) return toast.error("Montant invalide");
    if (currentBalance < finalAmount) return toast.error("Solde Li insuffisant");

    setIsGifting(true);
    try {
      const res = await fetch('/api/gift-li', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerEmail: userEmail, authorEmail, amount: finalAmount, textTitle })
      });
      if (!res.ok) throw new Error();
      toast.success(`+${finalAmount} Li envoyés à ${authorName} !`);
      if (onGiftSuccess) onGiftSuccess();
    } catch (e) { toast.error("Échec de l'envoi"); }
    finally { setIsGifting(false); setCustomAmount(""); }
  };

  return (
    <div className="my-16 p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-teal-500 rounded-2xl text-slate-900"><Gift size={20} /></div>
        <h4 className="text-lg font-black italic">Soutenir l'auteur directement</h4>
      </div>
      <div className="flex flex-wrap gap-3">
        {[10, 50, 100].map(v => (
          <button key={v} onClick={() => handleGift(v)} className="px-6 py-3 bg-white/10 hover:bg-teal-500 rounded-xl font-black transition-all">+{v} Li</button>
        ))}
        <div className="flex bg-white/10 rounded-xl overflow-hidden">
          <input type="number" placeholder="Autre..." value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="bg-transparent px-4 w-20 text-xs font-bold outline-none" />
          <button onClick={() => handleGift(customAmount)} className="bg-teal-500 text-slate-900 px-4 font-black text-[10px]">OK</button>
        </div>
      </div>
    </div>
  );
}

// PREUVE DE LECTURE (Sécurisée par Appareil)
function ProofOfReading({ wordCount, fileName, userEmail, onValidated }) {
  const [seconds, setSeconds] = useState(Math.max(10, Math.floor(wordCount / 50)));
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    if (isValidated || seconds <= 0) return;
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, isValidated]);

  const validate = async () => {
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) return toast.error("Déjà certifié sur cet appareil.");

    const t = toast.loading("Certification...");
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fileName, action: "certify", payload: { readerEmail: userEmail } })
      });
      if (res.ok) {
        localStorage.setItem(deviceKey, "true");
        setIsValidated(true);
        toast.success("Lecture certifiée !", { id: t });
        onValidated();
      }
    } catch (e) { toast.error("Erreur", { id: t }); }
  };

  return (
    <div className="my-10 p-10 border-2 border-dashed border-slate-100 rounded-[3rem] text-center space-y-4">
      {!isValidated ? (
        <>
          <p className="text-[10px] font-black uppercase text-slate-400">Temps d'attention requis : {seconds}s</p>
          <button disabled={seconds > 0 || !userEmail} onClick={validate} className={`px-10 py-5 rounded-2xl font-black uppercase text-[10px] transition-all ${seconds > 0 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-teal-600'}`}>
            {!userEmail ? "Connectez-vous" : seconds > 0 ? "Lecture en cours..." : "Certifier la lecture"}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center text-teal-600"><Star size={40} fill="currentColor" /> <p className="font-black italic mt-2">Li Accumulés !</p></div>
      )}
    </div>
  );
}

export default function TextPage() {
  const router = useRouter();
  const { id: textId } = router.query;
  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${id}.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      setText(JSON.parse(decodeURIComponent(escape(atob(data.content)))));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (router.isReady && textId) {
      setUser(JSON.parse(localStorage.getItem("lisible_user")));
      fetchData(textId);
    }
  }, [router.isReady, textId, fetchData]);

  if (loading || !text) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-6xl font-black italic tracking-tighter mb-10">{text.title}</h1>
      <div className="prose prose-xl font-serif text-slate-800 mb-16">{text.content}</div>
      
      <SupportAuthor authorEmail={text.authorEmail} authorName={text.authorName} textTitle={text.title} userEmail={user?.email} currentBalance={user?.wallet?.balance || 0} onGiftSuccess={() => fetchData(textId, true)} />
      
      <ProofOfReading wordCount={text.content.split(/\s+/).length} fileName={textId} userEmail={user?.email} onValidated={() => fetchData(textId, true)} />
    </div>
  );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ArrowLeft, Star, Coins, Gift, Loader2, ShoppingCart } from "lucide-react";

function SupportAuthor({ authorEmail, authorName, textTitle, userEmail, currentBalance, onGiftSuccess }) {
  const router = useRouter();
  const [isGifting, setIsGifting] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handleGift = async (amount) => {
    const finalAmount = parseInt(amount);
    if (!userEmail) return toast.error("Connectez-vous pour soutenir");
    if (!finalAmount || finalAmount <= 0) return toast.error("Montant invalide");

    if (currentBalance < finalAmount) {
      toast("Solde insuffisant", {
        description: `Il vous manque ${finalAmount - currentBalance} Li.`,
        action: { label: "Boutique", onClick: () => router.push("/shop") },
      });
      return;
    }

    setIsGifting(true);
    const t = toast.loading("Envoi des Li...");
    try {
      const res = await fetch('/api/gift-li', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerEmail: userEmail, authorEmail, amount: finalAmount, textTitle })
      });
      if (res.ok) {
        toast.success(`Cadeau envoyé à ${authorName} !`, { id: t });
        onGiftSuccess();
      }
    } catch (e) { toast.error("Erreur", { id: t }); }
    finally { setIsGifting(false); setCustomAmount(""); }
  };

  return (
    <div className="my-12 p-8 bg-slate-900 rounded-[3rem] text-white shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Gift className="text-teal-400" />
          <h4 className="font-black italic">Soutenir l'auteur</h4>
        </div>
        <div className="text-[10px] font-bold text-slate-400">SOLDE: {currentBalance} Li</div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[50, 100, 500].map(v => (
          <button key={v} onClick={() => handleGift(v)} className="px-5 py-3 bg-white/10 hover:bg-teal-500 rounded-xl font-black transition-all">+{v}</button>
        ))}
        <div className="flex bg-white/10 rounded-xl overflow-hidden">
          <input type="number" placeholder="Montant" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="bg-transparent px-3 w-20 text-xs outline-none" />
          <button onClick={() => handleGift(customAmount)} className="bg-teal-500 text-slate-900 px-4 font-black text-[10px]">OK</button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="my-10 p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
      {!isValidated ? (
        <button disabled={seconds > 0 || !userEmail} onClick={validate} className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${seconds > 0 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white'}`}>
          {seconds > 0 ? `Attente: ${seconds}s` : "Certifier la lecture"}
        </button>
      ) : (
        <div className="text-teal-600 font-black italic">✓ Li déposé dans votre portefeuille</div>
      )}
    </div>
  );
}

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);

  const fetchData = useCallback(async (textId, silent = false) => {
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      setText(JSON.parse(decodeURIComponent(escape(atob(data.content)))));
    }
  }, []);

  useEffect(() => {
    if (router.isReady && id) {
      setUser(JSON.parse(localStorage.getItem("lisible_user")));
      fetchData(id);
    }
  }, [router.isReady, id, fetchData]);

  if (!text) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-10">{text.title}</h1>
      <div className="prose prose-xl font-serif text-slate-800 mb-16 whitespace-pre-wrap">{text.content}</div>
      <SupportAuthor authorEmail={text.authorEmail} authorName={text.authorName} textTitle={text.title} userEmail={user?.email} currentBalance={user?.wallet?.balance || 0} onGiftSuccess={() => fetchData(id, true)} />
      <ProofOfReading wordCount={text.content.split(/\s+/).length} fileName={id} userEmail={user?.email} onValidated={() => fetchData(id, true)} />
    </div>
  );
}

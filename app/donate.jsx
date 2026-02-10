"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Coins, Heart, Loader2, Sparkles, 
  ShieldCheck, Send, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

export default function DonatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const recipientId = searchParams.get("to");
  const MIN_TRANSFER = 1000;

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [author, setAuthor] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initPage = async () => {
      const stored = localStorage.getItem("lisible_user");
      if (!stored) {
        toast.error("Connexion requise pour offrir des Li");
        router.push("/auth");
        return;
      }
      const currentUser = JSON.parse(stored);
      setUser(currentUser);

      if (recipientId) {
        try {
          const authorEmail = (recipientId.includes('=') || recipientId.length > 20) 
            ? atob(recipientId) 
            : recipientId;

          const res = await fetch(`/api/github-db?type=user&id=${authorEmail}`);
          const data = await res.json();
          if (data?.content) setAuthor(data.content);
        } catch (e) {
          toast.error("Destinataire introuvable");
        }
      }
      setLoading(false);
    };
    initPage();
  }, [recipientId, router]);

  const handleTransfer = async () => {
    const val = parseInt(amount);
    
    // Vérification du seuil minimal de 1000 Li
    if (!val || val < MIN_TRANSFER) {
      return toast.error(`Le don minimal est de ${MIN_TRANSFER} Li`);
    }
    if (user.li < val) return toast.error("Solde de Li insuffisant");
    if (user.email === author?.email) return toast.error("L'auto-don n'est pas permis");

    setSubmitting(true);
    const t = toast.loading("Transfert d'énergie créative...");

    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer_li",
          userEmail: user.email,
          recipientEmail: author.email,
          amount: val
        })
      });

      if (res.ok) {
        const newUser = { ...user, li: user.li - val };
        localStorage.setItem("lisible_user", JSON.stringify(newUser));
        
        toast.success(`Merci ! ${val} Li ont été versés à ${author.penName || author.name}`, { id: t });
        
        fetch("/api/github-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_notif",
            targetEmail: author.email,
            type: "gift",
            title: "Nouveau soutien !",
            message: `${newUser.name || "Une plume"} vous a offert ${val} Li.`
          })
        });

        setTimeout(() => router.back(), 2000);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Échec du transfert");
      }
    } catch (e) {
      toast.error(e.message, { id: t });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] px-6 py-12 flex flex-col items-center">
      <div className="max-w-md w-full space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-teal-600 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100">
             <Coins size={16} className="text-teal-600" />
             <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">{user?.li || 0} Li en poche</span>
          </div>
        </div>

        {/* Author Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <img 
              src={author?.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${author?.email}`}
              className="w-full h-full rounded-[2rem] object-cover border-4 border-slate-50"
              alt="Avatar"
            />
            <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white p-1.5 rounded-full border-4 border-white">
              <Sparkles size={12} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">Soutenir {author?.penName || author?.name}</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Seuil de soutien : {MIN_TRANSFER} Li</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-6">
          <div className="relative">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={MIN_TRANSFER.toString()}
              className="w-full bg-white border-2 border-slate-100 rounded-[2.5rem] py-8 px-10 text-4xl font-black text-center text-slate-900 focus:border-teal-500 focus:ring-0 transition-all placeholder:text-slate-100"
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">LI</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1000, 2500, 5000].map(val => (
              <button 
                key={val} 
                onClick={() => setAmount(val.toString())}
                className="bg-white border border-slate-100 py-3 rounded-2xl text-[10px] font-black text-slate-400 hover:border-teal-500 hover:text-teal-600 transition-all uppercase tracking-widest"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleTransfer}
          disabled={submitting || !amount || parseInt(amount) < MIN_TRANSFER}
          className={`w-full py-6 rounded-[2.5rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] transition-all ${
            (submitting || parseInt(amount) < MIN_TRANSFER) ? "bg-slate-100 text-slate-300" : "bg-slate-950 text-white hover:bg-teal-600 shadow-2xl shadow-teal-900/20 active:scale-95"
          }`}
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          {parseInt(amount) < MIN_TRANSFER ? `Minimum ${MIN_TRANSFER} Li` : "Confirmer le don"}
        </button>

        {/* Safety Note */}
        <div className="flex items-start gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <AlertCircle size={16} className="text-slate-300 flex-shrink-0 mt-0.5" />
          <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
            Les transferts sont irréversibles. Pour préserver la valeur des échanges, le montant minimal est fixé à {MIN_TRANSFER} Li.
          </p>
        </div>
      </div>
    </div>
  );
}

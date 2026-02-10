"use client";
import React, { useState } from "react";
import { Coins, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Wallet({ balance, userEmail }) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [amount, setAmount] = useState(10);
  const [recipient, setRecipient] = useState("");

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (amount > balance) return toast.error("Solde de Li insuffisant");

    setIsTransferring(true);
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer_li",
          userEmail: userEmail,
          recipientEmail: recipient.trim().toLowerCase(),
          amount: parseInt(amount)
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${amount} Li envoyés avec succès !`);
        setRecipient("");
        // Optionnel : recharger la page pour voir le nouveau solde
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast.error(e.message || "Échec du transfert");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Votre Trésorerie</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{balance}</span>
            <span className="text-teal-600 font-bold text-xl italic">Li</span>
          </div>
        </div>
        <div className="p-4 bg-teal-50 rounded-2xl text-teal-600">
          <Coins size={24} />
        </div>
      </div>

      <form onSubmit={handleTransfer} className="space-y-3 pt-4 border-t border-slate-50">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Faire un don de plumes</p>
        <div className="flex flex-col gap-2">
          <input 
            type="email" 
            placeholder="Email du destinataire"
            className="bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 ring-teal-500/20"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <input 
              type="number" 
              min="1"
              className="bg-slate-50 border-none rounded-xl p-3 text-xs font-bold w-24 outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              disabled={isTransferring}
              className="flex-1 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {isTransferring ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Envoyer</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

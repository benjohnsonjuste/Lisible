// components/ProofOfReading.jsx
"use client";

import React, { useState } from "react";
import { ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

/**
 * Composant de certification de lecture.
 * Permet de valider la lecture et de distribuer les gains (Li).
 */
export default function ProofOfReading({ text, user, onValidated }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [done, setDone] = useState(false);

  const handleCertify = async () => {
    if (!text?.id) {
      toast.error("Données du texte manquantes");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/texts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: text.id,
          action: "certify",
          payload: { 
            readerEmail: user?.email || null,
            readerName: user?.penName || user?.name || "Anonyme"
          }
        })
      });

      if (res.ok) {
        setDone(true);
        toast.success("Lecture Certifiée ! Gains distribués.");
        if (onValidated) onValidated();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la certification");
      }
    } catch (e) {
      toast.error(e.message || "Échec de la certification");
    } finally {
      setIsSyncing(false);
    }
  };

  if (done) return (
    <div className="bg-teal-50 border border-teal-100 p-6 rounded-[2rem] text-center animate-in zoom-in duration-500">
      <Sparkles className="mx-auto text-teal-500 mb-2" />
      <p className="text-[10px] font-black uppercase text-teal-700 tracking-widest">
        Attention Validée +1 Li
      </p>
    </div>
  );

  return (
    <button
      onClick={handleCertify}
      disabled={isSyncing}
      className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-teal-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      {isSyncing ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <ShieldCheck size={18} className="text-teal-400" />
      )}
      Certifier ma lecture
    </button>
  );
}

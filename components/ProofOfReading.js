"use client";

import React, { useState } from "react";
import { ShieldCheck, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Composant de certification de lecture Lisible.
 * Permet de valider la lecture et de distribuer les Li via l'API unifiée.
 */
export default function ProofOfReading({ textId, user, onValidated }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [done, setDone] = useState(false);

  const handleCertify = async () => {
    if (!textId) {
      toast.error("Données du texte introuvables");
      return;
    }

    setIsSyncing(true);
    const tid = toast.loading("Scellement de votre attention...");

    try {
      // Utilisation de l'API unifiée github-db avec l'action 'certify'
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "certify",
          id: textId,
          readerEmail: user?.email || "anonymous",
          readerName: user?.penName || user?.name || "Une Plume Lisible"
        })
      });

      const data = await res.json();

      if (res.ok) {
        setDone(true);
        toast.success("Lecture Certifiée ! +1 Li ajouté à votre sillage.", { id: tid });
        
        // Callback pour rafraîchir le compteur sur la page parente
        if (onValidated) onValidated();
      } else {
        throw new Error(data.error || "Le Grand Livre n'a pas pu valider cet écho.");
      }
    } catch (e) {
      toast.error(e.message || "Échec de la synchronisation", { id: tid });
    } finally {
      setIsSyncing(false);
    }
  };

  // État après validation (Le Sceau est posé)
  if (done) return (
    <div className="bg-teal-50 border border-teal-100 p-8 rounded-[2.5rem] text-center animate-in zoom-in duration-700 shadow-inner">
      <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
        <CheckCircle2 size={24} />
      </div>
      <p className="text-[10px] font-black uppercase text-teal-800 tracking-[0.4em] mb-1">
        Attention Validée
      </p>
      <div className="flex items-center justify-center gap-2 text-teal-600/60">
        <Sparkles size={12} />
        <span className="text-[9px] font-bold uppercase tracking-widest">+1 Li Distribué</span>
      </div>
    </div>
  );

  // État initial (Bouton d'action)
  return (
    <div className="relative group">
      {/* Effet de brillance au survol */}
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2.2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <button
        onClick={handleCertify}
        disabled={isSyncing}
        className="relative w-full py-7 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-teal-600 transition-all duration-500 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.97] shadow-2xl"
      >
        {isSyncing ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <ShieldCheck size={20} className="text-teal-400 group-hover:text-white transition-colors" />
            <span>Apposer mon Sceau</span>
          </>
        )}
      </button>
      
      <p className="mt-4 text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Certifie que vous avez accordé votre temps à cette œuvre
      </p>
    </div>
  );
}

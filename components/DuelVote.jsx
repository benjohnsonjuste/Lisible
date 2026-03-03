"use client";
import React, { useState, useEffect } from "react";
import { Heart, Check } from "lucide-react";
import { toast } from "sonner";

export default function DuelVote({ duelId, targetEmail, currentUser }) {
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
    if (history[duelId]) setVoted(true);
  }, [duelId]);

  const castVote = async () => {
    if (voted) return;
    if (!currentUser) return toast.error("Connectez-vous pour voter.");
    if (currentUser.li < 1) return toast.error("1 Li requis pour voter.");

    try {
      // On utilise duel-engine qui gère spécifiquement la logique de vote
      const res = await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'vote', 
          duelId, 
          targetEmail, 
          voterEmail: currentUser.email 
        })
      });

      if (res.ok) {
        const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
        history[duelId] = true;
        localStorage.setItem("duel_votes", JSON.stringify(history));
        
        // Mise à jour du solde local pour l'UI
        const updatedUser = { ...currentUser, li: currentUser.li - 1 };
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        
        setVoted(true);
        toast.success("Vote pris en compte ! (-1 Li)");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors du vote.");
      }
    } catch (e) {
      toast.error("Erreur de connexion au serveur.");
    }
  };

  return (
    <button
      onClick={castVote}
      disabled={voted}
      className={`group flex items-center gap-3 px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] transition-all ${
        voted 
          ? "bg-teal-500 text-slate-900 cursor-default" 
          : "bg-white/10 text-white hover:bg-rose-600 shadow-xl active:scale-95"
      }`}
    >
      {voted ? <Check size={14} /> : <Heart size={14} className="group-hover:fill-current" />}
      {voted ? "Voté" : "Voter pour ce texte"}
    </button>
  );
}

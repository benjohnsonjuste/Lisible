"use client";
import React, { useState, useEffect } from "react";
import { Heart, Check } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function DuelVote({ duelId, targetEmail, currentUser }) {
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
    if (history[duelId]) setVoted(true);
  }, [duelId]);

  const triggerHeartConfetti = () => {
    const scalar = 2;
    const heart = confetti.shapeFromPath({ path: 'M167 10c-75.7 0-137 61.3-137 137 0 92.9 124 177.1 137 184.6 13-7.5 137-91.7 137-184.6 0-75.7-61.3-137-137-137z' });

    confetti({
      shapes: [heart],
      particleCount: 30,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e11d48', '#fb7185', '#fda4af'],
      scalar
    });
  };

  const castVote = async () => {
    if (voted) return;
    if (!currentUser) return toast.error("Connectez-vous pour voter.");
    if (currentUser.li < 1) return toast.error("1 Li requis pour voter.");

    const t = toast.loading("Transmission du suffrage...");

    try {
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
        // Effet visuel
        triggerHeartConfetti();

        const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
        history[duelId] = true;
        localStorage.setItem("duel_votes", JSON.stringify(history));
        
        const updatedUser = { ...currentUser, li: currentUser.li - 1 };
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        
        setVoted(true);
        toast.success("Vote pris en compte ! (-1 Li)", { id: t });
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors du vote.", { id: t });
      }
    } catch (e) {
      toast.error("Erreur de connexion au serveur.", { id: t });
    }
  };

  return (
    <button
      onClick={castVote}
      disabled={voted}
      className={`group relative flex items-center gap-3 px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] transition-all ${
        voted 
          ? "bg-teal-500 text-slate-900 cursor-default" 
          : "bg-white/10 text-white hover:bg-rose-600 shadow-xl active:scale-95"
      }`}
    >
      {voted ? <Check size={14} /> : <Heart size={14} className="group-hover:fill-current" />}
      {voted ? "Voté" : "Voter pour ce texte"}
      
      {!voted && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
      )}
    </button>
  );
}

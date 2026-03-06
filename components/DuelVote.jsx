"use client";
import React, { useState, useEffect } from "react";
import { Heart, Check } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function DuelVote({ duelId, targetEmail, currentUser }) {
  const [voted, setVoted] = useState(false);

  // Vérification si l'utilisateur a déjà voté pour ce duel (via LocalStorage)
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
    if (history[duelId]) setVoted(true);
  }, [duelId]);

  // Configuration de l'explosion de confettis en forme de cœur
  const triggerHeartConfetti = () => {
    const scalar = 2;
    const heart = confetti.shapeFromPath({ 
      path: 'M167 10c-75.7 0-137 61.3-137 137 0 92.9 124 177.1 137 184.6 13-7.5 137-91.7 137-184.6 0-75.7-61.3-137-137-137z' 
    });

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
    if (!currentUser) return toast.error("Connectez-vous pour soutenir un auteur.");
    
    // Vérification du coût en Li
    if (currentUser.li < 1) {
      return toast.error("Vous n'avez pas assez de Li (1 Li requis).");
    }

    const t = toast.loading("Enregistrement de votre voix...");

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
        // Succès visuel et sonore (confettis)
        triggerHeartConfetti();

        // Mise à jour de l'historique local pour verrouiller le vote
        const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
        history[duelId] = true;
        localStorage.setItem("duel_votes", JSON.stringify(history));
        
        // Mise à jour immédiate du solde Li dans le cache local
        const updatedUser = { ...currentUser, li: currentUser.li - 1 };
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        
        setVoted(true);
        toast.success("Votre Li a été investi avec succès !", { id: t });
      } else {
        const err = await res.json();
        toast.error(err.error || "L'urne est momentanément fermée.", { id: t });
      }
    } catch (e) {
      toast.error("Erreur de liaison avec l'Arène.", { id: t });
    }
  };

  return (
    <button
      onClick={castVote}
      disabled={voted}
      className={`group relative flex items-center gap-3 px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] transition-all duration-500 shadow-2xl ${
        voted 
          ? "bg-teal-500 text-slate-900 cursor-default scale-100" 
          : "bg-white/10 text-white hover:bg-rose-600 hover:scale-110 active:scale-95 border border-white/5"
      }`}
    >
      {voted ? (
        <Check size={14} className="animate-in zoom-in" />
      ) : (
        <Heart size={14} className="group-hover:fill-current transition-colors" />
      )}
      
      {voted ? "Suffrage Exprimé" : "Voter (1 Li)"}
      
      {!voted && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-[#050505]"></span>
        </span>
      )}
    </button>
  );
}

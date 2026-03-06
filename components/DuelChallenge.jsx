"use client";
import React, { useState } from "react";
import { Sword, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DuelChallenge({ targetUser, currentUser }) {
  const [loading, setLoading] = useState(false);

  const handleSendChallenge = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour défier cette plume.");
    
    // Sécurité : on ne peut pas se défier soi-même
    if (currentUser.email === targetUser.email) {
      return toast.error("Vous ne pouvez pas vous défier vous-même.");
    }

    const confirmChallenge = confirm(`Voulez-vous jeter le gant et défier ${targetUser.penName || targetUser.name} ?`);
    if (!confirmChallenge) return;

    setLoading(true);
    try {
      const res = await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "challenge", // Action cohérente avec l'API duel-engine
          senderEmail: currentUser.email,
          targetEmail: targetUser.email,
          senderName: currentUser.penName || currentUser.name
        })
      });

      if (res.ok) {
        toast.success("Gantelet jeté ! L'honneur est en jeu.");
      } else {
        const data = await res.json();
        toast.error(data.error || "L'adversaire a déjà une demande en attente.");
      }
    } catch (e) {
      toast.error("Erreur de connexion au serveur de l'Arène.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSendChallenge}
      disabled={loading}
      className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-600 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Sword size={16} />
      )}
      Défier en Duel (Gratuit)
    </button>
  );
}

"use client";
import React, { useState } from "react";
import { Sword, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function DuelChallenge({ targetUser, currentUser }) {
  const [loading, setLoading] = useState(false);

  const handleSendChallenge = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour défier cette plume.");
    if (currentUser.li < 250) return toast.error("Il vous faut 250 Li pour lancer un duel.");
    if (currentUser.email === targetUser.email) return toast.error("Vous ne pouvez pas vous défier vous-même.");

    const confirmChallenge = confirm(`Voulez-vous dépenser 250 Li pour défier ${targetUser.penName || targetUser.name} ?`);
    if (!confirmChallenge) return;

    setLoading(true);
    try {
      const res = await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "sendChallenge",
          senderEmail: currentUser.email,
          targetEmail: targetUser.email,
          senderName: currentUser.penName || currentUser.name
        })
      });

      if (res.ok) {
        toast.success("Défi envoyé ! 250 Li réservés.");
        // Mettre à jour le localStorage local pour refléter la baisse de Li
        const updatedUser = { ...currentUser, li: currentUser.li - 250 };
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de l'envoi.");
      }
    } catch (e) {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSendChallenge}
      disabled={loading}
      className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Sword size={16} />}
      Défier en Duel (250 Li)
    </button>
  );
}

"use client";
import React from "react";
import { Check, X, Sword, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function DuelRequests({ requests, currentUser }) {
  const handleResponse = async (challengeId, senderEmail, action) => {
    const toastId = toast.loading(action === 'accept' ? "Acceptation du duel..." : "Refus du défi...");

    try {
      const res = await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'accept' ? "acceptDuel" : "declineChallenge",
          challengeId,
          player1: senderEmail,
          player2: currentUser.email
        })
      });

      if (res.ok) {
        toast.success(action === 'accept' ? "Duel accepté ! Préparez votre plume pour dimanche." : "Défi décliné.", { id: toastId });
        // Plus de débit de Li ici, rechargement simple pour mettre à jour l'interface
        window.location.reload();
      }
    } catch (e) {
      toast.error("Erreur réseau.", { id: toastId });
    }
  };

  if (!requests || requests.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
        <Sword size={14} className="text-rose-500" /> Défis en attente
      </h3>
      {requests.map((req) => (
        <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-teal-200 transition-all">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">{req.senderName} vous défie !</p>
              <Sparkles size={10} className="text-teal-500 animate-pulse" />
            </div>
            <p className="text-[9px] text-teal-600 uppercase font-black tracking-tighter">Honneur & Gloire • Entrée Libre</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleResponse(req.id, req.senderEmail, 'accept')} 
              title="Accepter le duel"
              className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 hover:scale-105 transition-all shadow-lg shadow-teal-500/20"
            >
              <Check size={18} />
            </button>
            <button 
              onClick={() => handleResponse(req.id, req.senderEmail, 'decline')} 
              title="Refuser"
              className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

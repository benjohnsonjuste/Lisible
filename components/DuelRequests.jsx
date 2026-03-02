"use client";
import React from "react";
import { Check, X, Sword } from "lucide-react";
import { toast } from "sonner";

export default function DuelRequests({ requests, currentUser }) {
  const handleResponse = async (challengeId, senderEmail, action) => {
    if (action === 'accept' && currentUser.li < 250) {
      return toast.error("Vous n'avez pas les 250 Li requis pour accepter.");
    }

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
        toast.success(action === 'accept' ? "Duel accepté ! Rendez-vous dimanche." : "Défi décliné.", { id: toastId });
        if (action === 'accept') {
           const updated = { ...currentUser, li: currentUser.li - 250 };
           localStorage.setItem("lisible_user", JSON.stringify(updated));
        }
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
        <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{req.senderName} vous défie !</p>
            <p className="text-[9px] text-slate-400 uppercase font-black">Mise : 250 Li</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleResponse(req.id, req.senderEmail, 'accept')} className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"><Check size={18} /></button>
            <button onClick={() => handleResponse(req.id, req.senderEmail, 'decline')} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"><X size={18} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

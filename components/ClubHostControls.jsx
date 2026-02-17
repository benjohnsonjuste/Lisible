"use client";
import { toast } from "sonner";

export default function ClubHostControls({ liveId }) {
  const terminateLive = async () => {
    // 1. On récupère le contenu final du Relay
    const relayRes = await fetch(`/api/club-relay?action=get-final-data&liveId=${liveId}`);
    const data = await relayRes.json();

    // 2. On sauvegarde tout sur GitHub via ton api/github-db
    const res = await fetch('/api/github-db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'end-live',
        liveId: liveId,
        finalComments: data.comments,
        finalReactions: data.reactions
      })
    });

    if (res.ok) {
      toast.success("Salon archivé sur Lisible !");
      window.location.href = "/club";
    }
  };

  return (
    <button 
      onClick={terminateLive}
      className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-full font-black text-xs transition-all shadow-lg shadow-rose-600/30"
    >
      TERMINER LA DIFFUSION
    </button>
  );
}

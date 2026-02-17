"use client";
import { useEffect, useState } from "react";
import ClubLive from "@/components/ClubLive";
import ClubHostControls from "@/components/ClubHostControls";

export default function LiveRoom({ params }) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = { name: "Anonyme", avatar: "/default.png" }; // À lier à votre session

  useEffect(() => {
    async function getLive() {
      const res = await fetch(`/api/github-db?type=live-sync&id=${params.id}`);
      const data = await res.json();
      if (data && data.content) {
        setLiveData(data.content);
      }
      setLoading(false);
    }
    getLive();
  }, [params.id]);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white font-serif italic">
      <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      Initialisation du flux...
    </div>
  );

  if (!liveData || !liveData.isActive) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center">
      <h2 className="text-3xl font-serif italic mb-4">Ce salon est fermé.</h2>
      <p className="text-slate-400 mb-8">L'hôte a terminé sa diffusion ou le lien est expiré.</p>
      <a href="/club" className="text-blue-500 font-bold uppercase text-xs tracking-widest">Retour au Club</a>
    </div>
  );

  const isHost = currentUser.email === liveData.hostEmail;

  return (
    <div className="h-screen w-full relative">
      <ClubLive liveData={liveData} currentUser={currentUser} />
      
      {/* Contrôles spéciaux si l'utilisateur est l'hôte */}
      {isHost && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[600]">
          <ClubHostControls liveId={liveData.id} />
        </div>
      )}
    </div>
  );
}

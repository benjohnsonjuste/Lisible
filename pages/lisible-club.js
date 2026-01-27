"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Sparkles, ArrowLeft, Share2, Users } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Import dynamique du composant enfant
const LisibleClubComponent = dynamic(() => import("@/components/LisibleClub"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-900 rounded-[3rem] border border-white/5 shadow-2xl">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={32} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500">Connexion au studio...</span>
    </div>
  )
});

export default function ClubPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("lisible_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUser(parsedUser);

      const params = new URLSearchParams(window.location.search);
      const roomFromUrl = params.get("room");

      if (parsedUser) {
        const userRoomId = parsedUser.penName || parsedUser.name || "studio";
        if (roomFromUrl) {
          setRoomId(roomFromUrl);
          setIsHost(roomFromUrl === userRoomId);
        } else {
          setRoomId(userRoomId);
          setIsHost(true);
          const newUrl = `${window.location.pathname}?room=${userRoomId}`;
          window.history.replaceState(null, '', newUrl);
        }
      }
      setLoading(false);
    }
  }, []);

  if (!isMounted || loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 pt-12 pb-28 px-6 rounded-b-[4rem] shadow-2xl relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <button onClick={() => router.back()} className="p-3 bg-white/5 text-white/50 rounded-xl hover:text-white transition-all"><ArrowLeft size={20} /></button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl border border-white/10">
              <Share2 size={16} className="text-teal-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Partager</span>
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-white">
            <div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 w-fit mb-4">
                <Radio size={14} className={isHost ? "animate-pulse" : ""} />
                <span className="text-[9px] font-black uppercase">{isHost ? "Votre Studio" : `Salon de ${roomId}`}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">Lisible <span className="text-teal-500">Club.</span></h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        {/* APPEL DU COMPOSANT ENFANT */}
        <LisibleClubComponent roomId={roomId} isHost={isHost} />
      </div>
    </main>
  );
}

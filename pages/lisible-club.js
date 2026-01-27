"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// 1. Import dynamique du composant lourd sans SSR
const LisibleClub = dynamic(() => import("@/components/LisibleClub"), {
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
      try {
        const storedUser = localStorage.getItem("lisible_user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(parsedUser);

        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get("room");

        if (parsedUser) {
          // Déterminer l'ID du salon (PenName ou ID unique)
          const userRoomId = parsedUser.penName || parsedUser.id || "studio";

          if (roomFromUrl) {
            setRoomId(roomFromUrl);
            // L'utilisateur est hôte si le salon demandé est le sien
            setIsHost(roomFromUrl === userRoomId);
          } else {
            setRoomId(userRoomId);
            setIsHost(true);
          }
        }
      } catch (e) {
        console.error("Erreur d'initialisation du club:", e);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Empêche le mismatch d'hydratation (erreur client-side)
  if (!isMounted) return null;

  // État : Non connecté
  if (!loading && !user) {
    return (
      <div className="max-w-xl mx-auto py-40 px-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
           <Radio size={32} className="text-slate-300" />
        </div>
        <h2 className="text-3xl font-black italic mb-4 text-slate-900">Accès restreint</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Le Club est un espace d'échange en direct. Connectez-vous pour rejoindre les salons ou diffuser votre émission.
        </p>
        <Link href="/login" className="inline-block bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-200">
          Rejoindre le Club
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-700">
      {/* Header Dynamique */}
      <div className="bg-slate-900 pt-12 pb-28 px-6 rounded-b-[4rem] shadow-2xl relative">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="mb-8 p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isHost ? 'border-teal-500/30 bg-teal-500/10 text-teal-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
              <Radio size={14} className={isHost ? "animate-pulse" : ""} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                {isHost ? "Votre Studio" : `Salon de ${roomId}`}
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white italic mb-2 tracking-tighter">Lisible Club.</h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            {isHost 
              ? "Prêt pour le direct ? Vos abonnés recevront une notification dès l'ouverture de l'antenne." 
              : "Installez-vous confortablement. Vous participez à une session en direct."}
          </p>
        </div>
      </div>

      {/* Zone du Studio / Player */}
      <div className="max-w-5xl mx-auto px-4 -mt-16">
        <LisibleClub 
          roomId={roomId} 
          isHost={isHost} 
        />
        
        {isHost && (
          <div className="mt-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 shadow-sm">
            <div className="bg-teal-50 p-4 rounded-2xl">
              <Sparkles className="text-teal-500" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-1">Guide de l'hôte</p>
              <p className="text-xs font-medium text-slate-500 italic leading-relaxed">
                Utilisez le chat pour interagir avec vos auditeurs. Pour une meilleure qualité, utilisez un micro externe.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

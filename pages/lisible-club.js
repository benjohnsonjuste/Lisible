"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Sparkles, ArrowLeft, Share2, Users } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// 1. Import dynamique du composant Studio/Player pour éviter les erreurs SSR
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

  // --- LOGIQUE D'INITIALISATION ---
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== "undefined") {
      try {
        // Récupération de l'utilisateur
        const storedUser = localStorage.getItem("lisible_user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(parsedUser);

        // Lecture de la Room dans l'URL
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get("room");

        if (parsedUser) {
          // L'identifiant unique de l'utilisateur (pour son propre salon)
          const userRoomId = parsedUser.penName || parsedUser.name || "studio";

          if (roomFromUrl) {
            setRoomId(roomFromUrl);
            // On est l'hôte si le nom du salon dans l'URL est le nôtre
            setIsHost(roomFromUrl === userRoomId);
          } else {
            // Par défaut, si pas de room spécifiée, on ouvre son propre studio
            setRoomId(userRoomId);
            setIsHost(true);
            // On met à jour l'URL proprement sans recharger
            const newUrl = `${window.location.pathname}?room=${userRoomId}`;
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
          }
        }
      } catch (e) {
        console.error("Erreur d'initialisation du club:", e);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // --- ACTIONS ---
  const copyShareLink = () => {
    const url = `${window.location.origin}/lisible-club?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien du salon copié ! Partagez-le avec vos lecteurs.");
  };

  // Sécurité hydratation
  if (!isMounted) return null;

  // --- ÉTAT : NON CONNECTÉ ---
  if (!loading && !user) {
    return (
      <div className="max-w-xl mx-auto py-40 px-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
           <Radio size={32} className="text-slate-300" />
        </div>
        <h2 className="text-3xl font-black italic mb-4 text-slate-900">Accès restreint</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Le Club est un espace d'échange en direct réservé aux membres. Connectez-vous pour rejoindre les salons ou diffuser votre émission.
        </p>
        <Link href="/login" className="btn-lisible px-10 shadow-xl shadow-teal-500/20 uppercase text-[10px] tracking-widest">
          Rejoindre le Club
        </Link>
      </div>
    );
  }

  // --- ÉTAT : CHARGEMENT ---
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER NOIR (STYLE STUDIO) */}
      <div className="bg-slate-900 pt-12 pb-28 px-6 rounded-b-[4rem] shadow-2xl relative">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex justify-between items-start mb-8">
            <button 
              onClick={() => router.back()}
              className="p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={copyShareLink}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
              >
                <Share2 size={16} className="text-teal-400" />
                <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">Partager</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isHost ? 'border-teal-500/30 bg-teal-500/10 text-teal-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                  <Radio size={14} className={isHost ? "animate-pulse" : ""} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                    {isHost ? "Votre Studio" : `Salon de ${roomId}`}
                  </span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                Lisible <span className="text-teal-500">Club.</span>
              </h1>
            </div>

            <p className="text-slate-400 text-xs max-w-[280px] leading-relaxed font-medium italic">
              {isHost 
                ? "L'antenne vous appartient. Dès que vous ouvrez le direct, vos abonnés sont prévenus." 
                : "Posez vos questions, envoyez des cœurs et profitez de l'échange en direct."}
            </p>
          </div>
        </div>
      </div>

      {/* ZONE CENTRALE (STUDIO / PLAYER) */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        
        {/* Intégration du composant complexe LisibleClub */}
        <LisibleClub 
          roomId={roomId} 
          isHost={isHost} 
        />
        
        {/* CARTE D'INFO SUPPLÉMENTAIRE (HÔTE) */}
        {isHost && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 shadow-sm">
              <div className="bg-teal-50 p-4 rounded-2xl text-teal-500">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Visibilité</p>
                <p className="text-xs font-bold text-slate-800 leading-relaxed italic">
                  Votre live apparaîtra automatiquement dans le lobby du Club.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 shadow-sm">
              <div className="bg-rose-50 p-4 rounded-2xl text-rose-500">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Interaction</p>
                <p className="text-xs font-bold text-slate-800 leading-relaxed italic">
                  Les lecteurs peuvent réagir en temps réel. Saluez-les !
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

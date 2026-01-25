"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// 1. Import dynamique pour éviter les erreurs de SSR (Serveur Side Rendering) avec Livepeer
const LisibleClub = dynamic(() => import("@/components/LisibleClub"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-900 rounded-[3rem] border border-white/5 shadow-2xl">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={32} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500">Ouverture de l'antenne...</span>
    </div>
  )
});

export default function ClubPage() {
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const initClub = async () => {
      try {
        // 1. Récupérer l'utilisateur connecté
        const storedUser = localStorage.getItem("lisible_user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(parsedUser);

        // 2. Récupérer le nom du salon dans l'URL (?room=...)
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get("room");

        if (parsedUser) {
          if (roomFromUrl) {
            // Cas A : L'utilisateur arrive via un lien de notification
            setRoomId(roomFromUrl);
            // Il est l'hôte uniquement si le nom du salon correspond à son PenName
            setIsHost(roomFromUrl === (parsedUser.penName || parsedUser.id));
          } else {
            // Cas B : L'utilisateur ouvre le club normalement
            // On lui assigne son propre salon par défaut
            const myRoom = parsedUser.penName || parsedUser.id || "studio";
            setRoomId(myRoom);
            setIsHost(true);
          }
        }
      } catch (e) {
        console.error("Erreur d'initialisation du club:", e);
      } finally {
        setLoading(false);
      }
    };

    initClub();
  }, []);

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authentification Club...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-40 px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
           <Radio size={32} className="text-slate-300" />
        </div>
        <h2 className="text-3xl font-black italic mb-4">Accès réservé</h2>
        <p className="text-slate-500 mb-8 text-sm">Connectez-vous pour rejoindre les directs ou diffuser votre propre émission.</p>
        <Link href="/login" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-600 transition-all">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-700">
      {/* Header Sombre */}
      <div className="bg-slate-900 pt-20 pb-28 px-6 rounded-b-[4rem] shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400`}>
              <Radio size={14} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                {isHost ? "Votre Studio" : "Salon de l'auteur"}
              </span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic mb-2 tracking-tighter">Lisible Club.</h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            {isHost 
              ? "Préparez votre micro. En lançant le direct, vos abonnés recevront une notification." 
              : `Vous êtes dans le salon de ${roomId}.`}
          </p>
        </div>
      </div>

      {/* Zone du Lecteur / Diffuseur */}
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
              <p className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-1">Conseil d'hôte</p>
              <p className="text-xs font-medium text-slate-500 italic leading-relaxed">
                Le bouton "Ouvrir l'antenne" déclenche l'envoi des notifications. Assurez-vous d'être prêt à parler !
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

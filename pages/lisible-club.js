"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Import dynamique sans SSR pour Livepeer
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
    
    // Vérification stricte du côté client
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("lisible_user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(parsedUser);

        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get("room");

        if (parsedUser) {
          if (roomFromUrl) {
            setRoomId(roomFromUrl);
            setIsHost(roomFromUrl === (parsedUser.penName || parsedUser.id));
          } else {
            const myRoom = parsedUser.penName || parsedUser.id || "studio";
            setRoomId(myRoom);
            setIsHost(true);
          }
        }
      } catch (e) {
        console.error("Erreur d'initialisation:", e);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Important: On ne rend rien tant que le composant n'est pas monté pour éviter le flash d'erreur
  if (!isMounted) return null;

  // ... (Le reste de votre code JSX est correct et peut être conservé tel quel)

"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LisibleClub from "@/components/LiveSystem"; // Vérifiez le chemin vers votre fichier
import { Loader2 } from "lucide-react";

export default function ClubLivePage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Récupération de la salle via l'URL (ex: ?room=salon1) ou ID par défaut
  const roomId = searchParams.get("room") || "Lisible_Elite_Main";

  useEffect(() => {
    // 2. Récupération de l'utilisateur dans le localStorage
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-teal-500" size={40} />
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, on peut rediriger ou afficher un message
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <p className="font-bold tracking-widest uppercase text-xs">Veuillez vous connecter pour accéder au Club.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête de la page */}
        <div className="mb-8 flex justify-between items-end px-6">
          <div>
            <h1 className="text-white text-3xl font-black italic uppercase tracking-tighter">
              Le Club <span className="text-teal-500">Elite</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
              Expérience Littéraire Immersive
            </p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Connecté en tant que</p>
             <p className="text-white font-bold">{user.penName || user.name}</p>
          </div>
        </div>

        {/* APPEL DU COMPOSANT UNIVERSEL */}
        <LisibleClub 
          roomId={roomId}
          isHost={user.role === 'admin' || user.isAdmin === true} 
          currentUser={user}
        />

        {/* Petit rappel de sécurité */}
        <p className="text-center text-slate-700 text-[9px] font-bold uppercase tracking-widest mt-12">
          Flux chiffré de bout en bout • Protocole WebRTC CoolzCloud
        </p>
      </div>
    </main>
  );
}

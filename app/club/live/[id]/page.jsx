"use client";
import { useEffect, useState } from "react";
import LiveSystem from "@/components/LiveSystem"; // Utilisation de votre nouveau système unifié
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LiveRoom({ params }) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 1. Récupération de l'utilisateur depuis la session locale
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      try { setCurrentUser(JSON.parse(loggedUser)); } catch (e) { console.error(e); }
    }

    // 2. Récupération de l'état du live via l'API dédiée
    async function getLive() {
      try {
        const res = await fetch(`/api/live`);
        const data = await res.json();
        
        // On vérifie si un live est actif et correspond à la roomID
        if (data && data.isActive && data.roomID === params.id) {
          setLiveData(data);
        }
      } catch (e) {
        console.error("Erreur de chargement du live");
      } finally {
        setLoading(false);
      }
    }
    getLive();
  }, [params.id]);

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-serif italic">
      <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Initialisation du flux...</p>
    </div>
  );

  // Si aucun live n'est trouvé ou si le live récupéré ne correspond pas à l'ID de l'URL
  if (!liveData || !liveData.isActive) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
      <h2 className="text-4xl font-black italic tracking-tighter mb-4 text-white">Ce salon est fermé<span className="text-teal-500">.</span></h2>
      <p className="text-slate-400 font-medium text-sm max-w-md mb-10 leading-relaxed">
        L'hôte a terminé sa diffusion, ou le lien est expiré. Les plus belles paroles s'envolent, mais les écrits restent.
      </p>
      <Link href="/club" className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 hover:text-white transition-all">
        Retour au Club
      </Link>
    </div>
  );

  // Vérification de l'hôte (Administrateur du direct)
  const isHost = currentUser && currentUser.email === liveData.admin;

  return (
    <main className="min-h-screen bg-[#FCFBF9]">
      <div className="py-12">
        <LiveSystem 
          currentUser={currentUser} 
          isAdmin={isHost} 
        />
      </div>
    </main>
  );
}

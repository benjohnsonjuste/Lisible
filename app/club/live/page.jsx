"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LisibleClub from "@/components/LiveSystem"; 
import { Loader2 } from "lucide-react";

// 1. On sépare le contenu qui utilise useSearchParams
function LiveContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const roomId = searchParams.get("room") || "Lisible_Elite_Main";

  useEffect(() => {
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

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <p className="font-bold tracking-widest uppercase text-xs text-slate-500">
          Veuillez vous connecter pour accéder au Club.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
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

      <LisibleClub 
        roomId={roomId}
        isHost={true} 
        currentUser={user}
      />
    </div>
  );
}

// 2. La page principale enveloppe le tout dans Suspense
export default function ClubLivePage() {
  return (
    <main className="min-h-screen bg-slate-950 py-10 px-4">
      <Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-slate-950">
          <Loader2 className="animate-spin text-teal-500" size={40} />
        </div>
      }>
        <LiveContent />
      </Suspense>
    </main>
  );
}

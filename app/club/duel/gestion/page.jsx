"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import DuelManager from "@/components/DuelManager"; // Importation du composant centralisé

export default function DuelGestionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const logged = localStorage.getItem("lisible_user");
    if (!logged) return (window.location.href = "/login");
    const currentUser = JSON.parse(logged);

    try {
      // On rafraîchit les données de l'utilisateur (Li, duelRequests, etc.)
      const resUser = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(currentUser.email)}`);
      const userData = await resUser.json();
      
      if (userData.content) {
        setUser(userData.content);
        localStorage.setItem("lisible_user", JSON.stringify(userData.content));
      }
    } catch (e) {
      toast.error("Erreur de synchronisation du profil.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-rose-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER : Bourse et Retour */}
        <header className="flex items-center justify-between">
          <Link href="/club/duel" className="p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ma Bourse</p>
            <div className="flex items-center gap-2 justify-end text-rose-600 font-black text-xl">
              <Coins size={18} /> {user?.li || 0} Li
            </div>
          </div>
        </header>

        {/* TITRE DE LA PAGE */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase">L'Antichambre.</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.3em]">
            Préparez vos combats et gérez vos invitations.
          </p>
        </div>

        {/* COMPOSANT UNIQUE : Gère la recherche, les envois et les réceptions */}
        <div className="pt-4">
          <DuelManager currentUser={user} />
        </div>

      </div>
    </div>
  );
}

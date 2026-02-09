"use client";
import React, { useEffect, useState } from 'react';
import { Coins, BookOpen, TrendingUp, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        // 1. Récupérer l'utilisateur connecté depuis le stockage local
        const loggedUser = localStorage.getItem("lisible_user");
        if (!loggedUser) {
          window.location.href = "/login";
          return;
        }
        
        const { email } = JSON.parse(loggedUser);

        // 2. Charger les données fraîches depuis l'API fusionnée
        const res = await fetch(`/api/github-db?type=user&id=${email}`);
        const data = await res.json();
        
        if (data && data.content) {
          setUser(data.content);
        } else {
          toast.error("Profil introuvable dans le Data Lake");
        }
      } catch (e) {
        console.error("Dashboard Load Error:", e);
        toast.error("Erreur de synchronisation");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Data Lake...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">My Studio.</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              Welcome back, {user.penName || user.name}
            </p>
          </div>
          <Link href="/settings" className="p-3 bg-white rounded-full shadow-sm hover:rotate-90 transition-transform border border-slate-100 text-slate-400 hover:text-teal-600">
            <SettingsIcon size={20} />
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
            <Coins className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform" size={120} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance</p>
            <h2 className="text-5xl font-black italic mt-2">
              {user.li || 0} <span className="text-teal-400 text-2xl">Li</span>
            </h2>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <BookOpen className="text-teal-500 mb-4" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abonnés</p>
            <h2 className="text-4xl font-black italic mt-1">{user.followers?.length || 0}</h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <TrendingUp className="text-amber-500 mb-4" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Following</p>
            <h2 className="text-4xl font-black italic mt-1">{user.following?.length || 0}</h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/publish" className="flex-grow bg-teal-600 text-white text-center py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-teal-700 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-teal-900/10">
            New Publication
          </Link>
          <button 
            onClick={() => toast.info("Fonctionnalité Cash-out bientôt disponible")}
            className="flex-grow bg-white border border-slate-200 text-slate-900 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            Request Cash-out
          </button>
        </div>

        {/* Info Section */}
        <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100">
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">Note du Registre</p>
          <p className="text-sm text-amber-900/70 font-medium leading-relaxed">
            Vos statistiques de vues et de likes sont synchronisées en temps réel avec le Data Lake GitHub. Continuez à partager vos œuvres pour accumuler des Li.
          </p>
        </div>
      </div>
    </div>
  );
}

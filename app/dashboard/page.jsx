"use client";
import React, { useEffect, useState } from 'react';
import { Coins, BookOpen, TrendingUp, Settings as SettingsIcon, Loader2, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const loggedUser = localStorage.getItem("lisible_user");
        if (!loggedUser) {
          window.location.href = "/login";
          return;
        }
        
        const { email } = JSON.parse(loggedUser);

        // Chargement depuis l'API centralisée github-db
        const res = await fetch(`/api/github-db?type=user&id=${email}`);
        const data = await res.json();
        
        if (data && data.content) {
          setUser(data.content);
          // Sync optionnelle du localStorage si les Li ont changé
          localStorage.setItem("lisible_user", JSON.stringify(data.content));
        } else {
          toast.error("Profil introuvable");
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
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accès au Studio...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Espace Auteur</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>
          <Link href="/settings" className="p-4 bg-white rounded-[1.5rem] shadow-sm hover:rotate-90 transition-all border border-slate-100 text-slate-400 hover:text-teal-600">
            <SettingsIcon size={20} />
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 text-white p-10 rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-slate-950/20">
            <Coins className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-700" size={140} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-4">Bourse Actuelle</p>
            <h2 className="text-6xl font-black italic tracking-tighter">
              {user.li || 0} <span className="text-teal-400 text-2xl not-italic ml-1">Li</span>
            </h2>
          </div>
          
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Abonnés</p>
              <h2 className="text-4xl font-black italic mt-1 text-slate-900">{user.followers?.length || 0}</h2>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Influences</p>
              <h2 className="text-4xl font-black italic mt-1 text-slate-900">{user.following?.length || 0}</h2>
            </div>
          </div>
        </div>

        {/* Actions Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/publish" className="flex items-center justify-center gap-3 bg-teal-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-teal-700 transition-all hover:-translate-y-1 shadow-xl shadow-teal-900/10">
            <Plus size={18} />
            Nouvelle Publication
          </Link>
          <Link href="/shop" className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-900 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 transition-all">
            <Coins size={18} className="text-amber-500" />
            Recharger en Li
          </Link>
        </div>

        {/* Note du Data Lake */}
        <div className="p-10 bg-white rounded-[3rem] border border-slate-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Statut du Registre</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              Votre Studio est directement synchronisé avec le Grand Livre de l'Atelier. Vos <span className="text-slate-900 font-bold">Li</span> sont des actifs numériques que vous pouvez transférer ou utiliser pour débloquer des privilèges.
            </p>
          </div>
          <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] pointer-events-none">
            <Sparkles size={200} />
          </div>
        </div>

      </div>
    </div>
  );
}

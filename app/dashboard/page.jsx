"use client";
import React, { useEffect, useState } from 'react';
import { Coins, BookOpen, TrendingUp, Award, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

export default function AuthorDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simuler la récupération de la session utilisateur
    async function loadProfile() {
      const email = "user@lisible.ht"; // À remplacer par la session réelle
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${btoa(email)}.json`, { cache: 'no-store' });
      const data = await res.json();
      setUser(JSON.parse(atob(data.content)));
    }
    loadProfile();
  }, []);

  if (!user) return <div className="p-20 text-center font-black animate-pulse">SYNCING DATA LAKE...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">My Studio.</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Welcome back, {user.penName}</p>
          </div>
          <Link href="/settings" className="p-3 bg-white rounded-full shadow-sm hover:rotate-90 transition-transform">
            <SettingsIcon size={20} />
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
            <Coins className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform" size={120} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance</p>
            <h2 className="text-5xl font-black italic mt-2">{user.wallet?.balance || 0} <span className="text-teal-400 text-2xl">Li</span></h2>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <BookOpen className="text-teal-500 mb-4" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Publications</p>
            <h2 className="text-4xl font-black italic mt-1">{user.stats?.totalTexts || 0}</h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <TrendingUp className="text-amber-500 mb-4" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Views</p>
            <h2 className="text-4xl font-black italic mt-1">{user.stats?.totalViews || 0}</h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/publish" className="flex-grow bg-teal-600 text-white text-center py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-700 transition-colors">
            New Publication
          </Link>
          <button className="flex-grow bg-white border border-slate-200 text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-colors">
            Request Cash-out
          </button>
        </div>
      </div>
    </div>
  );
}

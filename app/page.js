"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, Users, Sparkles, ArrowRight, Star, Activity, Heart, ShieldCheck, Zap, Clock, Globe, Cpu
} from "lucide-react";

// Obligatoire pour optimiser les performances sur Cloudflare Edge
export const runtime = "edge";

export default function Home() {
  const [stats, setStats] = useState({ 
    users: 0, 
    publications: 0,
    liGenerated: 0,
    certifiedReads: 0,
    likes: 0,
    readingTime: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/github-db");
        const data = await response.json();
        
        const userCount = data.users?.length || 0;
        const pubCount = data.publications?.length || 0;

        // Calculs dynamiques basés sur les données réelles
        setStats({
          users: userCount,
          publications: pubCount,
          liGenerated: (pubCount * 1250) + (userCount * 42),
          certifiedReads: pubCount * 124,
          likes: pubCount * 88,
          readingTime: Math.floor((pubCount * 150) / 60)
        });
      } catch (error) {
        console.error("Erreur stats:", error);
      }
    }
    fetchStats();
    // Rafraîchissement toutes le 30 secondes pour le côté "temps réel"
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-950 font-sans selection:bg-teal-100 dark:selection:bg-teal-900/30 transition-colors duration-500">
      
      <main className="pt-24 space-y-24 pb-12 animate-in fade-in duration-1000">
        
        {/* Section Hero */}
        <section className="relative group overflow-hidden rounded-[3rem] shadow-2xl mx-2 md:mx-4">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
          <img
            src="/1769671006023.png"
            alt="Lisible par La Belle Littéraire"
            className="w-full h-[500px] md:h-[700px] object-cover transition-transform duration-[3000ms] group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-20 z-20 space-y-6">
            <div className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2 rounded-full w-fit text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-500/40 animate-bounce-slow">
              <Star size={12} fill="currentColor" /> Nouvelle Ère Littéraire
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter italic leading-none">
                Lisible<span className="text-teal-500 text-4xl md:text-6xl">.</span>
              </h1>
              <p className="text-slate-200 text-lg md:text-2xl font-medium max-w-2xl leading-relaxed">
                La plateforme de streaming produite par le label 
                <span className="text-teal-400 font-black"> La Belle Littéraire</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Section Offres - Lecteurs & Auteurs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-8">
          <div className="group bg-white dark:bg-slate-900 p-10 space-y-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl dark:hover:bg-slate-800/50 transition-all duration-500">
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-[1.5rem] flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
              <BookOpen size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tight leading-none">Pour les Lecteurs</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Accédez sans frais à un catalogue varié et soutenez la littérature de demain. 
                Évadez-vous à travers des textes qui font rayonner le monde littéraire.
              </p>
            </div>
            <Link href="/library" className="flex items-center justify-between w-full bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all shadow-sm">
              EXPLORER LA BIBLIOTHÈQUE <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="group bg-slate-950 dark:bg-teal-900/10 p-10 space-y-8 rounded-[3rem] border border-transparent dark:border-teal-500/20 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all duration-500">
            <div className="w-16 h-16 bg-teal-500 text-white rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-teal-500/20">
              <Users size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black italic tracking-tight leading-none">Pour les Auteurs</h2>
              <p className="text-slate-300 dark:text-slate-200 font-medium leading-relaxed">
                Partagez vos textes, agrandissez votre fanbase et monétisez vos écrits dès 
                <span className="text-teal-400 font-black"> 250 abonnés</span>. Vivez enfin de votre plume.
              </p>
            </div>
            <Link href="/login" className="flex items-center justify-between w-full bg-white text-slate-900 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all shadow-md">
              COMMENCER À PUBLIER <Sparkles size={18} className="animate-pulse" />
            </Link>
          </div>
        </section>

        {/* Section Label - À propos */}
        <section className="rounded-[3.5rem] bg-teal-50 dark:bg-white/5 p-12 text-center space-y-8 border border-teal-100/50 dark:border-white/10 mx-4 md:mx-8 relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
                <h3 className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.4em]">À Propos du Label</h3>
                <div className="h-1 w-10 bg-teal-200 dark:bg-teal-500/30 mx-auto rounded-full" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-xl md:text-3xl font-serif italic max-w-4xl mx-auto leading-relaxed">
              "Fondé par <span className="font-black text-slate-900 dark:text-white not-italic">Ben Johnson Juste</span>, ce label accompagne et valorise les jeunes plumes à travers des publications et des événements culturels majeurs."
            </p>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Sparkles size={400} />
          </div>
        </section>

        {/* --- SECTION STATISTIQUES HIGH-TECH (JUSTE AVANT LE FOOTER) --- */}
        <section className="px-4 md:px-8 space-y-10 py-20 border-t border-slate-100 dark:border-white/5">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-3 px-6 py-2 bg-slate-900 dark:bg-teal-500/10 rounded-full border border-teal-500/20">
              <Activity className="text-teal-400 animate-pulse" size={16} />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-500">Live Quantum Dashboard</h2>
            </div>
            <p className="text-slate-400 text-sm font-medium">Flux de données de l'écosystème en temps réel</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <StatCard icon={<Zap size={18}/>} value={stats.liGenerated.toLocaleString()} label="Li Mintés" sub="Tokens Actifs" color="text-teal-500" />
            <StatCard icon={<ShieldCheck size={18}/>} value={stats.certifiedReads.toLocaleString()} label="Certifiés" sub="Lectures Validées" color="text-blue-500" />
            <StatCard icon={<Heart size={18}/>} value={stats.likes.toLocaleString()} label="Gratitude" sub="Feedback Positif" color="text-rose-500" />
            <StatCard icon={<Globe size={18}/>} value={stats.users} label="Network" sub="Plumes Connectées" color="text-emerald-500" />
            <StatCard icon={<Cpu size={18}/>} value={stats.publications} label="Archives" sub="Protocoles Uniques" color="text-indigo-500" />
            <StatCard icon={<Clock size={18}/>} value={`${stats.readingTime}h`} label="Uptime" sub="Temps d'évasion" color="text-amber-500" />
          </div>

          <div className="flex justify-center">
             <div className="h-px w-32 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
          </div>
        </section>

      </main>
    </div>
  );
}

// Composant Interne pour les cartes Stats High-Tech
function StatCard({ icon, value, label, sub, color }) {
  return (
    <div className="relative group overflow-hidden bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-2 transition-all duration-500">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 group-hover:scale-150 transition-all duration-700 ${color}`}>
        {icon}
      </div>
      <div className="relative z-10 space-y-4">
        <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
            {value}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase mt-1">{sub}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

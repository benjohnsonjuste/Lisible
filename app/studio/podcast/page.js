"use client";
import React, { useState, useEffect } from 'react';
import PodcastStudio from '@/components/PodcastStudio'; 
import { Mic2, ArrowLeft, lock, ShieldCheck, Award } from 'lucide-react';
import Link from 'next/link';

export default function PodcastStudioPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('lisible_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
    setIsAuthLoading(false);
  }, []);

  // Sécurité : Accès restreint strictement à l'administration
  const adminEmails = [
    "cmo.lablitteraire7@gmail.com",
    "benjohnsonjuste@gmail.com",
    "jb7management@gmail.com",
    "adm.lablitteraire7@gmail.com,
    "robergeaurodley97@gmail.com,
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhainiedarha@gmail.com"
  ];

  const isAdmin = adminEmails.includes(currentUser?.email) || currentUser?.role === "admin";

  if (!isAuthLoading && !isAdmin) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
        <div className="max-w-md animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 border border-slate-100">
            <Award size={32} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 mb-4">
            L'Auditorium Privé.
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 font-serif italic">
            "Cet espace est le sanctuaire audio de Lisible, dédié à la création d'émissions littéraires d'exception. L'accès au studio est un privilège réservé aux utilisateurs ayant l'accréditation spéciale Bronze."
          </p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-lg"
          >
            <ArrowLeft size={14} /> Retour au Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group"
          >
            <div className="p-2 rounded-xl group-hover:bg-slate-100 transition-colors">
              <ArrowLeft size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">Retour</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Session Podcast • Studio
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto pt-8 px-4">
        <header className="mb-10 px-4">
          <div className="flex items-center gap-3 mb-2">
             <ShieldCheck size={16} className="text-rose-600" />
             <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em]">Accès Concierge</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900">
            Podcast <span className="text-rose-600">Studio.</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md">
            Interface de gestion audio. Enregistrez, éditez et diffusez les voix qui feront vibrer la plateforme.
          </p>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PodcastStudio currentUser={currentUser} />
        </section>
      </div>
    </main>
  );
}

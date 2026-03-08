"use client";
import React, { useState, useEffect } from 'react';
import PodcastStudio from '@/components/PodcastStudio'; 
import { Mic2, ArrowLeft, Lock, Crown } from 'lucide-react';
import Link from 'next/link';

export default function PodcastStudioPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Liste blanche des administrateurs
  const adminEmails = [
    "cmo.lablitteraire7@gmail.com",
    "benjohnsonjuste@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhainiedarha@gmail.com"
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('lisible_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        // Vérification de l'accès administratif
        if (user && adminEmails.includes(user.email)) {
          setIsAuthorized(true);
        }
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Écran d'accès refusé (Design Class & Épuré)
  if (!isLoading && !isAuthorized) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-16 h-16 bg-rose-50 flex items-center justify-center rounded-2xl text-rose-600 mb-8">
            <Crown size={32} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">
            Espace <span className="text-rose-600">Privé.</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-500 leading-relaxed">
              Bienvenue dans le <span className="font-bold text-slate-800">Studio Podcast de Lisible</span>. 
              Cet espace de création sonore est exclusivement réservé aux auteurs souhaitant donner une dimension audio à leurs œuvres littéraires.
            </p>
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm inline-block">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Accès requis : <span className="text-rose-500 ml-1">Badge d'accréditation Bronze</span>
              </p>
            </div>
          </div>
          <div className="pt-6">
            <Link href="/dashboard" className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center justify-center gap-2 hover:gap-4 transition-all">
              <ArrowLeft size={16} /> Retour au Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Affichage du Studio pour les admins
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
              Studio d'enregistrement
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto pt-8 px-4">
        <header className="mb-10 px-4">
          <div className="flex items-center gap-2 mb-2">
             <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Accréditation Bronze</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900">
            Podcast <span className="text-rose-600">Studio.</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md">
            Transformez vos écrits en récits audio captivants. Enregistrez, éditez et partagez votre voix.
          </p>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PodcastStudio currentUser={currentUser} />
        </section>
      </div>
    </main>
  );
}

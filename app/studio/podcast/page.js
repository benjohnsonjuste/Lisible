"use client";
import React, { useState, useEffect } from 'react';
import PodcastStudio from '@/components/PodcastStudio'; 
import { Mic2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PodcastStudioPage() {
  // Initialisation à null pour éviter le mismatch serveur/client
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Récupération via la clé "lisible_user" pour assurer la cohérence avec le Dashboard
    const savedUser = localStorage.getItem('lisible_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
  }, []);

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
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900">
            Podcast <span className="text-rose-600">Studio.</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md">
            Transformez vos écrits en récits audio captivants. Enregistrez, éditez et partagez votre voix.
          </p>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Le studio reçoit soit l'user, soit null, mais sans erreur de rendu */}
          <PodcastStudio currentUser={currentUser} />
        </section>
      </div>
    </main>
  );
}
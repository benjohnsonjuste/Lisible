"use client";

import React from "react";
import Link from "next/link";
import { 
  BookOpen, Users, Sparkles, ArrowRight, Star 
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-white dark:bg-slate-950 font-sans selection:bg-teal-100 dark:selection:bg-teal-900/30 transition-colors duration-500">
      
      {/* --- CONTENU PRINCIPAL --- */}
      <main className="pt-24 space-y-16 pb-12 animate-in fade-in duration-1000">
        
        {/* Section Hero - Identité Visuelle */}
        <section className="relative group overflow-hidden rounded-[3rem] shadow-2xl mx-2 md:mx-4">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
          <img
            src="/file_00000000e4d871fdb8efbc744979c8bc.png"
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
          {/* Lecteurs */}
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

          {/* Auteurs */}
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
          {/* Filigrane décoratif discret */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Sparkles size={400} />
          </div>
        </section>
      </main>
    </div>
  );
}

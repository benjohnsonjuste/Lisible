// app/page.js
import React from "react";
import Link from "next/link";
import { BookOpen, Users, Sparkles, ArrowRight, Star } from "lucide-react";

// Équivalent de getStaticProps avec revalidate : la page est mise à jour toutes les heures
export const revalidate = 3600; 

export default function Home() {
  return (
    <div className="space-y-16 pb-12 animate-in fade-in duration-1000 font-sans">
      {/* Hero Section - Couverture */}
      <section className="relative group overflow-hidden rounded-[3rem] shadow-2xl mx-2">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10" />
        <img
          src="/file_00000000e4d871fdb8efbc744979c8bc.png"
          alt="Lisible par La Belle Littéraire"
          className="w-full h-[500px] md:h-[600px] object-cover transition-transform duration-[2000ms] group-hover:scale-110"
        />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-20 space-y-6">
          <div className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2 rounded-full w-fit text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20">
            <Star size={12} fill="currentColor" /> Nouvelle Ère Littéraire
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter italic leading-none">
              Lisible<span className="text-teal-500 text-4xl md:text-6xl">.</span>
            </h1>
            <p className="text-slate-200 text-lg md:text-2xl font-medium max-w-2xl leading-relaxed font-sans">
              La plateforme de streaming produite par le label 
              <span className="text-teal-400 font-black"> La Belle Littéraire</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Grid de Présentation */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {/* Lecteurs */}
        <div className="group bg-white p-10 space-y-8 rounded-[3rem] border-none ring-1 ring-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-500">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-[1.5rem] flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-500">
            <BookOpen size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tight leading-none">Pour les Lecteurs</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Accédez sans frais à un catalogue varié et soutenez la littérature de demain. 
              Évadez-vous à travers des textes qui stimulent l'imaginaire.
            </p>
          </div>
          <Link href="/bibliotheque" className="flex items-center justify-between w-full bg-slate-50 text-slate-900 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all shadow-sm">
            EXPLORER LA BIBLIOTHÈQUE <ArrowRight size={18} />
          </Link>
        </div>

        {/* Auteurs */}
        <div className="group bg-slate-900 p-10 space-y-8 rounded-[3rem] border-none text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all duration-500">
          <div className="w-16 h-16 bg-teal-500 text-white rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Users size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black italic tracking-tight leading-none">Pour les Auteurs</h2>
            <p className="text-slate-300 font-medium leading-relaxed">
              Partagez vos textes, agrandissez votre fanbase et monétisez vos écrits dès 
              <span className="text-teal-400 font-black"> 250 abonnés</span>. Vivez enfin de votre plume.
            </p>
          </div>
          <Link href="/login" className="flex items-center justify-between w-full bg-white text-slate-900 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all shadow-md">
            COMMENCER À PUBLIER <Sparkles size={18} />
          </Link>
        </div>
      </section>

      {/* Section Label */}
      <section className="rounded-[3.5rem] bg-teal-50 p-12 text-center space-y-8 border border-teal-100/50 mx-4">
        <div className="space-y-2">
            <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em]">À Propos du Label</h3>
            <div className="h-1 w-10 bg-teal-200 mx-auto rounded-full" />
        </div>
        <p className="text-slate-700 text-xl md:text-2xl font-serif italic max-w-3xl mx-auto leading-relaxed">
          "Fondé par <span className="font-black text-slate-900 not-italic">Ben Johnson Juste</span>, ce label accompagne et valorise les jeunes plumes à travers des publications et des événements culturels majeurs à l'échelle internationale."
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-6">
          <div className="text-center">
            <p className="text-3xl font-black text-slate-900">250+</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abonnés pour monétiser</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-teal-200" />
          <div className="text-center">
            <p className="text-3xl font-black text-slate-900">Gratuit</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accès Lecteur</p>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="text-center py-12 space-y-6">
        <div className="flex justify-center gap-4">
            <div className="h-px w-12 bg-slate-200 self-center" />
            <Sparkles className="text-teal-500/30" size={20} />
            <div className="h-px w-12 bg-slate-200 self-center" />
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">
          Lisible par La Belle Littéraire • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

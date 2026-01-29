"use client";
import Link from "next/link";
import { BookOpen, Users, Sparkles, ArrowRight, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section - Couverture */}
      <section className="relative group overflow-hidden rounded-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
        <img
          src="/file_00000000e4d871fdb8efbc744979c8bc.png"
          alt="Lisible par La Belle Littéraire"
          className="w-full h-[500px] object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 space-y-4">
          <div className="flex items-center gap-2 bg-teal-500 text-white px-4 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-[0.2em]">
            <Star size={12} fill="currentColor" /> Nouvelle Ère Littéraire
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Lisible.
          </h1>
          <p className="text-slate-200 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
            La plateforme de streaming produite par le label 
            <span className="text-teal-400 font-black"> La Belle Littéraire</span>.
          </p>
        </div>
      </section>

      {/* Grid de Présentation */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lecteurs */}
        <div className="card-lisible bg-white p-10 space-y-6 border-none ring-1 ring-slate-100 shadow-xl shadow-slate-200/50">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <BookOpen size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 italic">Pour les Lecteurs</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Accédez sans frais à un catalogue varié et soutenez la littérature de demain. 
            Évadez-vous à travers des textes qui stimulent l'imaginaire et enrichissent votre vocabulaire.
          </p>
          <Link href="/bibliotheque" className="btn-lisible w-full justify-between">
            EXPLORER LA BIBLIOTHÈQUE <ArrowRight size={18} />
          </Link>
        </div>

        {/* Auteurs */}
        <div className="card-lisible bg-slate-900 p-10 space-y-6 border-none text-white shadow-xl shadow-slate-300">
          <div className="w-14 h-14 bg-teal-500 text-white rounded-2xl flex items-center justify-center">
            <Users size={28} />
          </div>
          <h2 className="text-2xl font-black italic">Pour les Auteurs</h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            Partagez vos textes, agrandissez votre fanbase et monétisez vos écrits dès 
            <span className="text-teal-400 font-black"> 250 abonnés</span>. Gagnez en visibilité et vivez de votre plume.
          </p>
          <Link href="/login" className="btn-lisible w-full bg-white text-slate-900 hover:bg-teal-500 hover:text-white justify-between">
            COMMENCER À PUBLIER <Sparkles size={18} />
          </Link>
        </div>
      </section>

      {/* Section Label */}
      <section className="card-lisible border-none bg-teal-50 p-10 text-center space-y-6">
        <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em]">À Propos du Label</h3>
        <p className="text-slate-700 text-lg font-serif italic max-w-2xl mx-auto leading-relaxed">
          "Fondé par <span className="font-black text-slate-900 not-italic">Ben Johnson Juste</span>, ce label accompagne et valorise les jeunes plumes à travers des publications et des événements culturels majeurs à l'échelle internationale."
        </p>
        <div className="flex justify-center gap-6 pt-4">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">250+</p>
            <p className="text-[10px] font-black text-slate-400 uppercase">Abonnés pour monétiser</p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">Gratuit</p>
            <p className="text-[10px] font-black text-slate-400 uppercase">Accès Lecteur</p>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="text-center space-y-4">
        <div className="h-px w-20 bg-slate-200 mx-auto" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Lisible par La Belle Littéraire
        </p>
      </footer>
    </div>
  );
}

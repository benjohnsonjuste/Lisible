// app/page.js
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, Users, Sparkles, ArrowRight, Star, 
  MapPin, Copyright, Heart, Phone 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Accueil", href: "/" },
    { name: "Bibliothèque", href: "/texts" },
    { name: "Publier", href: "/publish" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-teal-100">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6 transition-all">
        <Link 
          href="/" 
          className="text-2xl font-black italic tracking-tighter text-slate-900 hover:opacity-80 transition-opacity"
        >
          Lisible<span className="text-teal-600">.</span>
        </Link>

        <nav className="flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                  isActive 
                    ? "text-teal-600" 
                    : "text-slate-400 hover:text-slate-900"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* --- CONTENU PRINCIPAL --- */}
      <main className="pt-24 space-y-16 pb-12 animate-in fade-in duration-1000">
        
        {/* Hero Section */}
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
              <p className="text-slate-200 text-lg md:text-2xl font-medium max-w-2xl leading-relaxed">
                La plateforme de streaming produite par le label 
                <span className="text-teal-400 font-black"> La Belle Littéraire</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Grid de Présentation */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          <div className="group bg-white p-10 space-y-8 rounded-[3rem] border-none ring-1 ring-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-500">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-[1.5rem] flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-500">
              <BookOpen size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 italic tracking-tight leading-none">Pour les Lecteurs</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Accédez sans frais à un catalogue varié et soutenez la littérature de demain.
              </p>
            </div>
            <Link href="/texts" className="flex items-center justify-between w-full bg-slate-50 text-slate-900 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all shadow-sm">
              EXPLORER LA BIBLIOTHÈQUE <ArrowRight size={18} />
            </Link>
          </div>

          <div className="group bg-slate-900 p-10 space-y-8 rounded-[3rem] border-none text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all duration-500">
            <div className="w-16 h-16 bg-teal-500 text-white rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Users size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black italic tracking-tight leading-none">Pour les Auteurs</h2>
              <p className="text-slate-300 font-medium leading-relaxed">
                Partagez vos textes et monétisez vos écrits dès 
                <span className="text-teal-400 font-black"> 250 abonnés</span>.
              </p>
            </div>
            <Link href="/publish" className="flex items-center justify-between w-full bg-white text-slate-900 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all shadow-md">
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
            "Fondé par <span className="font-black text-slate-900 not-italic">Ben Johnson Juste</span>, ce label accompagne et valorise les jeunes plumes..."
          </p>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="relative bg-white pt-20 pb-10 border-t border-slate-50 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">
                Lisible<span className="text-teal-600">.</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Streaming Littéraire</p>
            </div>
            <div className="h-10 w-[1px] bg-slate-100" />
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">Une production de <span className="text-slate-900 font-bold">La Belle Littéraire</span></p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold tracking-wide uppercase">
                  <MapPin size={14} className="text-teal-500" /> 22 RUE A. LAZARRE, DELMAS, HAÏTI
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold tracking-wide">
                  <Phone size={14} className="text-teal-500" /> (509) 4352 4498
                </div>
              </div>
            </div>
            <div className="pt-10 w-full border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <Copyright size={12} /> {currentYear} Lisible — Tous droits réservés
              </div>
              <nav className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Link href="/terms" className="hover:text-slate-900">CGU</Link>
                <Link href="/confidentialite" className="hover:text-slate-900">Confidentialité</Link>
                <Link href="/refund" className="hover:text-slate-900">Remboursement</Link>
              </nav>
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Fait avec <Heart size={12} className="text-pink-500 fill-pink-500" /> pour les mots
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

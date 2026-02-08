"use client";
import React from "react";
import WorkForm from "@/components/WorkForm";
import { Sparkles } from "lucide-react";

export default function PublierPage() {
  return (
    <div className="min-h-screen bg-[#FCFBF9] py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4 border border-amber-100">
            <Sparkles size={14} /> Espace Créateur
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-slate-900 leading-none">
            Libérez votre <br /><span className="text-teal-600">Plume</span>
          </h1>
          <p className="mt-6 text-slate-500 font-serif italic text-lg">
            Votre manuscrit sera instantanément indexé dans la bibliothèque Lisible.
          </p>
        </header>

        <div className="bg-white p-2 rounded-[3rem] shadow-2xl shadow-slate-200/50">
          <div className="bg-[#FCFBF9] border border-slate-50 rounded-[2.5rem] p-8 md:p-12">
            {/* Ajout explicite de la route API pour MongoDB */}
            <WorkForm 
              submitLabel="Publier l'œuvre" 
              isConcours={false} 
              onSubmitApi="/api/texts" 
            />
          </div>
        </div>
        
        <footer className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
          Lisible.biz • Protection des droits d'auteur active
        </footer>
      </div>
    </div>
  );
}

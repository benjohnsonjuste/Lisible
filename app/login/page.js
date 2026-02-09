"use client";
import React, { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 selection:bg-teal-100 font-sans">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
        
        {/* LOGO OFFICIEL LISIBLE */}
        <div className="flex flex-col items-center mb-10 group">
          <div className="relative">
            {/* Effet d'aura derrière le logo */}
            <div className="absolute inset-0 bg-teal-400 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full" />
            
            <img 
              src="/icon-192.png" 
              alt="Lisible Logo" 
              className="w-24 h-24 rounded-[2.5rem] shadow-2xl relative z-10 transform transition-all group-hover:scale-105 group-hover:rotate-2 duration-500 object-cover border-4 border-white"
            />
          </div>
          
          <div className="mt-6 text-center">
            <h1 className="text-5xl font-black text-slate-950 tracking-tighter italic leading-none">
              Lisible.
            </h1>
            <p className="text-teal-600 font-black text-[10px] uppercase tracking-[0.5em] mt-3">
              Streaming Littéraire
            </p>
          </div>
        </div>

        {/* CONTENEUR FORMULAIRE */}
        <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 p-8 md:p-12 relative overflow-hidden">
          {/* Décoration subtile en arrière-plan */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-slate-50 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10">
            {/* Suspense requis car AuthForm utilise useSearchParams() */}
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-[3px] border-slate-100 border-t-teal-500 rounded-full animate-spin" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
                  Préparation du pupitre...
                </p>
              </div>
            }>
              <AuthForm />
            </Suspense>
          </div>

          <footer className="mt-10 pt-8 border-t border-slate-100 text-center relative z-10">
            <p className="text-slate-400 font-medium text-[11px] leading-relaxed">
              Prêt à explorer la nouvelle ère de l'écrit ? <br/>
              <span className="text-slate-900 font-black italic uppercase text-[9px] tracking-widest mt-1 block">
                Rejoignez le sanctuaire.
              </span>
            </p>
          </footer>
        </div>

        {/* FOOTER BAS DE PAGE */}
        <div className="mt-12 px-8 text-center space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="h-[1px] w-8 bg-slate-200" />
            <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.6em] leading-relaxed">
              Propulsé par La Belle Littéraire
            </p>
          </div>
          <p className="text-slate-400 text-[11px] font-medium leading-relaxed italic opacity-70 max-w-[280px] mx-auto">
            "Vivez la littérature de demain dès aujourd'hui."
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";
import AuthForm from "@/components/AuthForm";
import { Sparkles } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Symbole de marque Lisible */}
        <div className="flex justify-center mb-10">
          <div className="bg-teal-600 p-4 rounded-[1.5rem] shadow-2xl shadow-teal-200 rotate-3 transition-transform hover:rotate-0 duration-500">
            <Sparkles size={36} className="text-white" />
          </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] border border-slate-50 p-8 md:p-12 relative overflow-hidden">
          {/* Accent visuel en arrière-plan */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          
          <header className="text-center mb-10 relative z-10">
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter italic">
              Lisible.
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              L'écriture en streaming
            </p>
          </header>

          <div className="relative z-10">
            <AuthForm />
          </div>

          <footer className="mt-10 pt-8 border-t border-slate-50 text-center relative z-10">
            <p className="text-slate-500 font-medium text-sm">
              Nouveau sur la plateforme ? <br/>
              <span className="text-teal-600 font-black italic">Créez votre compte en un clic.</span>
            </p>
          </footer>
        </div>

        {/* Note de bas de page légale/éthique */}
        <div className="mt-10 px-8 text-center space-y-4">
          <p className="text-slate-300 text-[9px] font-black uppercase tracking-widest leading-relaxed">
            Propulsé par le label La Belle Littéraire
          </p>
          <p className="text-slate-400 text-xs font-medium leading-relaxed italic opacity-70">
            En vous connectant, vous acceptez la publication de vos écrits dans notre catalogue ouvert géré via GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}

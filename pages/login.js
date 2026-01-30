"use client";
import AuthForm from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-[95vh] flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* LOGO OFFICIEL LISIBLE */}
        <div className="flex flex-col items-center mb-10 group">
          <div className="relative">
            {/* Effet d'aura derrière le logo pour le côté "Metaverse" */}
            <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
            
            <img 
              src="/icon-192.png" 
              alt="Lisible Logo" 
              className="w-24 h-24 rounded-[2.5rem] shadow-2xl relative z-10 transform transition-transform group-hover:scale-105 duration-500 object-cover border-4 border-white"
            />
          </div>
          
          <div className="mt-6 text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">
              Lisible.
            </h1>
            <p className="text-teal-600 font-black text-[9px] uppercase tracking-[0.4em] mt-2">
              Streaming Littéraire & Metaverse
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] border border-slate-50 p-8 md:p-12 relative overflow-hidden">
          {/* Décoration subtile en arrière-plan */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-50 rounded-full blur-3xl opacity-60" />
          
          <div className="relative z-10">
            <AuthForm />
          </div>

          <footer className="mt-10 pt-8 border-t border-slate-50 text-center relative z-10">
            <p className="text-slate-400 font-medium text-xs leading-relaxed">
              Prêt à explorer la nouvelle ère de l'écrit ? <br/>
              <span className="text-slate-900 font-black italic uppercase text-[10px] tracking-wider">Rejoignez l'avant-garde.</span>
            </p>
          </footer>
        </div>

        {/* Note de bas de page */}
        <div className="mt-12 px-8 text-center space-y-4">
          <p className="text-slate-300 text-[8px] font-black uppercase tracking-[0.5em] leading-relaxed">
            Propulsé par La Belle Littéraire
          </p>
          <p className="text-slate-400 text-[10px] font-medium leading-relaxed italic opacity-60 max-w-[280px] mx-auto">
            "Le futur de la poésie ne se lit pas seulement, il s'habite."
          </p>
        </div>
      </div>
    </div>
  );
}

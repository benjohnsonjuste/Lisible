"use client";
import { Mic, Video, Sparkles, Bell, ArrowRight } from "lucide-react";

export default function LisibleClubClosed() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-6 animate-in fade-in duration-1000">
      {/* Illustration Iconique */}
      <div className="relative mb-10">
        <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-200 rotate-12 shadow-xl shadow-slate-200/50 border border-slate-50">
          <Video size={48} />
        </div>
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-teal-500 rounded-[2rem] flex items-center justify-center text-white -rotate-12 border-8 border-slate-50 shadow-lg">
          <Mic size={32} />
        </div>
        <div className="absolute -top-4 -left-4 p-3 bg-amber-400 rounded-2xl text-white animate-bounce shadow-lg">
          <Sparkles size={20} />
        </div>
      </div>

      <h2 className="text-4xl font-black text-slate-900 mb-4 italic tracking-tighter">
        Le micro est à vous<span className="text-teal-600">.</span>
      </h2>
      
      <p className="text-slate-500 max-w-sm mb-12 font-medium leading-relaxed italic">
        Aucune session n'est en cours. C'est le moment idéal pour lancer votre propre direct et partager votre plume.
      </p>

      {/* Grid de Statut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-8">
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center group hover:border-teal-200 transition-all">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Opportunité</span>
          <p className="text-sm font-black text-slate-900 italic">Audience disponible</p>
        </div>
        
        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col items-center shadow-2xl shadow-slate-900/20 group hover:bg-slate-800 transition-all">
          <div className="w-10 h-10 bg-white/10 text-teal-400 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
            <Bell size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Alerte Communauté</span>
          <p className="text-sm font-black italic">Push notification actif</p>
        </div>
      </div>

      {/* Bouton d'action pour remonter vers le composant LisibleClub qui contient le bouton Start */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex items-center gap-3 text-teal-600 font-black text-[10px] uppercase tracking-[0.3em] hover:gap-5 transition-all"
      >
        Lancer mon direct maintenant <ArrowRight size={16} />
      </button>
    </div>
  );
}

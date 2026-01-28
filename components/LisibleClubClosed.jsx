"use client";
import { Lock, Sparkles, ArrowRight, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LisibleClubClosed() {
  const handleNotify = () => {
    toast.success("C'est noté ! Vous serez parmi les premiers informés.");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-[3.5rem] p-10 md:p-16 shadow-2xl shadow-slate-200 border border-slate-50 relative overflow-hidden text-center"
      >
        {/* Background Decorative Element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-50 rounded-full blur-3xl opacity-50" />
        
        {/* Badge "Prochainement" */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">
          <Sparkles size={12} className="text-amber-400" />
          Coming Soon
        </div>

        {/* Icone de verrouillage moderne */}
        <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-teal-100/30 rounded-full animate-ping" />
          <div className="relative z-10 w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-teal-600 border border-teal-50">
            <Lock size={32} />
          </div>
        </div>

        {/* Texte principal */}
        <h2 className="text-4xl font-black italic text-slate-900 mb-4 tracking-tighter">
          Lisible<span className="text-teal-600">Club</span>
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm md:text-base">
          Notre cercle privé de lecteurs et d'auteurs premium peaufine ses derniers détails. 
          L'accès est actuellement <span className="text-slate-900 font-bold">fermé au public</span>.
        </p>

        {/* Boutons d'action */}
        <div className="space-y-4">
          <button 
            onClick={handleNotify}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-teal-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            <Bell size={16} /> Être informé de l'ouverture
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-slate-50 text-slate-400 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:text-slate-600 border border-transparent hover:border-slate-100 transition-all"
          >
            Retourner à la bibliothèque <ArrowRight size={16} />
          </button>
        </div>

        {/* Footer du composant */}
        <div className="mt-12 pt-8 border-t border-slate-50">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Exclusivité La Belle Littéraire
          </p>
        </div>
      </motion.div>
    </div>
  );
}

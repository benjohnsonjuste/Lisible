"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Sparkles, ArrowLeft, Share2, Lock, Bell, Construction } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem("lisible_user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setLoading(false);
  }, []);

  const handleNotify = () => {
    toast.success("C'est noté ! Vous recevrez une invitation prioritaire.", {
      icon: <Sparkles className="text-amber-500" size={16} />,
      style: { borderRadius: '20px', fontWeight: 'bold' }
    });
  };

  if (!isMounted || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Header sombre existant gardé pour la cohérence visuelle */}
      <div className="bg-slate-900 pt-12 pb-28 px-6 rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        {/* Effet de lumière High-Tech en fond */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-between items-start mb-8">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-white/5 text-white/50 rounded-xl hover:text-white transition-all border border-white/10"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Construction size={16} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Maintenance</span>
            </div>
          </div>

          <div className="flex flex-col text-white">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 w-fit mb-4">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-300">Expérience Premium</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">
              Lisible <span className="text-teal-500">Club.</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Remplacement du composant Studio par le message de fermeture */}
      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-200 border border-slate-50 text-center"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
            <Lock className="text-slate-900" size={32} />
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Accès limité au Studio</h2>
          
          <p className="text-slate-500 font-medium leading-relaxed mb-10 max-w-md mx-auto">
            Le <span className="text-slate-900 font-bold italic">Lisible Club</span> est actuellement en cours de reconfiguration pour vous offrir une expérience de streaming littéraire inédite.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleNotify}
              className="group flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Bell size={18} className="group-hover:animate-swing" />
              Rejoindre la liste d'attente
            </button>
            
            <button 
              onClick={() => router.push('/bibliotheque')}
              className="flex items-center justify-center gap-3 bg-white text-slate-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              Retour à la Bibliothèque
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-2">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-teal-100 animate-pulse" />
                  </div>
                ))}
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Déjà <span className="text-teal-600">42 plumes</span> attendent l'ouverture
             </p>
          </div>
        </motion.div>

        {/* Note de pied de page pour le style */}
        <p className="text-center mt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Lancement prévu : Printemps 2026
        </p>
      </div>
    </main>
  );
}

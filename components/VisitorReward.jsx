"use client";
import React, { useState, useEffect } from "react";
import { Sparkles, Gift, ArrowRight, X, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function VisitorReward() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [tempBalance, setTempBalance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    // 1. Vérifier si l'utilisateur est déjà connecté
    const isLogged = localStorage.getItem("lisible_user");
    if (isLogged) return; // Ne rien afficher pour les membres

    // 2. Charger le solde temporaire existant
    const saved = localStorage.getItem("lisible_guest_li") || "0";
    setTempBalance(parseInt(saved));

    // 3. Lancer le timer de récompense après 5 secondes de présence
    const timer = setTimeout(() => {
      setIsVisible(true);
      startReadingProgress();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const startReadingProgress = () => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        handleReward();
      }
    }, 300); // 100 * 300ms = 30 secondes de lecture requises
  };

  const handleReward = () => {
    const bonus = 10;
    const newTotal = tempBalance + bonus;
    localStorage.setItem("lisible_guest_li", newTotal);
    setTempBalance(newTotal);
    setIsClaimed(true);
    toast.success(`+${bonus} Li ! Votre coffre de visiteur se remplit.`, {
        icon: <Coins className="text-amber-500" />
    });
  };

  if (!isVisible && tempBalance === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 max-w-[280px] overflow-hidden relative group">
        
        {/* Barre de progression de lecture */}
        {!isClaimed && progress < 100 && (
          <div className="absolute top-0 left-0 h-1 bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Gift className="text-amber-500" size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coffre Visiteur</p>
                <p className="text-xl font-black italic tracking-tighter">{tempBalance} Li cumulés</p>
              </div>
            </div>
            <button onClick={() => setIsVisible(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {!isClaimed ? (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Continuez votre lecture pour gagner des <span className="text-white font-bold">Li</span> gratuitement.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-teal-400 font-bold leading-tight animate-pulse">
                ✨ Ces Li sont à vous ! Inscrivez-vous pour les utiliser sur la plateforme.
              </p>
              <button 
                onClick={() => router.push("/login")}
                className="w-full py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-teal-400 transition-all active:scale-95 shadow-lg"
              >
                Réclamer mon trésor <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

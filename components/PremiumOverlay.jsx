"use client";
import { Lock, Zap } from "lucide-react";

export default function PremiumOverlay({ price, onUnlock, userLi }) {
  const canAfford = userLi >= price;

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center bg-white/50 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80 -z-10" />
      
      <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
        <Lock size={28} />
      </div>

      <h3 className="font-black text-2xl text-slate-900 mb-2 uppercase tracking-tighter">
        Œuvre Exclusive
      </h3>
      
      <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
        L'auteur a choisi de réserver ce texte à ses mécènes. Soutenez la création pour accéder à l'intégralité.
      </p>

      <button
        onClick={onUnlock}
        disabled={!canAfford}
        className={`flex items-center gap-3 mx-auto px-8 py-4 rounded-2xl font-black transition-all ${
          canAfford 
          ? "bg-slate-900 text-white hover:bg-rose-600 scale-105" 
          : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={canAfford ? "fill-yellow-400 text-yellow-400" : ""} />
        DÉBLOQUER POUR {price} LI
      </button>

      {!canAfford && (
        <p className="mt-4 text-[10px] font-bold text-rose-500 uppercase tracking-widest">
          Solde insuffisant (Il vous manque {price - userLi} Li)
        </p>
      )}
    </div>
  );
}

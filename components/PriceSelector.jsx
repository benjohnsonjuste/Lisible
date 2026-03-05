"use client";
import { Unlock, Zap, Gem, Crown } from "lucide-react";

export default function PriceSelector({ price, setPrice }) {
  const options = [
    { label: "Gratuit", value: 0, icon: <Unlock size={18} />, desc: "Visibilité maximale" },
    { label: "Privilège", value: 25, icon: <Zap size={18} />, desc: "Contenu spécial (25 Li)" },
    { label: "Prestige", value: 50, icon: <Gem size={18} />, desc: "Œuvre majeure (50 Li)" },
    { label: "Légende", value: 100, icon: <Crown size={18} />, desc: "Exclusivité totale (100 Li)" }
  ];

  return (
    <div className="bg-slate-900 text-white p-8 rounded-[3rem] border border-white/10 my-10 shadow-2xl">
      <div className="flex items-center gap-3 mb-8 ml-2">
        <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
          Valeur de l'œuvre
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPrice(opt.value)}
            className={`flex flex-col items-center text-center p-6 rounded-[2.5rem] border-2 transition-all duration-300 ${
              price === opt.value 
              ? "bg-white text-slate-900 border-white scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
              : "bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className={`p-4 rounded-2xl mb-4 ${price === opt.value ? "bg-rose-600 text-white" : "bg-white/10 text-slate-300"}`}>
              {opt.icon}
            </div>
            
            <span className="font-black text-xs uppercase tracking-widest mb-1">
              {opt.label}
            </span>
            
            <span className={`text-[10px] font-medium opacity-60`}>
              {opt.value > 0 ? `${opt.value} Li` : opt.desc}
            </span>
          </button>
        ))}
      </div>

      {price > 0 && (
        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-4 animate-in zoom-in-95">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">
            🔥 L'auteur percevra {price} Li par lecteur • Accès sécurisé
          </p>
        </div>
      )}
    </div>
  );
}

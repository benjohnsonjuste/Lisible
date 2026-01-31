"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Coins, Zap, Trophy, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);

  const packs = [
    {
      id: "pack_starter",
      name: "Pack Curieux",
      amount: 4000,
      price: "2.00",
      description: "Idéal pour soutenir vos 5 premiers auteurs.",
      icon: <Zap className="text-teal-500" />,
      color: "border-slate-100",
      popular: false
    },
    {
      id: "pack_fan",
      name: "Pack Mécène",
      amount: 10000,
      price: "4.50", // Petite réduction pour inciter à l'achat groupé
      description: "Le choix favori de la communauté Lisible.",
      icon: <Sparkles className="text-amber-500" />,
      color: "border-amber-200 bg-amber-50/30",
      popular: true
    },
    {
      id: "pack_legend",
      name: "Pack Fondateur",
      amount: 25000,
      price: "10.00",
      description: "Devenez un pilier majeur pour nos écrivains.",
      icon: <Trophy className="text-rose-500" />,
      color: "border-slate-900 bg-slate-900 text-white",
      popular: false
    }
  ];

  const handlePurchase = async (pack) => {
    setLoading(pack.id);
    // Simulation du processus de paiement
    setTimeout(() => {
      toast.success(`Paiement de ${pack.price}$ réussi !`, {
        description: `${pack.amount} Li ont été ajoutés à votre coffre.`
      });
      setLoading(null);
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 min-h-screen animate-in fade-in duration-700">
      <header className="flex items-center justify-between mb-16">
        <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900">Banque de Li</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Propulsez la littérature</p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-amber-100 rounded-full text-amber-600">
           <Coins size={20} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packs.map((pack) => (
          <div 
            key={pack.id}
            className={`relative p-8 rounded-[3rem] border-2 transition-all duration-500 flex flex-col ${pack.color} ${pack.popular ? 'scale-105 shadow-2xl shadow-amber-200' : 'hover:shadow-xl'}`}
          >
            {pack.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg">
                Le plus prisé
              </span>
            )}

            <div className="mb-8 p-5 bg-white rounded-[1.5rem] w-fit shadow-inner">
              {pack.icon}
            </div>

            <h3 className={`text-xl font-black italic mb-2 ${pack.id === 'pack_legend' ? 'text-white' : 'text-slate-900'}`}>
              {pack.name}
            </h3>
            <p className={`text-xs font-medium mb-8 leading-relaxed ${pack.id === 'pack_legend' ? 'text-slate-400' : 'text-slate-400'}`}>
              {pack.description}
            </p>

            <div className="mt-auto pt-8 border-t border-slate-100/10">
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-black ${pack.id === 'pack_legend' ? 'text-white' : 'text-slate-900'}`}>
                  {pack.amount}
                </span>
                <span className="text-xs font-black uppercase tracking-widest opacity-50">Li</span>
              </div>

              <button
                disabled={loading}
                onClick={() => handlePurchase(pack)}
                className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  pack.id === 'pack_legend' 
                  ? 'bg-white text-slate-900 hover:bg-teal-400 hover:text-white' 
                  : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl shadow-slate-200'
                }`}
              >
                {loading === pack.id ? <Loader2 className="animate-spin" size={14} /> : `Acheter pour ${pack.price}$`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-20 p-10 rounded-[3rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center gap-8">
          <div className="p-6 bg-white rounded-full shadow-inner text-teal-500">
             <ShieldCheck size={40} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Transactions Sécurisées</h4>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Vos Li sont instantanément crédités sur votre compte après validation. 
              Chaque achat soutient directement l'infrastructure de <strong>Lisible.biz</strong> et permet de maintenir un taux de retrait équitable pour les auteurs.
            </p>
          </div>
      </section>
    </div>
  );
}

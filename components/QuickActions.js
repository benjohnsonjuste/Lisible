"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { PenTool, User, Coins, ChevronRight, Sparkles } from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Nouvelle œuvre",
      description: "Publiez et accumulez des Li",
      icon: <PenTool size={22} />,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      href: "/publish",
    },
    {
      title: "Portefeuille",
      description: "Gérez vos gains et vos Li",
      icon: <Coins size={22} />,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/analytics", // Redirige vers la page de stats/retrait
      isPremium: true
    },
    {
      title: "Mon Profil",
      description: "Gérez vos infos d'auteur",
      icon: <User size={22} />,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      href: "/account",
    },
  ];

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">Commandes</h2>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Outils de croissance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => router.push(item.href)}
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-white border border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 active:scale-95 text-left overflow-hidden"
          >
            {/* Badge Premium pour le Portefeuille */}
            {item.isPremium && (
              <div className="absolute top-6 right-6 text-amber-500 animate-pulse">
                <Sparkles size={16} fill="currentColor" />
              </div>
            )}

            {/* Icône stylisée */}
            <div className={`mb-6 p-5 ${item.bgColor} ${item.color} rounded-[1.5rem] transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 shadow-inner`}>
              {item.icon}
            </div>

            <div className="space-y-1 relative z-10">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                {item.title}
                <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-teal-500" />
              </h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                {item.description}
              </p>
            </div>

            {/* Effet de fond au survol */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${item.bgColor} opacity-0 group-hover:opacity-20 transition-opacity blur-2xl`} />
          </button>
        ))}
      </div>
    </div>
  );
}

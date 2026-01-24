"use client";
import React from "react";
import { useRouter } from "next/navigation"; // Utilisation de navigation pour le App Router
import { PenTool, User, BarChart3, ChevronRight } from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Nouvelle œuvre",
      description: "Publiez un texte sur le label",
      icon: <PenTool size={22} />,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      shadow: "shadow-teal-100",
      href: "/publish",
    },
    {
      title: "Mon Profil",
      description: "Gérez vos infos d'auteur",
      icon: <User size={22} />,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      shadow: "shadow-slate-100",
      href: "/account",
    },
    {
      title: "Statistiques",
      description: "Analysez vos performances",
      icon: <BarChart3 size={22} />,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      shadow: "shadow-amber-100",
      href: "/statistics",
    },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">Actions rapides</h2>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Gestion du catalogue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => router.push(item.href)}
            className="group relative flex flex-col items-start p-6 rounded-[2rem] bg-white border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 active:scale-95 text-left"
          >
            {/* Icône avec fond doux */}
            <div className={`mb-5 p-4 ${item.bgColor} ${item.color} rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300`}>
              {item.icon}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                {item.title}
                <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-teal-500" />
              </h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Décoration discrète en arrière-plan au survol */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </button>
        ))}
      </div>
    </div>
  );
}

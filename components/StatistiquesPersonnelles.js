"use client";
import React from 'react';
import { 
  Eye, 
  FileText, 
  Coins, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  BarChart3
} from 'lucide-react';

export default function StatistiquesPersonnelles({ user, works }) {
  if (!user || !works) return null;

  // Calculs dynamiques
  const totalViews = works.reduce((acc, w) => acc + Number(w.views || 0), 0);
  const totalTexts = works.length;
  const currentLi = user.li || user.liBalance || 0;
  const followers = user.followers?.length || user.followers || 0;
  
  // Objectifs de monétisation (Seuils Lisible)
  const liProgress = Math.min((currentLi / 25000) * 100, 100);
  const followProgress = Math.min((followers / 250) * 100, 100);

  const stats = [
    {
      label: "Vues Totales",
      value: totalViews.toLocaleString(),
      sub: "Lectures cumulées",
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Manuscrits",
      value: totalTexts,
      sub: "Œuvres publiées",
      icon: FileText,
      color: "text-teal-600",
      bg: "bg-teal-50"
    },
    {
      label: "Bourse Li",
      value: currentLi.toLocaleString(),
      sub: `${(currentLi * 0.0002).toFixed(2)} USD est.`,
      icon: Coins,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Grille des indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-teal-100 transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={22} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
            <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter">
              {stat.value}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">{stat.sub}</p>
            <stat.icon size={80} className={`absolute -right-4 -bottom-4 opacity-[0.03] ${stat.color} group-hover:scale-110 transition-transform`} />
          </div>
        ))}
      </div>

      {/* Barre de Progression Monétisation */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-400 mb-1">
                <TrendingUp size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Objectif Partenaire</span>
              </div>
              <h2 className="text-2xl font-black italic tracking-tight">Progression Monétisation</h2>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
               <ShieldCheck size={14} className={liProgress + followProgress === 200 ? "text-teal-400" : "text-slate-500"} />
               <span className="text-[10px] font-bold uppercase tracking-tighter">
                 {liProgress + followProgress === 200 ? "Éligible aux retraits" : "En cours d'acquisition"}
               </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Barre Li */}
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span>Bourse Li ({currentLi}/25k)</span>
                <span className="text-teal-400">{Math.round(liProgress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${liProgress}%` }}
                />
              </div>
            </div>

            {/* Barre Abonnés */}
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span>Abonnés ({followers}/250)</span>
                <span className="text-teal-400">{Math.round(followProgress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${followProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Décoration de fond */}
        <BarChart3 size={150} className="absolute -left-10 -bottom-10 opacity-5 text-white" />
      </div>
    </div>
  );
}

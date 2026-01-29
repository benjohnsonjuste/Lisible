"use client";
import React, { useState, useEffect } from "react";
import { Users, Eye, BookOpen, DollarSign, Star, Lock, Loader2 } from "lucide-react";

export default function MetricsOverview({ user }) {
  const [metrics, setMetrics] = useState({
    subscribers: 0,
    totalViews: 0,
    totalTexts: 0,
    totalLikes: 0,
    estimatedEarnings: "0.00",
    isMonetized: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si l'utilisateur n'est pas encore là, on ne fait rien mais on garde le loading
    if (!user || !user.email) return;

    async function fetchStats() {
      try {
        const res = await fetch(`/api/get-user-stats?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          // On s'assure que data contient bien les propriétés attendues
          setMetrics(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Erreur API Stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  // Si on attend l'utilisateur ou l'API, on montre un beau squelette de chargement
  if (loading || !user) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-40 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-slate-50 rounded-xl" />
          <div className="w-20 h-4 bg-slate-50 rounded-full" />
        </div>
      ))}
    </div>
  );

  const MONETIZATION_THRESHOLD = 250;
  const progressPercent = Math.min((metrics.subscribers / MONETIZATION_THRESHOLD) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Abonnés"
          value={metrics.subscribers || 0}
          icon={<Users size={20} />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Lectures"
          value={(metrics.totalViews || 0).toLocaleString()}
          icon={<Eye size={20} />}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <MetricCard
          title="Manuscrits"
          value={metrics.totalTexts || 0}
          icon={<BookOpen size={20} />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Gains Estimés"
          value={`$${metrics.estimatedEarnings || "0.00"}`}
          icon={<DollarSign size={20} />}
          color="text-amber-600"
          bgColor="bg-amber-50"
          highlight={metrics.isMonetized}
        />
      </div>

      {/* État de la Monétisation */}
      <div className={`p-8 rounded-[3rem] border transition-all duration-500 ${
        metrics.isMonetized 
        ? 'bg-slate-900 border-teal-500/30 text-white shadow-2xl shadow-teal-500/10' 
        : 'bg-white border-slate-100 shadow-sm'
      }`}>
        {metrics.isMonetized ? (
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="p-4 bg-teal-500 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.4)] animate-bounce">
              <Star size={24} className="text-white" fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="font-black text-xl italic tracking-tight text-white uppercase">Partenaire Lisible Actif</p>
              <p className="text-sm text-teal-200 font-medium">Votre plume est rémunérée (Taux : 0.20$ / 1k lectures).</p>
            </div>
            <div className="px-6 py-2 bg-teal-500/20 border border-teal-500/40 rounded-full text-teal-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Compte Monétisé
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                  <Lock size={24} />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase text-[12px] tracking-widest italic">Objectif Monétisation</p>
                  <p className="text-sm text-slate-500 font-medium">Débloquez vos revenus dès {MONETIZATION_THRESHOLD} abonnés.</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-black text-slate-900">
                  {metrics.subscribers || 0} <span className="text-slate-300 text-sm">/ {MONETIZATION_THRESHOLD}</span>
                </span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Abonnés acquis</span>
              </div>
            </div>
            
            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, bgColor, highlight }) {
  return (
    <div className={`p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 group ${highlight ? 'ring-2 ring-teal-500/20 shadow-lg' : ''}`}>
      <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className={`text-3xl font-black tracking-tighter ${highlight ? 'text-teal-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

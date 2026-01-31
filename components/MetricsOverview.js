"use client";
import React, { useState, useEffect } from "react";
import { Users, Eye, BookOpen, Sparkles, Coins, Star, Lock, Zap } from "lucide-react";

export default function MetricsOverview({ user }) {
  const [metrics, setMetrics] = useState({
    subscribers: 0,
    totalViews: 0,
    totalTexts: 0,
    totalCertified: 0, // Nouveau : Lectures 100% validées
    liBalance: 0,      // Nouveau : Le portefeuille actuel
    estimatedValueUSD: "0.00",
    isMonetized: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.email) return;

    async function fetchStats() {
      try {
        const res = await fetch(`/api/get-user-stats?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
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

  // Seuil de retrait de Li (ex: 5000 Li pour un virement)
  const WITHDRAWAL_THRESHOLD = 5000;
  const progressPercent = Math.min((metrics.liBalance / WITHDRAWAL_THRESHOLD) * 100, 100);

  return (
    <div className="space-y-6">
      {/* GRILLE DE MÉTRIQUES PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Abonnés"
          value={metrics.subscribers || 0}
          icon={<Users size={20} />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Attention (Li)"
          value={metrics.totalCertified || 0}
          icon={<Sparkles size={20} />}
          color="text-teal-600"
          bgColor="bg-teal-50"
          desc="Lectures certifiées"
        />
        <MetricCard
          title="Solde Li"
          value={metrics.liBalance || 0}
          icon={<Coins size={20} />}
          color="text-amber-600"
          bgColor="bg-amber-50"
          highlight={true}
        />
        <MetricCard
          title="Valeur Estimée"
          value={`$${metrics.estimatedValueUSD || "0.00"}`}
          icon={<Zap size={20} />}
          color="text-rose-600"
          bgColor="bg-rose-50"
        />
      </div>

      {/* BARRE DE PROGRESSION DE RETRAIT (WALLET STATUS) */}
      <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 rounded-2xl text-amber-400 shadow-lg group-hover:rotate-12 transition-transform">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="font-black text-slate-900 uppercase text-[12px] tracking-widest italic">Objectif Premier Retrait</p>
              <p className="text-xs text-slate-500 font-medium">Accumulez {WITHDRAWAL_THRESHOLD} Li pour débloquer votre premier virement.</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-2xl font-black text-slate-900">
              {metrics.liBalance || 0} <span className="text-slate-300 text-sm">/ {WITHDRAWAL_THRESHOLD}</span>
            </span>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter">Li accumulés</span>
          </div>
        </div>
        
        {/* BARRE DE PROGRESSION DYNAMIQUE */}
        <div className="relative w-full h-4 bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-amber-400 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
          {progressPercent >= 100 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">Prêt pour encaissement</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, bgColor, highlight, desc }) {
  return (
    <div className={`p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 group hover:-translate-y-1 ${highlight ? 'ring-2 ring-amber-500/20 shadow-md' : ''}`}>
      <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-3xl font-black tracking-tighter ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>
          {value.toLocaleString()}
        </p>
        {desc && <span className="text-[8px] font-bold text-slate-300 uppercase italic">{desc}</span>}
      </div>
    </div>
  );
}

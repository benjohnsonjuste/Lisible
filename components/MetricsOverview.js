"use client";
import React, { useState, useEffect } from "react";
import { Users, Eye, BookOpen, DollarSign, Star, Lock, Loader2 } from "lucide-react";

export default function MetricsOverview({ user }) {
  const [metrics, setMetrics] = useState({
    subscribers: 0,
    totalViews: 0,
    textsPublished: 0,
    totalEarnings: "0.00",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchAuthorData() {
      try {
        // 1. Récupérer les données de profil (Abonnés) via Raw Content pour la rapidité
        const fileName = btoa(user.email).replace(/=/g, "") + ".json";
        const resProfile = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/users/${fileName}?t=${Date.now()}`);
        const profileData = resProfile.ok ? await resProfile.json() : {};

        // 2. Récupérer les statistiques réelles depuis l'API de publications
        const resTexts = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        const files = await resTexts.json();
        
        let realTotalViews = 0;
        let publishedCount = 0;
        
        if (Array.isArray(files)) {
          const dataPromises = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
          
          const allTexts = await Promise.all(dataPromises);
          
          // Filtrage rigoureux par email
          const authorTexts = allTexts.filter(t => 
            t.authorEmail && t.authorEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
          );

          publishedCount = authorTexts.length;
          realTotalViews = authorTexts.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
        }

        const subs = profileData.subscribers?.length || 0;
        
        // Logique de Monétisation : Seuil à 250 abonnés
        const isUnlocked = subs >= 250;
        const earnings = isUnlocked ? (realTotalViews / 1000) * 0.20 : 0;

        setMetrics({
          subscribers: subs,
          totalViews: realTotalViews,
          textsPublished: publishedCount,
          totalEarnings: earnings.toFixed(2),
        });
      } catch (err) {
        console.error("Erreur metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthorData();
  }, [user]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-40 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-200" size={24} />
        </div>
      ))}
    </div>
  );

  const MONETIZATION_THRESHOLD = 250;
  const isMonetized = metrics.subscribers >= MONETIZATION_THRESHOLD;
  const progressPercent = Math.min((metrics.subscribers / MONETIZATION_THRESHOLD) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Abonnés"
          value={metrics.subscribers}
          icon={<Users size={20} />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Lectures"
          value={metrics.totalViews.toLocaleString()}
          icon={<Eye size={20} />}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <MetricCard
          title="Manuscrits"
          value={metrics.textsPublished}
          icon={<BookOpen size={20} />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Gains Estimés"
          value={`$${metrics.totalEarnings}`}
          icon={<DollarSign size={20} />}
          color="text-amber-600"
          bgColor="bg-amber-50"
          highlight={isMonetized}
        />
      </div>

      {/* Barre de Progression / Statut Monétisation */}
      <div className={`p-8 rounded-[3rem] border transition-all duration-500 ${
        isMonetized 
        ? 'bg-slate-900 border-teal-500/30 text-white shadow-2xl shadow-teal-500/10' 
        : 'bg-white border-slate-100 shadow-sm'
      }`}>
        {isMonetized ? (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-teal-500 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.4)] animate-pulse">
              <Star size={24} className="text-white" fill="currentColor" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-black text-xl italic tracking-tight">Programme Partenaire Lisible</p>
              <p className="text-sm text-teal-200 font-medium">Votre plume génère des revenus (Taux : 0.20$ / 1k vues).</p>
            </div>
            <div className="ml-auto">
               <div className="px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-[10px] font-black uppercase tracking-widest">
                 Monétisation Activée
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
                  <Lock size={24} />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase text-[12px] tracking-widest italic">Objectif Monétisation</p>
                  <p className="text-sm text-slate-500 font-medium">Atteignez 250 abonnés pour débloquer vos gains.</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {metrics.subscribers} <span className="text-slate-300 text-sm">/ {MONETIZATION_THRESHOLD}</span>
                </span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Abonnés requis</span>
              </div>
            </div>
            
            <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-600/30" 
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
    <div className={`p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 group hover:-translate-y-1 ${highlight ? 'ring-2 ring-teal-500/20' : ''}`}>
      <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className={`text-3xl font-black tracking-tighter transition-colors ${highlight ? 'text-teal-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { Users, Eye, BookOpen, DollarSign, Star, Lock, Loader2 } from "lucide-react";

export default function MetricsOverview({ user }) {
  const [metrics, setMetrics] = useState({
    subscribers: 0,
    totalViews: 0,
    textsPublished: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchAuthorData() {
      try {
        // 1. Récupérer les données de profil (Abonnés)
        const fileName = btoa(user.email).replace(/=/g, "") + ".json";
        const resProfile = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/users/${fileName}?t=${Date.now()}`);
        const profileData = resProfile.ok ? await resProfile.json() : {};

        // 2. Récupérer tous les textes pour calculer les vues réelles et le compte
        const resTexts = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
        const files = await resTexts.json();
        
        let realTotalViews = 0;
        let publishedCount = 0;
        
        if (Array.isArray(files)) {
          const dataPromises = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => fetch(f.download_url).then(r => r.json()));
          
          const allTexts = await Promise.all(dataPromises);
          
          // Filtrer les textes de cet auteur
          const authorTexts = allTexts.filter(t => 
            t.authorEmail && t.authorEmail.toLowerCase() === user.email.toLowerCase()
          );

          publishedCount = authorTexts.length;
          // Somme magique de toutes les vues de l'auteur
          realTotalViews = authorTexts.reduce((acc, curr) => acc + (curr.views || 0), 0);
        }

        const subs = profileData.subscribers?.length || 0;
        
        // Calcul Monétisation : Seuil à 250 abonnés
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-slate-50 rounded-[2.5rem] border border-slate-100" />
      ))}
    </div>
  );

  const isMonetized = metrics.subscribers >= 250;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Abonnés"
          value={metrics.subscribers}
          icon={<Users className="text-blue-600" size={20} />}
          color="bg-blue-50"
        />
        <MetricCard
          title="Lectures"
          value={metrics.totalViews.toLocaleString()}
          icon={<Eye className="text-teal-600" size={20} />}
          color="bg-teal-50"
        />
        <MetricCard
          title="Manuscrits"
          value={metrics.textsPublished}
          icon={<BookOpen className="text-purple-600" size={20} />}
          color="bg-purple-50"
        />
        <MetricCard
          title="Gains Estimés"
          value={`$${metrics.totalEarnings}`}
          icon={<DollarSign className="text-amber-600" size={20} />}
          color="bg-amber-50"
          highlight={isMonetized}
        />
      </div>

      {/* État de la Monétisation */}
      <div className={`p-8 rounded-[2.5rem] border transition-all ${isMonetized ? 'bg-teal-900 border-teal-800 text-white shadow-xl shadow-teal-900/20' : 'bg-white border-slate-100 shadow-sm'}`}>
        {isMonetized ? (
          <div className="flex items-center gap-6">
            <div className="p-4 bg-teal-500 rounded-2xl shadow-lg animate-bounce">
              <Star size={24} className="text-white" fill="currentColor" />
            </div>
            <div>
              <p className="font-black text-xl italic tracking-tight">Partenaire Lisible Actif</p>
              <p className="text-sm text-teal-200 font-medium">Votre plume est récompensée à hauteur de 0,20$ / 1k vues.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                <Lock size={24} />
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-[12px] tracking-widest">Objectif Monétisation</p>
                <p className="text-sm text-slate-500 font-medium">Débloquez vos revenus à partir de 250 abonnés.</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                {metrics.subscribers} / 250 abonnés
              </span>
              <div className="w-full md:w-64 h-3 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-lg shadow-blue-600/30" 
                  style={{ width: `${Math.min((metrics.subscribers / 250) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, highlight }) {
  return (
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className={`text-3xl font-black tracking-tighter ${highlight ? 'text-teal-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

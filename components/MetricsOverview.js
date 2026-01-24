"use client";
import React, { useState, useEffect } from "react";
import { Rocket, Users, Eye, BookOpen, DollarSign, Star, Lock } from "lucide-react";

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
        // 1. Récupérer les données de profil (Abonnés et Vues)
        const fileName = btoa(user.email).replace(/=/g, "") + ".json";
        const resProfile = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/users/${fileName}?t=${Date.now()}`);
        const profileData = resProfile.ok ? await resProfile.json() : {};

        // 2. Récupérer le nombre de textes publiés
        const resTexts = await fetch("https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications");
        const files = await resTexts.json();
        let publishedCount = 0;
        
        if (Array.isArray(files)) {
          // On filtre les fichiers pour compter ceux appartenant à l'auteur
          const dataPromises = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => fetch(f.download_url).then(r => r.json()));
          
          const allTexts = await Promise.all(dataPromises);
          publishedCount = allTexts.filter(t => t.authorEmail === user.email).length;
        }

        const subs = profileData.subscribers?.length || 0;
        const views = profileData.totalViews || 0;
        
        // Calcul Monétisation : Unlocked à 250 abonnés
        const isUnlocked = subs >= 250;
        const earnings = isUnlocked ? (views / 1000) * 0.20 : 0;

        setMetrics({
          subscribers: subs,
          totalViews: views,
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

  if (loading) return <div className="grid grid-cols-2 gap-4 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-3xl" />)}</div>;

  const isMonetized = metrics.subscribers >= 250;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Abonnés"
          value={metrics.subscribers}
          icon={<Users className="text-blue-600" size={24} />}
          color="bg-blue-50"
        />
        <MetricCard
          title="Vues totales"
          value={metrics.totalViews.toLocaleString()}
          icon={<Eye className="text-emerald-600" size={24} />}
          color="bg-emerald-50"
        />
        <MetricCard
          title="Publications"
          value={metrics.textsPublished}
          icon={<BookOpen className="text-purple-600" size={24} />}
          color="bg-purple-50"
        />
        <MetricCard
          title="Gains (USD)"
          value={`$${metrics.totalEarnings}`}
          icon={<DollarSign className="text-amber-600" size={24} />}
          color="bg-amber-50"
          highlight={isMonetized}
        />
      </div>

      {/* Barre de progression ou Badge */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        {isMonetized ? (
          <div className="flex items-center gap-4 text-emerald-700">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="font-black text-lg">Compte Partenaire Actif</p>
              <p className="text-sm opacity-80">Vous générez 0,20$ pour chaque 1 000 vues uniques.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-gray-500">
              <div className="p-3 bg-gray-100 rounded-2xl">
                <Lock size={24} />
              </div>
              <div>
                <p className="font-black text-gray-900">Objectif Monétisation</p>
                <p className="text-sm font-medium">Atteignez 250 abonnés pour débloquer vos gains.</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-xs font-black text-blue-600 mb-1">{metrics.subscribers} / 250</span>
                <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-1000" 
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
    <div className={`p-6 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md bg-white`}>
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-black ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

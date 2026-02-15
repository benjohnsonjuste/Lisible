"use client";
import React, { useEffect, useState } from "react";
import { 
  Zap, Eye, Heart, PenTool, Users, 
  TrendingUp, Activity, Globe, ShieldCheck
} from "lucide-react";

export default function GlobalStats() {
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    texts: 0,
    authors: 0,
    engagement: 0,
    certified: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGlobalData() {
      try {
        const res = await fetch('/api/github-db?type=library');
        const data = await res.json();

        if (data && Array.isArray(data.content)) {
          const content = data.content;
          const totalViews = content.reduce((acc, p) => acc + (Number(p.views) || 0), 0);
          const totalLikes = content.reduce((acc, p) => acc + (Number(p.likes) || 0), 0);
          const uniqueAuthors = new Set(content.map(p => p.authorEmail)).size;
          const certifiedCount = content.filter(p => p.certified > 0).length;
          
          setStats({
            views: totalViews,
            likes: totalLikes,
            texts: content.length,
            authors: uniqueAuthors,
            engagement: ((totalLikes / (totalViews || 1)) * 100).toFixed(1),
            certified: certifiedCount
          });
        }
      } catch (e) {
        console.error("Erreur stats globales:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGlobalData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <div className={`relative group p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}>
      {/* Effet de scan High-Tech en arrière-plan */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${color} -z-10`} />
      <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:text-white group-hover:opacity-20 transition-all duration-500">
        <Icon size={120} strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg bg-gradient-to-br ${color} text-white`}>
          <Icon size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
        <h3 className="text-4xl font-black italic tracking-tighter text-slate-900 leading-none">
          {loading ? "---" : value}
        </h3>
      </div>
    </div>
  );

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      {/* Header Statistique */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.3em]">
            <Activity size={14} className="animate-pulse" /> Live Network Pulse
          </div>
          <h2 className="text-6xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">Metrics.</h2>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Dernière mise à jour</p>
          <p className="font-black text-slate-900">INSTANT TÉLÉMÉTRIE</p>
        </div>
      </div>

      {/* Grille Bento High-Tech */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* Colonne Principale : Lectures */}
        <div className="md:col-span-2 md:row-span-2 relative group p-10 rounded-[3rem] bg-slate-950 text-white overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Globe size={200} className="animate-[spin_20s_linear_infinite]" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit">
              <TrendingUp size={16} className="text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Audience Globale</span>
            </div>
            <div>
              <p className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none mb-4 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                {loading ? "..." : stats.views.toLocaleString()}
              </p>
              <p className="text-teal-400 font-black uppercase tracking-[0.4em] text-xs">Lectures cumulées sur Lisible</p>
            </div>
          </div>
        </div>

        {/* Petites Cartes */}
        <StatCard 
          icon={PenTool} 
          label="Manuscrits" 
          value={stats.texts} 
          color="from-blue-500 to-cyan-400" 
        />
        
        <StatCard 
          icon={Heart} 
          label="Appréciations" 
          value={stats.likes} 
          color="from-rose-500 to-orange-400" 
        />

        <StatCard 
          icon={Users} 
          label="Plumes" 
          value={stats.authors} 
          color="from-indigo-500 to-purple-400" 
        />

        <StatCard 
          icon={ShieldCheck} 
          label="Certifiés" 
          value={stats.certified} 
          color="from-teal-500 to-emerald-400" 
        />

        {/* Carte Engagement Large */}
        <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-white border border-slate-200 flex items-center justify-between shadow-lg">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux d'engagement</p>
            <h4 className="text-5xl font-black text-slate-900 tracking-tighter">{stats.engagement}%</h4>
          </div>
          <div className="w-24 h-24 rounded-full border-8 border-teal-500/10 border-t-teal-500 flex items-center justify-center relative">
             <Zap size={24} className="text-teal-500 fill-current" />
          </div>
        </div>

      </div>
    </section>
  );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Eye, Heart, PenTool, Users,
  TrendingUp, Activity, Globe, ShieldCheck,
  MessageCircle, Trophy, UserPlus, BookMarked
} from "lucide-react";

// Fréquence d'actualisation : 60 secondes. Chaque actualisation télécharge
// ~150 fichiers ; un intervalle plus court saturerait le réseau et
// déclencherait les limites de débit de l'hébergeur des données.
const REFRESH_MS = 60000;

const num = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

async function downloadAll(files) {
  const results = await Promise.all(
    files.map(async (f) => {
      try {
        const r = await fetch(f.download_url);
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

const asArray = (v) => (Array.isArray(v) ? v : []);
const countOf = (v) => (Array.isArray(v) ? v.length : num(v));

export default function GlobalStats() {
  const [stats, setStats] = useState({
    views: 0,
    texts: 0,
    publications: 0,
    authors: 0,
    likes: 0,
    comments: 0,
    certified: 0,
    followers: 0,
    contests: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchGlobalData = useCallback(async () => {
    try {
      // 1. Listes des fichiers via l'API (1 sous-requête chacune côté Worker),
      // puis téléchargement direct de chaque fichier dans le navigateur
      // (même modèle que les pages salon / bibliothèque / communauté).
      const [textsList, usersList, pubsList] = await Promise.all([
        fetch('/api/realtime-data?folder=texts&mode=list').then(r => r.json()),
        fetch('/api/realtime-data?folder=users&mode=list').then(r => r.json()),
        fetch('/api/realtime-data?folder=publications&mode=list').then(r => r.json())
      ]);

      const [textsRaw, usersRaw, pubsRaw] = await Promise.all([
        downloadAll(asArray(textsList.files)),
        downloadAll(asArray(usersList.files)),
        downloadAll(asArray(pubsList.files))
      ]);

      // 2. Normalisation (un fichier = un objet, ou parfois une liste)
      const texts = textsRaw.flatMap(t => (Array.isArray(t) ? t : [t])).filter(t => t && (t.id || t.title));
      const users = usersRaw.flatMap(u => (Array.isArray(u) ? u : [u])).filter(u => u && (u.email || u.id || u.name));
      const publications = pubsRaw.flatMap(p => (Array.isArray(p) ? p : [p])).filter(p => p && (p.id || p.title));

      // 3. Calcul des statistiques réelles
      let views = 0, likes = 0, comments = 0, certified = 0, contests = 0;
      texts.forEach(t => {
        views += num(t.views);
        likes += num(t.likes);
        comments += countOf(t.comments);
        certified += num(t.certified);
        if (t.isConcours) contests += 1;
      });
      publications.forEach(p => {
        views += num(p.views);
        likes += num(p.likes);
        certified += num(p.certified);
        if (p.isConcours) contests += 1;
      });
      let followers = 0;
      users.forEach(u => {
        followers += countOf(u.followers);
      });

      setStats({
        views,
        texts: texts.length,
        publications: publications.length,
        authors: users.length,
        likes,
        comments,
        certified,
        followers,
        contests
      });
      setUpdatedAt(new Date());
    } catch (e) {
      console.error("Erreur stats globales:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="relative group p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:bg-slate-900 dark:border-white/5">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${color} -z-10`} />
      <div className="absolute -right-4 -bottom-4 text-slate-50 dark:text-slate-950 group-hover:text-white group-hover:opacity-20 transition-all duration-500">
        <Icon size={120} strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg bg-gradient-to-br ${color} text-white`}>
          <Icon size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
        <h3 className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">
          {loading ? "---" : value.toLocaleString("fr-FR")}
        </h3>
      </div>
    </div>
  );

  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.3em]">
            <Activity size={14} className="animate-pulse" /> En direct
          </div>
          <h2 className="text-6xl md:text-7xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-[0.8]">Statistiques<span className="text-blue-600">.</span></h2>
        </div>
        <div className="text-left md:text-right">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Synchronisation automatique</p>
          <div className="flex items-center md:justify-end gap-1.5 font-black text-slate-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>TEMPS RÉEL{updatedAt ? ` · MAJ ${updatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {/* Encart Audience Globale (lectures cumulées des textes et publications) */}
        <div className="md:col-span-2 md:row-span-2 relative group p-10 rounded-[3rem] bg-slate-950 text-white overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Globe size={200} className="animate-[spin_30s_linear_infinite]" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between min-h-[220px]">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit">
              <TrendingUp size={16} className="text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Audience Globale</span>
            </div>
            <div>
              <p className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none mb-4 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                {loading ? "..." : stats.views.toLocaleString("fr-FR")}
              </p>
              <p className="text-teal-400 font-black uppercase tracking-[0.4em] text-xs">Lectures cumulées</p>
            </div>
          </div>
        </div>

        <StatCard
          icon={PenTool}
          label="Textes publiés"
          value={stats.texts}
          color="from-blue-500 to-cyan-400"
        />

        <StatCard
          icon={BookMarked}
          label="Publications"
          value={stats.publications}
          color="from-sky-500 to-blue-400"
        />

        <StatCard
          icon={Users}
          label="Plumes inscrites"
          value={stats.authors}
          color="from-indigo-500 to-purple-400"
        />

        <StatCard
          icon={Heart}
          label="Appréciations"
          value={stats.likes}
          color="from-rose-500 to-orange-400"
        />

        <StatCard
          icon={MessageCircle}
          label="Commentaires"
          value={stats.comments}
          color="from-amber-500 to-yellow-400"
        />

        <StatCard
          icon={ShieldCheck}
          label="Certifications"
          value={stats.certified}
          color="from-teal-500 to-emerald-400"
        />

        <StatCard
          icon={UserPlus}
          label="Abonnements"
          value={stats.followers}
          color="from-violet-500 to-fuchsia-400"
        />

        <StatCard
          icon={Trophy}
          label="Concours"
          value={stats.contests}
          color="from-orange-500 to-red-400"
        />

      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
        <Eye size={14} />
        <span>Chiffres calculés en temps réel depuis les données du site · actualisation toutes les 60 secondes</span>
      </div>
    </section>
  );
}

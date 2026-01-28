"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuickActions from "@/components/QuickActions";
import { Sparkles, BookOpen, BarChart, Settings, Loader2, Users, Star } from "lucide-react";
import Link from "next/link";

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    views: 0, 
    texts: 0, 
    followers: 0, 
    isMonetized: false 
  });

  useEffect(() => {
    async function initDashboard() {
      const loggedUser = localStorage.getItem("lisible_user");
      
      if (loggedUser) {
        const parsedUser = JSON.parse(loggedUser);
        setUser(parsedUser);

        try {
          // Appel à l'API unique qui centralise tout
          const res = await fetch(`/api/get-user-stats?email=${encodeURIComponent(parsedUser.email)}&t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            setStats({
              views: data.totalViews || 0,
              texts: data.totalTexts || 0,
              followers: data.subscribers || 0, // Utilise 'subscribers' renvoyé par l'API
              isMonetized: data.isMonetized || false
            });
          }
        } catch (error) {
          console.error("Erreur Analytics Dashboard:", error);
        }
      }
      setLoading(false);
    }

    initDashboard();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <Loader2 className="animate-spin h-10 w-10 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest">Calcul des statistiques...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] text-center shadow-2xl border border-slate-50">
        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <Settings size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4 italic tracking-tighter">Accès restreint.</h1>
        <Link href="/login" className="block w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase hover:bg-teal-600 transition-all">
          SE CONNECTER
        </Link>
      </div>
    );
  }

  const displayName = user.penName || user.firstName || user.name?.split(' ')[0] || "Auteur";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-700">
      
      {/* SECTION BIENVENUE */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-400 mb-4">
            <Sparkles size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Studio Auteur</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-2">
            Bonjour, {displayName}
          </h1>
          <p className="text-slate-400 font-medium max-w-sm">
            Vos statistiques sont synchronisées avec vos publications.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <StatMini 
            label="Abonnés" 
            value={stats.followers.toLocaleString()} 
            icon={<Users size={14}/>} 
            color="text-teal-400"
          />
          <StatMini 
            label="Vues" 
            value={stats.views.toLocaleString()} 
            icon={<BarChart size={14}/>} 
            color="text-slate-400"
          />
          <StatMini 
            label="Textes" 
            value={stats.texts} 
            icon={<BookOpen size={14}/>} 
            color="text-slate-400"
          />
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </header>

      <section>
        <QuickActions />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PROGRESSION MONÉTISATION */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users size={16} className="text-teal-500" />
              Monétisation
            </h3>
            {stats.isMonetized && (
              <span className="flex items-center gap-1 text-[9px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 uppercase tracking-widest animate-pulse">
                <Star size={10} fill="currentColor" /> Actif
              </span>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex justify-between items-end mb-3">
               <p className="text-slate-900 text-sm font-bold">
                {stats.isMonetized ? "Félicitations, profil monétisé" : "Objectif 250 abonnés"}
              </p>
              <span className="text-[11px] font-black text-slate-900">
                {stats.followers} <span className="text-slate-400 font-bold">/ 250</span>
              </span>
            </div>
            
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${stats.isMonetized ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min((stats.followers / 250) * 100, 100)}%` }}
                ></div>
            </div>

            {!stats.isMonetized && (
              <p className="text-[10px] text-slate-400 mt-4 font-medium italic">
                Encore {Math.max(0, 250 - stats.followers)} abonnés pour commencer à générer des revenus.
              </p>
            )}
          </div>
        </div>

        {/* CONSEIL */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Conseil du jour
          </h3>
          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100/50 flex flex-col justify-center h-[116px]">
            <p className="text-slate-700 text-sm leading-relaxed font-serif italic">
              "Un abonné est un lecteur qui a choisi de vous suivre. Offrez-lui la qualité qu'il mérite."
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center pt-10">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Lisible Analytics © 2026 • Données certifiées
         </p>
      </footer>
    </div>
  );
}

function StatMini({ label, value, icon, color }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl min-w-[100px] text-center transition-transform hover:scale-105">
      <div className={`flex justify-center ${color} mb-1`}>{icon}</div>
      <p className="text-xl font-black">{value}</p>
      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

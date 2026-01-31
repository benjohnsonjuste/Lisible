"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuickActions from "@/components/QuickActions";
import { Sparkles, BookOpen, Loader2, Users, Star, Coins, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    views: 0, 
    texts: 0, 
    followers: 0,
    liBalance: 0, // Nouveau : Solde réel de Li
    totalCertified: 0, // Nouveau : Cumul des lectures finies
    estimatedEarnings: "0.00",
    isMonetized: false 
  });

  useEffect(() => {
    async function initDashboard() {
      const loggedUser = localStorage.getItem("lisible_user");
      
      if (loggedUser) {
        const parsedUser = JSON.parse(loggedUser);
        setUser(parsedUser);

        try {
          // Appel à l'API unique mise à jour avec le système de Li
          const res = await fetch(`/api/get-user-stats?email=${encodeURIComponent(parsedUser.email)}&t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            setStats({
              views: data.totalViews || 0,
              texts: data.totalTexts || 0,
              followers: data.subscribers || 0,
              liBalance: data.liBalance || 0,
              totalCertified: data.totalCertified || 0,
              estimatedEarnings: data.estimatedValueUSD || "0.00",
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
    <div className="flex flex-col justify-center items-center py-40 text-teal-600 bg-white min-h-screen">
      <Loader2 className="animate-spin h-10 w-10 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation du Portefeuille...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] text-center shadow-2xl border border-slate-50">
        <h1 className="text-2xl font-black text-slate-900 mb-4 italic tracking-tighter">Accès restreint.</h1>
        <Link href="/login" className="block w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase hover:bg-teal-600 transition-all">
          SE CONNECTER
        </Link>
      </div>
    );
  }

  const displayName = user.penName || user.firstName || "Auteur";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER : LE STUDIO DU LI */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-400 mb-4">
            <Zap size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Économie de l'Attention</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-2">
            Bonjour, {displayName}
          </h1>
          <p className="text-slate-400 font-medium max-w-sm">
            Vos revenus sont calculés sur vos lectures certifiées.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <StatMini 
            label="Portefeuille" 
            value={`${stats.liBalance} Li`} 
            icon={<Coins size={14}/>} 
            color="text-amber-400"
          />
          <StatMini 
            label="Attention" 
            value={stats.totalCertified} 
            icon={<ShieldCheck size={14}/>} 
            color="text-teal-400"
          />
          <StatMini 
            label="Lectures" 
            value={stats.views} 
            icon={<BookOpen size={14}/>} 
            color="text-slate-400"
          />
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </header>

      <section>
        <QuickActions />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PROGRESSION MONÉTISATION (250 ABONNÉS) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              Statut Partenaire
            </h3>
            {stats.isMonetized && (
              <span className="flex items-center gap-1 text-[9px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 uppercase tracking-widest">
                <Star size={10} fill="currentColor" /> Éligible
              </span>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex justify-between items-end mb-3">
               <p className="text-slate-900 text-xs font-black uppercase italic tracking-tighter">
                Seuil de Communauté (250)
              </p>
              <span className="text-[11px] font-black text-slate-900">
                {stats.followers} <span className="text-slate-300">/ 250</span>
              </span>
            </div>
            
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${stats.isMonetized ? 'bg-teal-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min((stats.followers / 250) * 100, 100)}%` }}
                ></div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200/50 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gains Accumulés</p>
                  <p className="text-2xl font-black text-slate-900 italic">${stats.estimatedEarnings}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Taux</p>
                  <p className="text-[10px] font-bold text-teal-600">0.20$ / 1000 Li</p>
                </div>
            </div>
          </div>
        </div>

        {/* ANALYTICS QUALITATIF (LI VS VUES) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Qualité de Lecture
          </h3>
          <div className="space-y-4">
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Lectures Certifiées (Li)</span>
              <span className="font-black text-slate-900 text-xl">{stats.totalCertified}</span>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vues (Simples clics)</span>
              <span className="font-bold text-slate-400 text-xl">{stats.views}</span>
            </div>
            <p className="text-[9px] text-slate-400 text-center font-medium italic">
              Seules les Lectures Certifiées génèrent des Li et des revenus.
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center pt-10">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Lisible Studio • L'Économie de l'Attention Humaine
         </p>
      </footer>
    </div>
  );
}

function StatMini({ label, value, icon, color }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-5 py-4 rounded-[1.5rem] min-w-[110px] text-center transition-all hover:bg-white/10 group">
      <div className={`flex justify-center ${color} mb-1 group-hover:scale-110 transition-transform`}>{icon}</div>
      <p className="text-xl font-black tracking-tighter">{value}</p>
      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, BookOpen, Loader2, Users, Star, Coins, 
  Zap, ShieldCheck, TrendingUp, ArrowUpRight, 
  PlusCircle, LayoutGrid, Settings, LogOut, Eye, Trophy
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// --- COMPOSANT : MÉTRIQUE DU DASHBOARD ---
function DashboardMetric({ label, value, icon, color, subValue }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-500`}>
          {React.cloneElement(icon, { className: color, size: 20 })}
        </div>
        {subValue && (
          <span className="text-[10px] font-black px-2 py-1 bg-slate-50 rounded-lg text-slate-400 uppercase tracking-widest">
            {subValue}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

// --- ACTIONS RAPIDES ---
function LocalQuickActions() {
  const actions = [
    { label: "Publier", icon: <PlusCircle size={18}/>, href: "/publish", bg: "bg-teal-600" },
    { label: "Concourir", icon: <Trophy size={18}/>, href: "/concours-publish", bg: "bg-amber-500" },
    { label: "L'Arène", icon: <LayoutGrid size={18}/>, href: "/battle-poetique", bg: "bg-slate-900" },
    { label: "Profil", icon: <Settings size={18}/>, href: "/account", bg: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, idx) => (
        <Link key={idx} href={action.href} className={`${action.bg} ${action.bg.includes('text') ? '' : 'text-white'} p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-95`}>
          {action.icon}
          <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    views: 0, texts: 0, followers: 0, liBalance: 0,
    totalCertified: 0, estimatedEarnings: "0.00",
    isMonetized: false, canWithdraw: false, qualityScore: 0
  });

  const LI_VALUATION_RATIO = 0.0002; // 1000 Li = 0.20$
  const WITHDRAWAL_THRESHOLD_LI = 25000; // 5$

  const refreshStats = useCallback(async (email) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const t = Date.now();

      // 1. Charger les données utilisateur (Wallet & Abonnés)
      const userRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${btoa(cleanEmail).replace(/=/g, "")}.json?t=${t}`);
      
      // 2. Charger toutes les publications pour calculer Vues et Certifications réelles
      const textsRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${t}`);
      
      let userData = {};
      let userTexts = [];

      if (userRes.ok) {
        const file = await userRes.json();
        userData = JSON.parse(decodeURIComponent(escape(atob(file.content))));
      }

      if (textsRes.ok) {
        const files = await textsRes.json();
        const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${t}`).then(r => r.json()));
        const allTexts = await Promise.all(promises);
        userTexts = allTexts.filter(txt => txt.authorEmail?.toLowerCase() === cleanEmail);
      }

      // Calculs automatiques
      const totalViews = userTexts.reduce((acc, curr) => acc + (curr.views || 0), 0);
      const totalCertified = userTexts.reduce((acc, curr) => acc + (curr.totalCertified || 0), 0);
      const followersCount = userData.subscribersCount || userData.subscribers?.length || 0;
      const currentLi = userData.wallet?.balance || 0;
      
      // Score de qualité : (Certifications / Vues) * 70 + (Abonnés / 250) * 30
      const engagementRatio = totalViews > 0 ? (totalCertified / totalViews) : 0;
      const followerRatio = Math.min(followersCount / 250, 1);
      const qualityScore = Math.round((engagementRatio * 70) + (followerRatio * 30));

      setStats({
        views: totalViews,
        texts: userTexts.length,
        followers: followersCount,
        liBalance: currentLi,
        totalCertified: totalCertified,
        estimatedEarnings: (currentLi * LI_VALUATION_RATIO).toFixed(2),
        isMonetized: (followersCount >= 250),
        canWithdraw: currentLi >= WITHDRAWAL_THRESHOLD_LI,
        qualityScore: qualityScore > 100 ? 100 : qualityScore
      });
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
    }
  }, []);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      const parsedUser = JSON.parse(loggedUser);
      setUser(parsedUser);
      refreshStats(parsedUser.email).then(() => setLoading(false));
    } else {
      router.push("/login");
    }
  }, [router, refreshStats]);

  const handleWithdrawal = () => {
    if (!stats.canWithdraw) {
      const remaining = WITHDRAWAL_THRESHOLD_LI - stats.liBalance;
      toast.error(`Seuil de retrait non atteint. Manque ${remaining.toLocaleString()} Li.`);
      return;
    }
    router.push("/withdraw");
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-white">
      <Loader2 className="animate-spin h-10 w-10 mb-4 text-teal-600" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation du Studio...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER BANNER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-400 mb-4">
            <ShieldCheck size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Tableau de Bord Certifié</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-2 leading-none">
            {user?.penName || user?.firstName}
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Économie de l'Attention • Lisible.biz</p>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          <div className="text-center bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white/10">
            <p className="text-4xl font-black text-amber-400 tracking-tighter">{stats.liBalance.toLocaleString()} <span className="text-xs text-white/40">Li</span></p>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Solde Actuel</p>
          </div>
          <div className="text-center bg-teal-500/10 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-teal-500/20">
            <p className="text-4xl font-black text-teal-400 tracking-tighter">{stats.totalCertified.toLocaleString()}</p>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-teal-500/60 mt-1">Certifications</p>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500 opacity-10 rounded-full blur-[100px]"></div>
      </header>

      {/* MÉTRIQUES D'IMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetric label="Vues Totales" value={stats.views.toLocaleString()} icon={<Eye />} color="text-blue-500" subValue="Audience" />
        <DashboardMetric label="Production" value={stats.texts} icon={<BookOpen />} color="text-indigo-500" subValue="Manuscrits" />
        <DashboardMetric label="Communauté" value={stats.followers} icon={<Users />} color="text-amber-500" subValue={stats.followers < 250 ? `${250 - stats.followers} restants` : 'Monétisé'} />
        <DashboardMetric label="Score Qualité" value={`${stats.qualityScore}%`} icon={<Sparkles />} color="text-teal-500" subValue="Index Li" />
      </div>

      <LocalQuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PANNEAU MONÉTISATION */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" /> Revenus Estimés
            </h3>
            {stats.isMonetized ? (
              <span className="bg-teal-50 text-teal-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-teal-100">Partenaire Actif</span>
            ) : (
              <span className="bg-slate-50 text-slate-400 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">En attente</span>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 transition-all group-hover:bg-white group-hover:shadow-xl group-hover:border-teal-100">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Portefeuille (USD)</p>
                    <p className="text-5xl font-black text-slate-900 italic tracking-tighter">${stats.estimatedEarnings}</p>
                  </div>
                  <TrendingUp className="text-teal-500 mb-2" size={32} />
                </div>
                
                <button 
                  onClick={handleWithdrawal}
                  className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${stats.canWithdraw ? 'bg-teal-600 text-white hover:bg-slate-900 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Demander un Retrait <ArrowUpRight size={18}/>
                </button>
            </div>

            <div className="px-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Seuil de Monétisation (250 abonnés)</p>
               <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-1000" style={{ width: `${Math.min((stats.followers / 250) * 100, 100)}%` }}></div>
               </div>
            </div>
          </div>
        </div>

        {/* INFO SYSTÈME LI */}
        <div className="bg-slate-950 p-10 rounded-[3rem] text-white flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
           <div className="p-5 bg-white/5 rounded-full text-amber-400 animate-pulse relative z-10">
              <Coins size={40} />
           </div>
           <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase">Barème Li 2026</h3>
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-medium tracking-wide">
                  1 000 Li = <span className="text-white font-bold">0.20 USD</span>
                </p>
                <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest">
                  Retrait minimum : 5.00$ (25k Li)
                </p>
              </div>
           </div>
           <div className="pt-4 relative z-10">
             <Link href="/faq-monetisation" className="text-[9px] font-black border border-white/10 px-6 py-3 rounded-xl uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all">
               Comment gagner plus de Li ?
             </Link>
           </div>
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-teal-500/10 to-transparent"></div>
        </div>
      </div>

      <footer className="pt-10 flex flex-col items-center gap-4 border-t border-slate-100">
         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.8em]">Lisible Studio • 2026</p>
         <button onClick={() => { localStorage.removeItem("lisible_user"); router.push("/login"); }} className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
           <LogOut size={14} /> Déconnexion sécurisée
         </button>
      </footer>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, BookOpen, Loader2, Users, Star, Coins, 
  Zap, ShieldCheck, TrendingUp, ArrowUpRight, 
  PlusCircle, LayoutGrid, Settings, LogOut 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// --- COMPOSANT INTERNE : MÉTRIQUE DU DASHBOARD ---
function DashboardMetric({ label, value, icon, color, subValue }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-500`}>
          {React.cloneElement(icon, { className: color })}
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

// --- COMPOSANT INTERNE : ACTIONS RAPIDES ---
function LocalQuickActions() {
  const actions = [
    { label: "Publier", icon: <PlusCircle size={18}/>, href: "/publish", bg: "bg-teal-600" },
    { label: "Concourir", icon: <Trophy size={18}/>, href: "/concours-publish", bg: "bg-amber-500" },
    { label: "Arène", icon: <LayoutGrid size={18}/>, href: "/battle-poetique", bg: "bg-slate-900" },
    { label: "Profil", icon: <Settings size={18}/>, href: "/settings", bg: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, idx) => (
        <Link key={idx} href={action.href} className={`${action.bg} ${action.bg.includes('text') ? '' : 'text-white'} p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-lg hover:-translate-y-1 transition-all duration-300`}>
          {action.icon}
          <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

// Simple composant Trophy pour l'icône manquante dans Lucide
const Trophy = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    views: 0, texts: 0, followers: 0, liBalance: 0,
    totalCertified: 0, estimatedEarnings: "0.00",
    isMonetized: false, canWithdraw: false
  });

  useEffect(() => {
    async function initDashboard() {
      const loggedUser = localStorage.getItem("lisible_user");
      if (loggedUser) {
        const parsedUser = JSON.parse(loggedUser);
        setUser(parsedUser);
        await refreshStats(parsedUser.email);
      } else {
        router.push("/login");
      }
      setLoading(false);
    }
    initDashboard();
  }, [router]);

  const refreshStats = async (email) => {
    try {
      const res = await fetch(`/api/get-user-stats?email=${encodeURIComponent(email)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          views: data.totalViews || 0,
          texts: data.totalTexts || 0,
          followers: data.subscribers || 0,
          liBalance: data.liBalance || 0,
          totalCertified: data.totalCertified || 0,
          estimatedEarnings: data.estimatedValueUSD || "0.00",
          isMonetized: data.isMonetized || false,
          canWithdraw: data.canWithdraw || false
        });
      }
    } catch (error) {
      toast.error("Erreur de synchronisation du portefeuille.");
    }
  };

  const handleWithdrawal = async () => {
    if (!stats.canWithdraw) return;
    const confirmWithdraw = window.confirm(`Souhaitez-vous retirer vos ${stats.estimatedEarnings}$ ?`);
    if (!confirmWithdraw) return;

    const loadingToast = toast.loading("Traitement...");
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, amountLi: stats.liBalance })
      });
      if (res.ok) {
        toast.success("Demande validée !", { id: loadingToast });
        setStats(prev => ({ ...prev, liBalance: 0, estimatedEarnings: "0.00", canWithdraw: false }));
      }
    } catch (e) { toast.error("Erreur", { id: loadingToast }); }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600 bg-white min-h-screen">
      <Loader2 className="animate-spin h-10 w-10 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calcul des revenus...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER BANNER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-400 mb-4">
            <Zap size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Studio Auteur</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-2">
            Bonjour, {user?.penName || user?.firstName}
          </h1>
          <p className="text-slate-400 font-medium">Portefeuille de l'économie de l'attention.</p>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          <div className="text-center bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
            <p className="text-3xl font-black text-amber-400">{stats.liBalance} Li</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Solde Actuel</p>
          </div>
          <div className="text-center bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
            <p className="text-3xl font-black text-teal-400">{stats.totalCertified}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Certifications</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </header>

      {/* MÉTRIQUES PRINCIPALES (Ex-composant Metric) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetric 
          label="Vues Totales" 
          value={stats.views} 
          icon={<Eye size={20}/>} 
          color="text-blue-500" 
          subValue="Audience"
        />
        <DashboardMetric 
          label="Manuscrits" 
          value={stats.texts} 
          icon={<BookOpen size={20}/>} 
          color="text-indigo-500" 
          subValue="Actifs"
        />
        <DashboardMetric 
          label="Communauté" 
          value={stats.followers} 
          icon={<Users size={20}/>} 
          color="text-amber-500" 
          subValue={`${250 - stats.followers} restants`}
        />
        <DashboardMetric 
          label="Score de Qualité" 
          value={`${stats.views > 0 ? ((stats.totalCertified / stats.views) * 100).toFixed(1) : 0}%`} 
          icon={<Sparkles size={20}/>} 
          color="text-teal-500" 
          subValue="Engagement"
        />
      </div>

      <LocalQuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MONÉTISATION */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Star size={16} className="text-blue-500" /> Monétisation
            </h3>
            {stats.isMonetized && <span className="bg-teal-50 text-teal-600 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-teal-100 italic">Partenaire</span>}
          </div>
          
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Seuil de communauté</p>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-8">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min((stats.followers / 250) * 100, 100)}%` }}></div>
            </div>

            <div className="flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valeur Estimée</p>
                  <p className="text-4xl font-black text-slate-900 italic">${stats.estimatedEarnings}</p>
                </div>
                <button 
                  onClick={handleWithdrawal}
                  disabled={!stats.canWithdraw}
                  className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${stats.canWithdraw ? 'bg-teal-600 text-white shadow-xl hover:bg-teal-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Retirer <ArrowUpRight size={16}/>
                </button>
            </div>
          </div>
        </div>

        {/* REVENUS LI */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center text-center space-y-4">
           <div className="mx-auto p-4 bg-amber-50 rounded-full text-amber-500 mb-2">
              <Coins size={32} />
           </div>
           <h3 className="text-xl font-black text-slate-900 italic tracking-tighter leading-none">
             Système de Récompense Li
           </h3>
           <p className="text-slate-400 text-xs font-medium leading-relaxed px-10">
             Chaque lecture certifiée par un membre de la communauté ajoute 1 Li à votre solde. 
             <strong> 1 Li = 0.01$ USD </strong>.
           </p>
           <div className="pt-4">
             <span className="text-[9px] font-black bg-slate-900 text-white px-4 py-2 rounded-full uppercase tracking-[0.2em]">
               Cycle de paiement : Mensuel
             </span>
           </div>
        </div>
      </div>

      <footer className="text-center pt-10">
         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Lisible Studio • 2026</p>
      </footer>
    </div>
  );
}

// Icône Eye manquante dans l'import précédent
const Eye = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

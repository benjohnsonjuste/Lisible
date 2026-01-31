"use client";
import React, { useEffect, useState } from "react";
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
      // Synchronisation temps réel avec le stockage GitHub
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${btoa(email.toLowerCase()).replace(/=/g, "")}.json?t=${Date.now()}`);
      
      if (res.ok) {
        const file = await res.json();
        const data = JSON.parse(decodeURIComponent(escape(atob(file.content))));
        
        const liBalance = data.wallet?.balance || 0;
        const totalCertified = data.stats?.totalCertified || 0;
        
        setStats({
          views: data.stats?.totalViews || 0,
          texts: data.stats?.totalTexts || 0,
          followers: data.stats?.subscribers || 0,
          liBalance: liBalance,
          totalCertified: totalCertified,
          // Règle : 1 Li = 0.01 USD
          estimatedEarnings: (liBalance * 0.01).toFixed(2),
          isMonetized: (data.stats?.subscribers >= 250),
          canWithdraw: liBalance >= 25000 // Seuil de 250$ (25,000 Li)
        });
      }
    } catch (error) {
      console.error("Erreur de stats:", error);
    }
  };

  const handleWithdrawal = () => {
    if (stats.liBalance < 25000) {
      toast.error(`Seuil de retrait non atteint. Il vous manque ${25000 - stats.liBalance} Li.`);
      return;
    }
    router.push("/withdraw"); // Redirection vers la page de paiement
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen text-teal-600 bg-white">
      <Loader2 className="animate-spin h-10 w-10 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture du Studio...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER BANNER - PORTEFEUILLE */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-400 mb-4">
            <Zap size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Tableau de Bord Certifié</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-2 leading-none">
            {user?.penName || user?.firstName}
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Économie de l'Attention • Lisible.biz</p>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          <div className="text-center bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white/10 shadow-inner">
            <p className="text-4xl font-black text-amber-400 tracking-tighter">{stats.liBalance.toLocaleString()} <span className="text-xs text-white/40">Li</span></p>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Trésorerie Actuelle</p>
          </div>
          <div className="text-center bg-teal-500/10 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-teal-500/20">
            <p className="text-4xl font-black text-teal-400 tracking-tighter">{stats.totalCertified}</p>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-teal-500/60 mt-1">Lectures Li</p>
          </div>
        </div>
        
        {/* Décoration d'arrière-plan */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500 opacity-10 rounded-full blur-[100px]"></div>
      </header>

      {/* MÉTRIQUES D'IMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetric 
          label="Visibilité" 
          value={stats.views.toLocaleString()} 
          icon={<Eye />} 
          color="text-blue-500" 
          subValue="Vues"
        />
        <DashboardMetric 
          label="Production" 
          value={stats.texts} 
          icon={<BookOpen />} 
          color="text-indigo-500" 
          subValue="Textes"
        />
        <DashboardMetric 
          label="Influence" 
          value={stats.followers} 
          icon={<Users />} 
          color="text-amber-500" 
          subValue={stats.followers < 250 ? `Obj. 250` : 'Élite'}
        />
        <DashboardMetric 
          label="Qualité Li" 
          value={`${stats.views > 0 ? ((stats.totalCertified / stats.views) * 100).toFixed(1) : 0}%`} 
          icon={<Sparkles />} 
          color="text-teal-500" 
          subValue="Engagement"
        />
      </div>

      <LocalQuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PANNEAU MONÉTISATION */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" /> État des Revenus
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
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valeur Convertible</p>
                    <p className="text-5xl font-black text-slate-900 italic tracking-tighter">${stats.estimatedEarnings}</p>
                  </div>
                  <TrendingUp className="text-teal-500 mb-2" size={32} />
                </div>
                
                <button 
                  onClick={handleWithdrawal}
                  className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${stats.canWithdraw ? 'bg-teal-600 text-white hover:bg-slate-900 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Demander le paiement <ArrowUpRight size={18}/>
                </button>
            </div>

            <div className="px-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Progression Monétisation (250 abonnés)</p>
               <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-100">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(20,184,166,0.4)]" style={{ width: `${Math.min((stats.followers / 250) * 100, 100)}%` }}></div>
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
              <h3 className="text-2xl font-black italic tracking-tighter uppercase">Le Pouvoir du Li</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed px-10">
                Chaque certification reçue par vos lecteurs crédite votre compte de 1 Li. <br />
                <span className="text-teal-400 font-black mt-2 block tracking-widest">100 Li = 1.00 USD</span>
              </p>
           </div>
           <div className="pt-4 relative z-10">
             <Link href="/faq-monetisation" className="text-[9px] font-black border border-white/10 px-6 py-3 rounded-xl uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all">
               En savoir plus sur les retraits
             </Link>
           </div>
           {/* Décoration d'arrière-plan */}
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

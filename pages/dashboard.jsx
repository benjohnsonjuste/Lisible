"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuickActions from "@/components/QuickActions";
import { 
  Sparkles, BookOpen, Loader2, Users, 
  Star, Coins, Zap, ShieldCheck, TrendingUp, ArrowUpRight 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    views: 0, 
    texts: 0, 
    followers: 0,
    liBalance: 0,
    totalCertified: 0,
    estimatedEarnings: "0.00",
    isMonetized: false,
    canWithdraw: false,
    remainingSubscribers: 250
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

  // Fonction pour charger/rafraîchir les données
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
          canWithdraw: data.canWithdraw || false,
          remainingSubscribers: data.remainingSubscribers || 0
        });
      }
    } catch (error) {
      console.error("Erreur Sync Dashboard:", error);
      toast.error("Erreur de synchronisation du portefeuille.");
    }
  };

  // NOUVEAU : Gestion du processus de retrait
  const handleWithdrawal = async () => {
    if (!stats.canWithdraw) return;

    const confirmWithdraw = window.confirm(
      `Souhaitez-vous retirer vos ${stats.estimatedEarnings}$ ? \nUn email d'ordre de paiement sera envoyé au staff.`
    );
    
    if (!confirmWithdraw) return;

    const loadingToast = toast.loading("Traitement de votre demande de paiement...");
    
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amountLi: stats.liBalance,
          amountUSD: stats.estimatedEarnings
        })
      });

      if (res.ok) {
        toast.success("Demande validée ! Votre paiement est en cours de traitement.", { id: loadingToast });
        // Mise à jour immédiate de l'interface
        setStats(prev => ({ 
          ...prev, 
          liBalance: 0, 
          estimatedEarnings: "0.00", 
          canWithdraw: false 
        }));
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors du retrait.");
      }
    } catch (e) {
      toast.error(e.message, { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600 bg-white min-h-screen">
      <Loader2 className="animate-spin h-10 w-10 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calcul des revenus en cours...</p>
    </div>
  );

  const displayName = user?.penName || user?.firstName || "Auteur";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER : LE STUDIO & WALLET */}
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
            Vos revenus sont basés sur vos Lectures Certifiées.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <StatMini 
            label="Mon Solde" 
            value={`${stats.liBalance} Li`} 
            icon={<Coins size={14}/>} 
            color="text-amber-400"
          />
          <StatMini 
            label="Certifications" 
            value={stats.totalCertified} 
            icon={<ShieldCheck size={14}/>} 
            color="text-teal-400"
          />
          <StatMini 
            label="Manuscrits" 
            value={stats.texts} 
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
        
        {/* PROGRESSION MONÉTISATION & RETRAITS */}
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

            <div className="mt-8 pt-6 border-t border-slate-200/50 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gains Accumulés</p>
                  <p className="text-3xl font-black text-slate-900 italic">${stats.estimatedEarnings}</p>
                </div>
                <div className="text-right">
                   {/* BOUTON MIS À JOUR */}
                   <button 
                     onClick={handleWithdrawal}
                     disabled={!stats.canWithdraw}
                     className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${stats.canWithdraw ? 'bg-teal-600 text-white shadow-lg hover:bg-teal-700 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                   >
                     Paiement <ArrowUpRight size={14}/>
                   </button>
                </div>
            </div>
          </div>
        </div>

        {/* ANALYTICS : QUALITÉ VS QUANTITÉ */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-500" />
              Qualité de Lecture
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 flex justify-between items-center group hover:bg-teal-50 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Lectures Certifiées (Li)</span>
                <span className="text-[8px] text-teal-600 font-bold uppercase italic">Revenu généré</span>
              </div>
              <span className="font-black text-slate-900 text-2xl">{stats.totalCertified}</span>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vues (Simples clics)</span>
                <span className="text-[8px] text-slate-300 font-bold uppercase italic">Sans récompense</span>
              </div>
              <span className="font-bold text-slate-400 text-2xl">{stats.views}</span>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-center">
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                 Ratio d'attention : <span className="text-amber-400">{stats.views > 0 ? ((stats.totalCertified / stats.views) * 100).toFixed(1) : 0}%</span>
               </p>
            </div>
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

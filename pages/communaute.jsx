"use client";
import React, { useEffect, useState } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Award, Coins, Sparkles, Edit3,
  TrendingUp, Cake, Crown, Medal, HeartHandshake, Briefcase
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      const files = await res.json();
      if (!Array.isArray(files)) return;
      const dataPromises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
      const allUsers = await Promise.all(dataPromises);
      setAuthors(allUsers.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0)));
    } catch (e) { 
      toast.error("Erreur de synchronisation"); 
    } finally { setLoading(false); }
  }

  const getBadges = (author, allUsers) => {
    const badges = [];
    const email = author.email?.toLowerCase();
    const subs = author.stats?.subscribers || author.subscribers?.length || 0;
    const today = new Date();
    
    if (email === "jb7management@gmail.com") {
      badges.push({ icon: <Crown size={10} />, label: "Fondateur & PDG", color: "bg-slate-950 text-amber-400 border border-amber-500/30" });
    }
    if (email === "robergeaurodley97@gmail.com") {
      badges.push({ icon: <Briefcase size={10} />, label: "DG", color: "bg-blue-900 text-white" });
    }
    if (email === "woolsleypierre01@gmail.com") {
      badges.push({ icon: <ShieldCheck size={10} />, label: "Directrice Éditoriale", color: "bg-purple-700 text-white" });
    }
    if (email === "adm.lablitteraire7@gmail.com" || email === "cmo.lablitteraire7@gmail.com") {
      badges.push({ icon: <ShieldCheck size={10} />, label: "Staff Officiel", color: "bg-indigo-600 text-white" });
    }

    if (author.birthday) {
      const bDay = new Date(author.birthday);
      if (bDay.getDate() === today.getDate() && bDay.getMonth() === today.getMonth()) {
        badges.push({ icon: <Cake size={10} />, label: "Joyeux anniversaire à moi", color: "bg-pink-500 text-white animate-bounce" });
      }
    }

    const excluded = ["jb7management@gmail.com", "adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"];
    if (!excluded.includes(email)) {
      const eligible = allUsers.filter(u => !excluded.includes(u.email?.toLowerCase()));

      const topWriter = [...eligible].sort((a, b) => (b.stats?.totalTexts || 0) - (a.stats?.totalTexts || 0))[0];
      if (topWriter && email === topWriter.email && (author.stats?.totalTexts > 0)) {
        badges.push({ icon: <Edit3 size={10} />, label: "Encrier", color: "bg-teal-600 text-white" });
      }

      const topElite = [...eligible].sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0))[0];
      if (topElite && email === topElite.email) {
        badges.push({ icon: <Medal size={10} />, label: "Élite", color: "bg-amber-500 text-white shadow-amber-200" });
      }

      const topVIP = [...eligible].sort((a, b) => {
        const sentA = a.wallet?.history?.filter(h => h.type === "gift_sent").length || 0;
        const sentB = b.wallet?.history?.filter(h => h.type === "gift_sent").length || 0;
        return sentB - sentA;
      })[0];
      if (topVIP && email === topVIP.email) {
        badges.push({ icon: <Gem size={10} />, label: "VIP", color: "bg-rose-600 text-white" });
      }
    }

    if (subs >= 5000) {
      badges.push({ icon: <Sparkles size={10} />, label: "Compte Diamant", color: "bg-cyan-400 text-slate-900 font-bold" });
    } else if (subs >= 3000) {
      badges.push({ icon: <Award size={10} />, label: "Compte Or", color: "bg-yellow-400 text-yellow-900" });
    } else if (subs >= 1000) {
      badges.push({ icon: <Award size={10} />, label: "Compte Argent", color: "bg-slate-300 text-slate-800" });
    } else if (subs >= 250) {
      badges.push({ icon: <Award size={10} />, label: "Compte Bronze", color: "bg-orange-600 text-white" });
    }

    return badges;
  };

  const filtered = authors.filter(a => 
    (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture de la bibliothèque...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <h1 className="text-6xl md:text-8xl font-black italic text-slate-900 tracking-tighter leading-[0.8]">Communauté</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 mt-4 flex items-center gap-2">
            <TrendingUp size={14} /> Le cercle d'or de la littérature
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Chercher une plume..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl pl-14 pr-6 py-5 text-sm font-bold outline-none focus:border-teal-500/20 transition-all" 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {filtered.map((a) => (
          <div key={a.email} className="relative bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-teal-200 transition-all">
            
            <div className="absolute -top-5 left-8 flex flex-wrap gap-2 max-w-[95%] z-20">
              {getBadges(a, authors).map((b, i) => (
                <div key={i} className={`${b.color} px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg text-[8px] font-black uppercase tracking-tighter`}>
                  {b.icon} {b.label}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-8 mt-4">
              <div className="relative">
                {/* Bordure large style réseaux sociaux avec padding pour l'effet d'épaisseur */}
                <div className="p-1.5 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-[2.8rem] shadow-inner">
                  <img 
                    src={a.profilePic || `https://api.dicebear.com/7.x/micah/svg?seed=${a.penName || a.email}&backgroundColor=f8fafc`} 
                    className="w-24 h-24 rounded-[2.2rem] object-cover bg-white border-2 border-white shadow-sm" 
                    alt={a.penName}
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/micah/svg?seed=${a.email}&backgroundColor=f8fafc`; }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter">{a.penName || "Plume"}</h2>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
                    <UsersIcon size={12}/> {a.stats?.subscribers || a.subscribers?.length || 0}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                    <Coins size={12}/> {a.wallet?.balance || 0} Li
                  </div>
                </div>
              </div>
            </div>
            
            <Link 
              href={`/auteur/${encodeURIComponent(a.email)}`} 
              className="mt-10 flex items-center justify-center gap-3 w-full py-5 bg-slate-950 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all"
            >
              Voir le catalogue <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

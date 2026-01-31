"use client";
import React, { useEffect, useState } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Award, Coins, Sparkles, Edit3,
  TrendingUp, Cake, Crown 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setCurrentUser(JSON.parse(logged));
      await loadUsers();
    };
    loadData();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      const files = await res.json();
      const dataPromises = files.filter(f => f.name.endsWith('.json')).map(f => 
        fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json())
      );
      const allUsers = await Promise.all(dataPromises);
      // Tri par solde Li
      setAuthors(allUsers.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0)));
    } catch (e) { 
      toast.error("Erreur de synchronisation"); 
    } finally { 
      setLoading(false); 
    }
  }

  // --- LOGIQUE DES BADGES ---
  const getBadges = (author, allUsers) => {
    const badges = [];
    const email = author.email?.toLowerCase();
    const subs = author.stats?.subscribers || 0;
    const texts = author.stats?.totalTexts || 0;
    const today = new Date();

    // 1. BADGE PGD (Exclusif jb7management)
    if (email === "jb7management@gmail.com") {
      badges.push({ 
        icon: <Crown size={10} />, 
        label: "PGD", 
        color: "bg-slate-950 text-amber-400 border border-amber-500/30" 
      });
    }

    // 2. BADGE STAFF (Exclusif admins)
    const staffEmails = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"];
    if (staffEmails.includes(email)) {
      badges.push({ icon: <ShieldCheck size={10} />, label: "Staff", color: "bg-indigo-600 text-white" });
    }

    // 3. BADGE ANNIVERSAIRE (Valable 24h le jour J)
    if (author.birthday) {
      const bDay = new Date(author.birthday);
      if (bDay.getDate() === today.getDate() && bDay.getMonth() === today.getMonth()) {
        badges.push({ 
          icon: <Cake size={10} />, 
          label: "Joyeux anniversaire à moi", 
          color: "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20" 
        });
      }
    }

    // 4. PLUME DE LA SEMAINE (Reset Samedi - Exclut PGD & Staff)
    const excludedEmails = ["jb7management@gmail.com", "adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"];
    if (!excludedEmails.includes(email)) {
      const eligible = allUsers.filter(u => !excludedEmails.includes(u.email?.toLowerCase()));
      const topWriter = [...eligible].sort((a, b) => (b.stats?.totalTexts || 0) - (a.stats?.totalTexts || 0))[0];
      
      // On affiche le badge si c'est le top writer et qu'on est Samedi (Day 6)
      if (topWriter && email === topWriter.email && (author.stats?.totalTexts > 0)) {
        badges.push({ 
          icon: <TrendingUp size={10} />, 
          label: "Plume de la semaine", 
          color: "bg-teal-500 text-white shadow-md shadow-teal-500/20" 
        });
      }
    }

    // 5. PALIERS PRESTIGE (Basé sur abonnés)
    if (texts >= 1) badges.push({ icon: <Edit3 size={10} />, label: "Plume", color: "bg-slate-900 text-white" });
    if (subs >= 2000) badges.push({ icon: <Sparkles size={10} />, label: "Diamant", color: "bg-cyan-500 text-white" });
    else if (subs >= 750) badges.push({ icon: <Award size={10} />, label: "Or", color: "bg-amber-400 text-slate-900" });
    else if (subs >= 250) badges.push({ icon: <Award size={10} />, label: "Bronze", color: "bg-orange-700 text-white" });

    return badges;
  };

  const filtered = authors.filter(a => 
    (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-6xl font-black italic text-slate-900 tracking-tighter leading-none">Communauté</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 mt-2">L'Arène des auteurs certifiés</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-4 ring-teal-50 transition-all" 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((a) => (
          <div key={a.email} className="relative bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl group hover:border-teal-100 transition-all duration-300">
            {/* Affichage des Badges */}
            <div className="absolute -top-3 left-6 flex flex-wrap gap-2 max-w-[85%] z-10">
              {getBadges(a, authors).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm text-[8px] font-black uppercase tracking-tighter`}>
                  {b.icon} {b.label}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-4">
              <img 
                src={a.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.email}`} 
                className="w-20 h-20 rounded-[1.8rem] object-cover bg-slate-100 border-2 border-white shadow-md transition-transform group-hover:scale-105" 
                alt="Profile"
              />
              <div>
                <h2 className="text-2xl font-black italic text-slate-900 leading-tight">{a.penName || a.name || "Anonyme"}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <UsersIcon size={12} className="text-slate-300" />
                   <span className="text-[10px] font-black text-slate-400">{a.stats?.subscribers || 0} abonnés</span>
                   <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md ml-2">{a.wallet?.balance || 0} Li</span>
                </div>
              </div>
            </div>
            
            <Link 
              href={`/auteur/${encodeURIComponent(a.email)}`} 
              className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all active:scale-95"
            >
              Explorer l'œuvre <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

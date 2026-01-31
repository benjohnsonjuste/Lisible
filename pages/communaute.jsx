"use client";
import React, { useEffect, useState } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, 
  ArrowRight, Crown, Loader2, ShieldCheck, 
  Search, Star, Gem, Award, Coins
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UsersPage() {
  const router = useRouter();
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
      if (!res.ok) throw new Error("Erreur Registre");
      const files = await res.json();
      const dataPromises = files.filter(f => f.name.endsWith('.json')).map(f => 
        fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()).catch(() => null)
      );
      const allUsers = (await Promise.all(dataPromises)).filter(u => u !== null);
      // Tri par influence (Solde Li)
      setAuthors(allUsers.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0)));
    } catch (e) { 
      toast.error("Impossible de synchroniser le cercle");
    } finally { setLoading(false); }
  }

  const getBadges = (author, allUsers) => {
    const badges = [];
    const email = author.email?.toLowerCase();

    // 1. STAFF OFFICIEL
    if (email === "cmo.lablitteraire7@gmail.com") {
      badges.push({ icon: <ShieldCheck size={12} />, label: "Staff Officiel", color: "bg-indigo-600 text-white" });
    }

    // 2. PLUME DE LA SEMAINE (Plus gros gains cumulés)
    const topEarner = [...allUsers].sort((a, b) => (b.wallet?.totalEarned || 0) - (a.wallet?.totalEarned || 0))[0];
    if (topEarner && email === topEarner.email && (author.wallet?.totalEarned > 0)) {
      badges.push({ icon: <Award size={12} />, label: "Plume de la Semaine", color: "bg-amber-400 text-slate-900" });
    }

    // 3. VIP (Plus grand nombre de cadeaux envoyés)
    const topGiver = [...allUsers].sort((a, b) => {
      const countA = a.wallet?.history?.filter(h => h.type === "gift_sent").length || 0;
      const countB = b.wallet?.history?.filter(h => h.type === "gift_sent").length || 0;
      return countB - countA;
    })[0];
    if (topGiver && email === topGiver.email && (author.wallet?.history?.length > 5)) {
      badges.push({ icon: <Gem size={12} />, label: "Mécène VIP", color: "bg-rose-500 text-white" });
    }
    return badges;
  };

  const filteredAuthors = authors.filter(a => (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture du Cercle...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4">
          <div className="inline-flex p-4 bg-slate-900 text-teal-400 rounded-3xl shadow-xl"><UsersIcon size={32} /></div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">Communauté</h1>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input type="text" placeholder="Rechercher une plume..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-5 text-sm font-bold outline-none ring-teal-50 focus:ring-4 transition-all" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.map((a) => (
          <div key={a.email} className="relative bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl transition-all hover:-translate-y-1 group">
            
            <div className="absolute -top-4 left-6 flex flex-wrap gap-2 z-10">
              {getBadges(a, authors).map((badge, idx) => (
                <div key={idx} className={`${badge.color} px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg`}>
                  {badge.icon} <span className="text-[9px] font-black uppercase tracking-widest">{badge.label}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-start pt-4">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-xl">
                  <img src={a.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h2 className="font-black text-2xl text-slate-900 italic">{a.penName || "Anonyme"}</h2>
                  <div className="flex gap-3 mt-2">
                    <span className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-1 rounded-lg text-[10px] font-black italic">
                      {a.subscribers?.length || 0} Abonnés
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-[10px] font-black italic">
                      {a.wallet?.balance || 0} Li
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Link href={`/auteur/${encodeURIComponent(a.email)}`} className="mt-8 flex items-center justify-center gap-3 w-full py-5 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-[0.3em]">
              Explorer la Galerie <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Award, Coins 
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
      if (!res.ok) throw new Error();
      const files = await res.json();
      const dataPromises = files.filter(f => f.name.endsWith('.json')).map(f => 
        fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()).catch(() => null)
      );
      const allUsers = (await Promise.all(dataPromises)).filter(u => u !== null);
      setAuthors(allUsers.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0)));
    } catch (e) { toast.error("Erreur de synchronisation"); } 
    finally { setLoading(false); }
  }

  const getBadges = (author, allUsers) => {
    const badges = [];
    const email = author.email?.toLowerCase();
    if (email === "cmo.lablitteraire7@gmail.com") {
      badges.push({ icon: <ShieldCheck size={12} />, label: "Staff Officiel", color: "bg-indigo-600 text-white" });
    }
    const topEarner = [...allUsers].sort((a, b) => (b.wallet?.totalEarned || 0) - (a.wallet?.totalEarned || 0))[0];
    if (topEarner && email === topEarner.email && (author.wallet?.totalEarned > 0)) {
      badges.push({ icon: <Award size={12} />, label: "Plume de la Semaine", color: "bg-amber-400 text-slate-900" });
    }
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

  const filtered = authors.filter(a => (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-6xl font-black italic text-slate-900 tracking-tighter">Communauté</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600">L'Économie de l'Esprit</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none ring-teal-50 focus:ring-4" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((a) => (
          <div key={a.email} className="relative bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl group">
            <div className="absolute -top-3 left-6 flex gap-2">
              {getBadges(a, authors).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg text-[9px] font-black uppercase`}>
                  {b.icon} {b.label}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4">
              <img src={a.profilePic || "/avatar.png"} className="w-20 h-20 rounded-[1.5rem] object-cover bg-slate-100" />
              <div>
                <h2 className="text-2xl font-black italic">{a.penName || "Anonyme"}</h2>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{a.wallet?.balance || 0} Li</span>
                </div>
              </div>
            </div>
            <Link href={`/auteur/${encodeURIComponent(a.email)}`} className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all">
              Voir le Profil <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

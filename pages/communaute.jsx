"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Award, Coins, Sparkles, Edit3,
  TrendingUp, Crown, Medal, Briefcase, Star, ChevronDown
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UsersPage({ initialAuthors = [] }) {
  const [authors, setAuthors] = useState(initialAuthors);
  const [loading, setLoading] = useState(initialAuthors.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setCurrentUser(JSON.parse(loggedUser));
    if (initialAuthors.length === 0) loadUsers();
  }, [initialAuthors]);

  async function loadUsers() {
    try {
      // Appel à l'API unifiée pour récupérer tous les profils avec stats
      const res = await fetch(`/api/all-authors?t=${Date.now()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      // On s'assure que les données sont légères et triées par solde Li
      const sortedAuthors = (data.authors || []).sort((a, b) => 
        (Number(b.wallet?.balance) || 0) - (Number(a.wallet?.balance) || 0)
      );
      
      setAuthors(sortedAuthors);
    } catch (e) { 
      toast.error("Erreur de synchronisation du Cercle"); 
    } finally { setLoading(false); }
  }

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === targetEmail) return toast.error("Action impossible");
    setSubmitting(targetEmail);
    try {
      const res = await fetch("/api/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerEmail: currentUser.email, targetEmail: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.isSubscribed ? "Abonnement réussi" : "Désabonnement réussi");
      
      setAuthors(prev => prev.map(a => 
        a.email === targetEmail 
          ? { ...a, subscribers: data.isSubscribed 
              ? [...(a.subscribers || []), currentUser.email] 
              : (a.subscribers || []).filter(e => e !== currentUser.email) 
            } 
          : a
      ));
    } catch (err) { toast.error("Action momentanément indisponible"); }
    finally { setSubmitting(null); }
  };

  const getBadges = (author) => {
    const badges = [];
    const email = author.email?.toLowerCase().trim();
    
    // Badges de Rôle (Priorité Haute)
    if (email === "jb7management@gmail.com") badges.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-950 text-amber-400 border border-amber-500/30" });
    if (email === "robergeaurodley97@gmail.com") badges.push({ icon: <Briefcase size={10} />, label: "Dir. Général", color: "bg-blue-600 text-white" });
    if (email === "jeanpierreborlhaïniedarha@gmail.com") badges.push({ icon: <Briefcase size={10} />, label: "Dir. Marketing", color: "bg-red-600 text-white" });
    if (email === "woolsleypierre01@gmail.com") badges.push({ icon: <ShieldCheck size={10} />, label: "Dir. Éditoriale", color: "bg-purple-700 text-white" });
    if (email === "cmo.lablitteraire7@gmail.com" || email === "adm.lablitteraire7@gmail.com") badges.push({ icon: <ShieldCheck size={10} />, label: "Admin", color: "bg-teal-700 text-white shadow-md" });
    
    // Badges d'activité (Basés sur les flags ou les Li)
    if (author.hasBattleHistory || author.wallet?.history?.some(h => h.isConcours === true)) {
      badges.push({ icon: <Star size={10} />, label: "Guerrier Battle", color: "bg-indigo-500 text-white" });
    }
    if ((author.wallet?.balance || 0) > 10000) {
      badges.push({ icon: <Gem size={10} />, label: "Plume d'Élite", color: "bg-amber-100 text-amber-700 border border-amber-200" });
    }
    
    return badges;
  };

  const filteredAuthors = useMemo(() => {
    return authors.filter(a => 
      (a.penName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [authors, searchTerm]);

  const paginatedAuthors = filteredAuthors.slice(0, visibleCount);

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Rassemblement du Cercle...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-16 animate-in fade-in duration-1000 font-sans bg-[#FCFBF9]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
        <div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black italic text-slate-900 tracking-tighter leading-tight">Communauté</h1>
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 mt-4 flex items-center gap-2">
            <TrendingUp size={14} /> Le Cercle d'Or des Plumes
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Chercher une plume..." 
            value={searchTerm} 
            onChange={(e) => {setSearchTerm(e.target.value); setVisibleCount(10);}} 
            className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:border-teal-500/20 transition-all shadow-sm" 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {paginatedAuthors.map((a) => {
          const isFollowing = a.subscribers?.includes(currentUser?.email);
          const balance = Number(a.wallet?.balance || 0);
          
          return (
            <div key={a.email} className="relative bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-teal-200 transition-all flex flex-col justify-between">
              {/* Badges Floating */}
              <div className="absolute -top-4 left-4 md:left-8 flex flex-wrap gap-2 max-w-[95%] z-20">
                {getBadges(a).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg text-[7px] md:text-[8px] font-black uppercase tracking-tighter`}>
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 mt-6 text-center sm:text-left">
                <div className="relative flex-shrink-0">
                  <div className="aspect-square p-1 bg-gradient-to-tr from-teal-400 to-amber-400 rounded-full shadow-inner">
                    <div className="p-1 bg-white rounded-full h-full w-full overflow-hidden relative">
                      <img 
                        src={a.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${a.penName || a.email}&backgroundColor=f1f5f9`} 
                        alt={a.penName} 
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 flex-grow overflow-hidden">
                  <h2 className="text-2xl md:text-3xl font-black italic text-slate-900 tracking-tighter truncate">
                    {a.penName || "Plume Anonyme"}
                  </h2>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
                      <UsersIcon size={12}/> {a.subscribers?.length || 0} Abonnés
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                      <Coins size={12}/> {balance.toLocaleString()} Li
                    </div>
                  </div>

                  {currentUser?.email !== a.email && (
                    <button 
                      onClick={() => handleFollow(a.email)} 
                      disabled={submitting === a.email} 
                      className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        isFollowing ? "bg-slate-100 text-slate-500" : "bg-teal-600 text-white shadow-md hover:bg-slate-900"
                      }`}
                    >
                      {submitting === a.email ? <Loader2 size={12} className="animate-spin" /> : (isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />)}
                      {isFollowing ? "Désabonner" : "Suivre la plume"}
                    </button>
                  )}
                </div>
              </div>

              <Link 
                href={`/auteur/${a.email}`} 
                className="mt-8 md:mt-10 flex items-center justify-center gap-3 w-full py-4 md:py-5 bg-slate-950 text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg"
              >
                Voir le catalogue <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
      </div>

      {visibleCount < filteredAuthors.length && (
        <div className="mt-16 flex justify-center">
          <button onClick={() => setVisibleCount(prev => prev + 12)} className="group flex flex-col items-center gap-4 transition-all">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-teal-600">Découvrir plus</span>
            <div className="p-4 bg-white border border-slate-100 rounded-full shadow-xl group-hover:bg-teal-600 group-hover:text-white transition-all animate-bounce">
              <ChevronDown size={24} />
            </div>
          </button>
        </div>
      )}

      <footer className="mt-24 text-center border-t border-slate-100 pt-10">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Cercle des Auteurs Lisible • 2026</p>
      </footer>
    </div>
  );
}

export async function getStaticProps() {
  try {
    // Note: Pour SSG, on continue de fetcher via GitHub mais avec une logique de réduction drastique du payload
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users`);
    const files = await res.json();
    
    if (Array.isArray(files)) {
      const selectedFiles = files.filter(f => f.name.endsWith('.json')).slice(0, 50);
      const promises = selectedFiles.map(f => fetch(f.download_url).then(r => r.json()));
      const allUsers = await Promise.all(promises);
      
      const uniqueAuthors = allUsers.map(user => ({
        email: user.email,
        penName: user.penName || user.name || "Plume",
        profilePic: user.profilePic || null,
        subscribers: user.subscribers || [],
        wallet: { balance: user.wallet?.balance || 0 },
        // On remplace l'historique par un simple booléen pour alléger le JSON (1.6MB -> ~100KB)
        hasBattleHistory: (user.wallet?.history || []).some(h => h.isConcours === true)
      })).sort((a, b) => (b.wallet.balance) - (a.wallet.balance));

      return { props: { initialAuthors: uniqueAuthors }, revalidate: 60 };
    }
  } catch (e) { console.error("Erreur SSG Community:", e); }
  return { props: { initialAuthors: [] }, revalidate: 10 };
}

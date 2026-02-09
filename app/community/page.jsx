"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Coins, TrendingUp, 
  Crown, Briefcase, ChevronDown 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setCurrentUser(JSON.parse(loggedUser));
    loadUsers();
  }, []);

  // Chargement via l'API fusionnée
  async function loadUsers() {
    try {
      // Utilisation de l'action 'library' ou un endpoint spécifique si tu as créé type=users_list
      // Ici, on récupère les fichiers du dossier users via ton API
      const res = await fetch(`/api/github-db?type=users_list`); 
      // Note: Si tu n'as pas encore créé type=users_list, utilise une version qui liste le dossier data/users/
      const data = await res.json();
      
      if (data && data.users) {
        // Tri par richesse (Li)
        const sorted = data.users.sort((a, b) => (Number(b.li) || 0) - (Number(a.li) || 0));
        setAuthors(sorted);
      }
    } catch (e) { 
      toast.error("Connexion au Cercle interrompue"); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    setSubmitting(targetEmail);
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "toggle_follow", 
          userEmail: currentUser.email, 
          targetEmail: targetEmail 
        })
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.following ? "Vous suivez cette plume" : "Abonnement retiré");
        
        // Mise à jour locale pour éviter un rechargement complet
        setAuthors(prev => prev.map(auth => {
          if (auth.email === targetEmail) {
            const currentFollowers = auth.followers || [];
            return {
              ...auth,
              followers: result.following 
                ? [...currentFollowers, currentUser.email] 
                : currentFollowers.filter(e => e !== currentUser.email)
            };
          }
          return auth;
        }));
      }
    } catch (err) { 
      toast.error("Action impossible"); 
    } finally { 
      setSubmitting(null); 
    }
  };

  const getBadges = (author) => {
    const badges = [];
    const email = author.email?.toLowerCase().trim();
    
    if (email === "jb7management@gmail.com") badges.push({ icon: <Crown size={10} />, label: "CEO", color: "bg-slate-950 text-amber-400 border border-amber-500/30" });
    if (email === "robergeaurodley97@gmail.com") badges.push({ icon: <Briefcase size={10} />, label: "DG", color: "bg-blue-600 text-white" });
    if (email === "cmo.lablitteraire7@gmail.com") badges.push({ icon: <ShieldCheck size={10} />, label: "Staff", color: "bg-teal-600 text-white" });
    
    if ((author.followers?.length || 0) > 50) {
      badges.push({ icon: <Gem size={10} />, label: "Elite", color: "bg-amber-100 text-amber-700" });
    }
    
    return badges;
  };

  const filteredAuthors = useMemo(() => {
    return authors.filter(a => 
      (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [authors, searchTerm]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#FCFBF9]">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture du registre...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-8">
        <div className="space-y-4">
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-slate-900">Cercle.</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-teal-600 flex items-center gap-2">
            <TrendingUp size={14} /> Réseau des auteurs certifiés
          </p>
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold shadow-sm focus:border-teal-500/20 transition-all outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a) => {
          const isFollowing = a.followers?.includes(currentUser?.email);
          const emailBase64 = btoa(a.email);

          return (
            <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-teal-500/10 transition-all relative overflow-hidden">
              <div className="absolute top-8 right-8 flex gap-2">
                {getBadges(a).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-tighter flex items-center gap-1.5 shadow-sm`}>
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-50">
                    <img 
                      src={a.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${a.email}`} 
                      alt={a.penName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>

                <div className="flex-grow space-y-4 text-center sm:text-left">
                  <h2 className="text-3xl md:text-4xl font-black italic text-slate-900 tracking-tighter">
                    {a.penName || a.name || "Plume"}
                  </h2>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                      <UsersIcon size={12}/> {a.followers?.length || 0}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                      <Coins size={12}/> {a.li || 0} Li
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center sm:justify-start pt-2">
                    <button 
                      onClick={() => handleFollow(a.email)}
                      className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        isFollowing ? "bg-slate-100 text-slate-400" : "bg-slate-950 text-white hover:bg-teal-600"
                      }`}
                    >
                      {submitting === a.email ? "..." : (isFollowing ? "Désabonné" : "Suivre")}
                    </button>
                    <Link 
                      href={`/author/${emailBase64}`}
                      className="px-6 py-2.5 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                      Catalogue <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < filteredAuthors.length && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={() => setVisibleCount(v => v + 10)}
            className="flex flex-col items-center gap-4 group"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Charger plus de plumes</span>
            <div className="p-4 bg-white rounded-full shadow-lg border border-slate-100 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <ChevronDown size={24} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

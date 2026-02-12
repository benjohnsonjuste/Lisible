"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Coins, TrendingUp, 
  Crown, Briefcase, ChevronDown, PenTool, BarChart3, Star, Settings
} from "lucide-react"; // Corrigé : lucide-react au lieu de lucide-center
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

  async function loadUsers() {
    try {
      const res = await fetch(`/api/github-db?type=users_list`); 
      const data = await res.json();
      
      if (data && data.users) {
        // Tri Universel appliqué au Cercle : Certifications > Likes > Fortune (Li)
        const sorted = data.users.sort((a, b) => {
          const certA = Number(a.certified || a.totalCertified || 0);
          const certB = Number(b.certified || b.totalCertified || 0);
          if (certB !== certA) return certB - certA;

          const likesA = Number(a.likes || a.totalLikes || 0);
          const likesB = Number(b.likes || b.totalLikes || 0);
          if (likesB !== likesA) return likesB - likesA;

          return (Number(b.li) || 0) - (Number(a.li) || 0);
        });
        setAuthors(sorted);
      }
    } catch (e) { 
      toast.error("Le registre des auteurs est momentanément scellé."); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === targetEmail) return toast.error("Vous ne pouvez pas vous suivre vous-même");
    
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
        toast.success(result.isFollowing ? "Abonnement réussi" : "Abonnement retiré");
        
        setAuthors(prev => prev.map(auth => {
          if (auth.email === targetEmail) {
            const currentFollowers = auth.followers || [];
            return {
              ...auth,
              followers: result.isFollowing 
                ? [...currentFollowers, currentUser.email] 
                : currentFollowers.filter(e => e !== currentUser.email)
            };
          }
          return auth;
        }));
      }
    } catch (err) { 
      toast.error("Le Grand Livre n'a pas pu valider cette action."); 
    } finally { 
      setSubmitting(null); 
    }
  };

  const getBadges = (author) => {
    const badges = [];
    const email = author.email?.toLowerCase().trim();
    
    if (email === "adm.lablitteraire7@gmail.com") {
      badges.push({ icon: <Settings size={10} />, label: "Admin", color: "bg-rose-600 text-white shadow-lg" });
    }
    else if (email === "jb7management@gmail.com") {
      badges.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400 border border-amber-500/20" });
    }
    else if (email === "robergeaurodley97@gmail.com") {
      badges.push({ icon: <Briefcase size={10} />, label: "DG", color: "bg-indigo-600 text-white" });
    }
    else if (email === "woolsleypierre01@gmail.com") {
      badges.push({ icon: <PenTool size={10} />, label: "Dir. Éditoriale", color: "bg-purple-600 text-white" });
    }
    else if (email === "jeanpierreborlhaïniedarha@gmail.com") {
      badges.push({ icon: <BarChart3 size={10} />, label: "Dir. Marketing", color: "bg-blue-600 text-white" });
    }
    else if (email === "cmo.lablitteraire7@gmail.com") {
      badges.push({ icon: <ShieldCheck size={10} />, label: "Support Team", color: "bg-teal-600 text-white" });
    }
    
    if ((author.followers?.length || 0) > 10) {
      badges.push({ icon: <Star size={10} />, label: "Plume d'Or", color: "bg-amber-100 text-amber-700" });
    }

    if ((author.certified || author.totalCertified || 0) > 0) {
      badges.push({ icon: <ShieldCheck size={10} />, label: "Certifié", color: "bg-teal-100 text-teal-700 border border-teal-200" });
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
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Consultation du Cercle...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-8">
        <div className="space-y-4">
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-slate-900">Cercle.</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-teal-600 flex items-center gap-2">
            <TrendingUp size={14} /> Réseau des auteurs de Lisible
          </p>
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold shadow-sm focus:border-teal-500 transition-all outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a) => {
          const isFollowing = a.followers?.includes(currentUser?.email);
          const emailBase64 = btoa(a.email);

          return (
            <div key={a.email} className="group bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:border-teal-500/20 transition-all relative overflow-hidden">
              <div className="absolute top-6 right-8 flex flex-col items-end gap-2 z-10">
                {getBadges(a).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm`}>
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 relative">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-slate-50 flex-shrink-0">
                  <img 
                    src={a.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${a.email}`} 
                    alt={a.penName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="flex-grow space-y-4 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter leading-none">
                      {a.penName || a.name || "Plume Anonyme"}
                    </h2>
                    {(a.certified || a.totalCertified) > 0 && <ShieldCheck size={20} className="text-teal-500" />}
                  </div>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <UsersIcon size={12} className="text-slate-300"/> {a.followers?.length || 0} Abonnés
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-widest">
                      <Coins size={12}/> {a.li || 0} Li
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center sm:justify-start pt-2">
                    <button 
                      onClick={() => handleFollow(a.email)}
                      disabled={submitting === a.email}
                      className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                        isFollowing 
                        ? "bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600" 
                        : "bg-slate-950 text-white hover:bg-teal-600 shadow-lg shadow-slate-900/10"
                      }`}
                    >
                      {submitting === a.email ? <Loader2 size={12} className="animate-spin"/> : (isFollowing ? "Se désabonner" : "Suivre la plume")}
                    </button>
                    <Link 
                      href={`/author/${emailBase64}`}
                      className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
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
        <div className="mt-24 flex justify-center">
          <button 
            onClick={() => setVisibleCount(v => v + 10)}
            className="group flex flex-col items-center gap-4"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-teal-600 transition-colors">Explorer plus d'horizons</span>
            <div className="p-5 bg-white rounded-full shadow-xl border border-slate-50 group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:translate-y-2">
              <ChevronDown size={28} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

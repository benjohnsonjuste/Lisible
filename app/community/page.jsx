"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Coins, TrendingUp, 
  Crown, Briefcase, ChevronDown, PenTool, BarChart3, Star, Settings
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      try {
        setCurrentUser(JSON.parse(loggedUser));
      } catch (e) {
        console.error("Erreur parsing user");
      }
    }
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      // On utilise 'library' qui est le type supporté par ton API pour récupérer l'index
      const res = await fetch(`/api/github-db?type=library`); 
      const json = await res.json();
      
      // json.content contient la liste des textes de l'index
      if (json && Array.isArray(json.content)) {
        const uniqueAuthorsMap = new Map();

        json.content.forEach(pub => {
          if (pub.authorEmail) {
            const email = pub.authorEmail.toLowerCase().trim();
            if (!uniqueAuthorsMap.has(email)) {
              uniqueAuthorsMap.set(email, {
                name: pub.author || "Plume Anonyme",
                penName: pub.author || "Plume Anonyme",
                email: email,
                followers: pub.followers || [],
                certified: Number(pub.certified || pub.totalCertified || 0),
                li: Number(pub.li || 0),
                likes: Number(pub.likes || 0)
              });
            } else {
              // On cumule les stats si l'auteur apparaît plusieurs fois dans l'index
              const existing = uniqueAuthorsMap.get(email);
              existing.certified = Math.max(existing.certified, Number(pub.certified || 0));
              existing.likes += Number(pub.likes || 0);
            }
          }
        });

        const sorted = Array.from(uniqueAuthorsMap.values()).sort((a, b) => {
          if (b.certified !== a.certified) return b.certified - a.certified;
          return b.likes - a.likes;
        });
        
        setAuthors(sorted);
      }
    } catch (e) { 
      console.error("Load users error:", e);
      toast.error("Le registre des auteurs est momentanément scellé."); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === targetEmail) return toast.error("Action impossible sur soi-même");
    
    setSubmitting(targetEmail);
    try {
      const isCurrentlyFollowing = authors.find(a => a.email === targetEmail)?.followers?.includes(currentUser.email);
      
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: isCurrentlyFollowing ? "unfollow" : "follow", 
          userEmail: currentUser.email, 
          targetEmail: targetEmail 
        })
      });

      if (res.ok) {
        toast.success(!isCurrentlyFollowing ? "Abonnement réussi" : "Abonnement retiré");
        // Mise à jour locale immédiate de l'UI pour la réactivité
        setAuthors(prev => prev.map(auth => {
          if (auth.email === targetEmail) {
            const newFollowers = isCurrentlyFollowing 
              ? auth.followers.filter(e => e !== currentUser.email)
              : [...(auth.followers || []), currentUser.email];
            return { ...auth, followers: newFollowers };
          }
          return auth;
        }));
      }
    } catch (err) { 
      toast.error("Erreur de liaison avec les archives."); 
    } finally { 
      setSubmitting(null); 
    }
  };

  const getBadges = (author) => {
    const badges = [];
    const email = author.email?.toLowerCase().trim();
    
    if (email === "adm.lablitteraire7@gmail.com") {
      badges.push({ icon: <Settings size={10} />, label: "Admin", color: "bg-rose-600 text-white shadow-lg" });
    } else if (email === "jb7management@gmail.com") {
      badges.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400 border border-amber-500/20" });
    }
    
    if ((author.followers?.length || 0) >= 5) {
      badges.push({ icon: <Star size={10} />, label: "Plume d'Or", color: "bg-amber-100 text-amber-700" });
    }

    if (author.certified > 0) {
      badges.push({ icon: <ShieldCheck size={10} />, label: "Certifié", color: "bg-teal-100 text-teal-700 border border-teal-200" });
    }
    
    return badges;
  };

  const filteredAuthors = useMemo(() => {
    return authors.filter(a => 
      (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [authors, searchTerm]);

  if (!mounted) return null;

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
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">Cercle.</h1>
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
                    src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(a.email)}`} 
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="flex-grow space-y-4 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter leading-none">
                      {a.penName || a.name || "Plume Anonyme"}
                    </h2>
                    {a.certified > 0 && <ShieldCheck size={20} className="text-teal-500" />}
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
                      {submitting === a.email ? <Loader2 size={12} className="animate-spin"/> : (isFollowing ? "Désabonner" : "Suivre")}
                    </button>
                    <Link 
                      href={`/author/${encodeURIComponent(a.email)}`}
                      className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      Profil <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAuthors.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun auteur trouvé dans le Cercle.</p>
        </div>
      )}

      {visibleCount < filteredAuthors.length && (
        <div className="mt-24 flex justify-center">
          <button 
            onClick={() => setVisibleCount(v => v + 10)}
            className="group flex flex-col items-center gap-4"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-teal-600 transition-colors">Explorer plus</span>
            <div className="p-5 bg-white rounded-full shadow-xl border border-slate-50 group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:translate-y-2">
              <ChevronDown size={28} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

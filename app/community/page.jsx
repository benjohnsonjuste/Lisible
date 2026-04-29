"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, ChevronDown, TrendingUp, Star, Settings, 
  Briefcase, HeartHandshake, Feather
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CommunautePage() {
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
      try { setCurrentUser(JSON.parse(loggedUser)); } catch (e) {}
    }
    loadCommunauteData();
  }, []);

  async function loadCommunauteData() {
    try {
      // 1. Récupération des publications (data/publications)
      const libRes = await fetch(`/api/github-db?type=library`); 
      const libJson = await libRes.json();
      
      // 2. Récupération des utilisateurs (data/users)
      const usersRes = await fetch(`/api/github-db?type=users`);
      const usersJson = await usersRes.json();

      if (usersJson && Array.isArray(usersJson.content)) {
        const publications = libJson.content || [];
        
        // On construit la liste basée sur les utilisateurs réels de data/users
        const community = usersJson.content.map(user => {
          const email = user.email?.toLowerCase().trim();
          
          // Agrégation des stats depuis data/publications
          const userPubs = publications.filter(p => p.authorEmail?.toLowerCase().trim() === email);
          
          return {
            ...user,
            name: user.penName || user.name || "Plume Anonyme",
            email: email,
            image: user.profilePic || user.image || null,
            followers: user.followers || [],
            worksCount: userPubs.length,
            certified: userPubs.reduce((acc, p) => acc + Number(p.certified || 0), 0),
            likes: userPubs.reduce((acc, p) => acc + Number(p.likes || 0), 0),
            views: userPubs.reduce((acc, p) => acc + Number(p.views || 0), 0)
          };
        });

        // Tri par influence (Certifications + Likes)
        const sortedAuthors = community.sort((a, b) => 
          (b.certified + b.likes) - (a.certified + a.likes)
        );
        
        setAuthors(sortedAuthors);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Le Cercle est inaccessible."); 
    } finally { 
      setLoading(false); 
    }
  }

  const maxViews = useMemo(() => {
    return authors.length > 0 ? Math.max(...authors.map(a => a.views)) : 0;
  }, [authors]);

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase();
    const ADMIN_LIST = [
      "adm.lablitteraire7@gmail.com", 
      "robergeaurodley97@gmail.com", 
      "jb7management@gmail.com"
    ];

    if (ADMIN_LIST.includes(mail)) b.push({ icon: <Settings size={10} />, label: "Staff", color: "bg-rose-600 text-white" });
    if (mail === "jb7management@gmail.com") b.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400" });
    
    if (author.views === maxViews && maxViews > 0) {
      b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    } else if (author.certified > 3) {
      b.push({ icon: <Star size={10} />, label: "Plume d'Élite", color: "bg-amber-100 text-amber-700" });
    }
    return b;
  };

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === targetEmail) return toast.error("Vous ne pouvez pas vous suivre vous-même.");
    
    setSubmitting(targetEmail);
    try {
      const isFollowing = authors.find(a => a.email === targetEmail)?.followers?.includes(currentUser.email);
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: isFollowing ? "unfollow" : "follow", 
          userEmail: currentUser.email, 
          targetEmail: targetEmail 
        })
      });

      if (res.ok) {
        setAuthors(prev => prev.map(auth => 
          auth.email === targetEmail 
          ? { ...auth, followers: isFollowing ? auth.followers.filter(e => e !== currentUser.email) : [...auth.followers, currentUser.email] } 
          : auth
        ));
        toast.success(isFollowing ? "Désabonné" : "Abonné !");
      }
    } catch (err) { 
      toast.error("Erreur de liaison."); 
    } finally { 
      setSubmitting(null); 
    }
  };

  if (!mounted || loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture du Cercle...</p>
    </div>
  );

  const filteredAuthors = authors.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen pb-40">
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8 items-end">
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <UsersIcon size={18} className="text-teal-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600">Communauté</span>
           </div>
           <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl shadow-slate-200/50 outline-none focus:border-teal-500 transition-all font-bold text-slate-900" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a) => {
          const isFollowing = a.followers?.includes(currentUser?.email);
          return (
            <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden hover:border-teal-100 transition-all">
              <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
                {getBadges(a).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm`}>
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <img 
                    src={a.image || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${a.email}`} 
                    className="w-full h-full object-cover" 
                    alt={a.name}
                  />
                </div>
                
                <div className="grow space-y-5 text-center sm:text-left">
                  <div>
                    <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                      {a.name} 
                      {a.certified > 0 && <ShieldCheck size={20} className="text-teal-500" />}
                    </h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{a.followers?.length || 0} Abonnés</p>
                  </div>

                  <div className="flex justify-center sm:justify-start gap-3">
                      <div className="bg-rose-50/50 px-4 py-2 rounded-2xl border border-rose-100/50 text-center min-w-[70px]">
                        <span className="block text-[8px] font-black text-rose-400 uppercase tracking-tighter">Vues</span>
                        <span className="text-sm font-black text-rose-600">{a.views.toLocaleString()}</span>
                      </div>
                      <div className="bg-teal-50/50 px-4 py-2 rounded-2xl border border-teal-100/50 text-center min-w-[70px]">
                        <span className="block text-[8px] font-black text-teal-400 uppercase tracking-tighter">Textes</span>
                        <span className="text-sm font-black text-teal-600">{a.worksCount}</span>
                      </div>
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                    <button 
                      onClick={() => handleFollow(a.email)} 
                      disabled={submitting === a.email}
                      className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        isFollowing 
                        ? 'bg-slate-100 text-slate-400' 
                        : 'bg-slate-950 text-white hover:bg-teal-600 shadow-lg'
                      }`}
                    >
                      {submitting === a.email ? "..." : isFollowing ? "Abonné" : "Suivre"}
                    </button>
                    <Link 
                      href={`/author/${encodeURIComponent(a.email)}`} 
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      Profil <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
              
              <Feather className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-teal-50 transition-colors" size={120} />
            </div>
          );
        })}
      </div>

      {filteredAuthors.length > visibleCount && (
        <div className="mt-20 text-center">
          <button 
            onClick={() => setVisibleCount(v => v + 10)}
            className="group flex flex-col items-center mx-auto gap-4"
          >
            <div className="w-16 h-16 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-teal-500 group-hover:text-teal-500 transition-all">
              <ChevronDown size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-teal-600">Voir plus de plumes</span>
          </button>
        </div>
      )}
    </div>
  );
}

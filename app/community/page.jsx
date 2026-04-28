"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, ChevronDown, TrendingUp, Star, Settings, 
  Briefcase, HeartHandshake, Feather, Coins
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
    loadAuthorsData();
  }, []);

  async function loadAuthorsData() {
    try {
      // 1. Récupération de TOUS les utilisateurs (data/users)
      const usersRes = await fetch(`/api/github-db?type=users_all`); // Assurez-vous que votre API supporte ce type ou scanne le dossier
      const usersJson = await usersRes.json();
      const allUsers = Array.isArray(usersJson.content) ? usersJson.content : [];

      // 2. Récupération des publications pour les stats (data/library)
      const libRes = await fetch(`/api/github-db?type=library`); 
      const libJson = await libRes.json();
      const allPubs = Array.isArray(libJson.content) ? libJson.content : [];

      // 3. Fusion et calcul
      const authorsMap = allUsers.reduce((acc, user) => {
        const email = user.email?.toLowerCase().trim();
        if (!email) return acc;
        
        acc[email] = {
          name: user.penName || user.name || "Plume Anonyme",
          email: email,
          image: user.image || user.authorImage || null,
          li: user.li || 0,
          bio: user.bio || "",
          followers: user.followers || [],
          certified: 0,
          likes: 0,
          views: 0,
          worksCount: 0
        };
        return acc;
      }, {});

      // Enrichissement avec les données de publication
      allPubs.forEach(pub => {
        const email = pub.authorEmail?.toLowerCase().trim();
        if (authorsMap[email]) {
          authorsMap[email].worksCount += 1;
          authorsMap[email].certified += Number(pub.certified || 0);
          authorsMap[email].likes += Number(pub.likes || 0);
          authorsMap[email].views += Number(pub.views || 0);
        }
      });

      const sortedAuthors = Object.values(authorsMap).sort((a, b) => 
        (b.certified + b.views) - (a.certified + a.views)
      );

      setAuthors(sortedAuthors);
    } catch (e) { 
      toast.error("Impossible de synchroniser les membres du Cercle."); 
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
    if (mail === "adm.lablitteraire7@gmail.com") b.push({ icon: <Settings size={10} />, label: "Admin", color: "bg-rose-600 text-white" });
    if (mail === "jb7management@gmail.com") b.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400" });
    if (author.views === maxViews && maxViews > 0) {
      b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    }
    return b;
  };

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    setSubmitting(targetEmail);
    try {
      const isFollowing = authors.find(a => a.email === targetEmail)?.followers?.includes(currentUser.email);
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow", userEmail: currentUser.email, targetEmail: targetEmail })
      });
      if (res.ok) {
        setAuthors(prev => prev.map(auth => auth.email === targetEmail ? { ...auth, followers: isFollowing ? auth.followers.filter(e => e !== currentUser.email) : [...auth.followers, currentUser.email] } : auth));
        toast.success(isFollowing ? "Désabonné" : "Abonné !");
      }
    } catch (err) { toast.error("Erreur de liaison."); }
    finally { setSubmitting(null); }
  };

  if (!mounted || loading) return <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8">
        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] pl-2">Membres de la communauté Lisible</p>
        </div>
        <input 
          type="text" 
          placeholder="Rechercher une plume..." 
          className="w-full lg:w-96 bg-white border-2 border-slate-50 rounded-[2rem] px-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all font-medium" 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {authors
          .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, visibleCount)
          .map((a) => (
          <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl hover:border-teal-100">
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
              {getBadges(a).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5`}>{b.icon} {b.label}</div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 flex-shrink-0">
                <img 
                  src={a.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${a.email}`} 
                  className="w-full h-full object-cover" 
                  alt={a.name}
                />
              </div>

              <div className="grow space-y-4 text-center sm:text-left">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                  {a.name} <ShieldCheck size={20} className="text-teal-500" />
                </h2>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    <div className="bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100">
                      <span className="block text-[8px] font-black text-rose-600 uppercase">Lectures</span>
                      <span className="text-sm font-black text-rose-700">{a.views.toLocaleString()}</span>
                    </div>
                    <div className="bg-teal-50/50 px-3 py-1.5 rounded-xl border border-teal-100">
                      <span className="block text-[8px] font-black text-teal-600 uppercase">Textes</span>
                      <span className="text-sm font-black text-teal-700">{a.worksCount}</span>
                    </div>
                    <div className="bg-amber-50/50 px-3 py-1.5 rounded-xl border border-amber-100">
                      <span className="block text-[8px] font-black text-amber-600 uppercase">Bourse Li</span>
                      <span className="text-sm font-black text-amber-700">{a.li.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                  <button 
                    onClick={() => handleFollow(a.email)} 
                    className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${a.followers?.includes(currentUser?.email) ? 'bg-slate-100 text-slate-400' : 'bg-slate-950 text-white hover:bg-teal-600'}`}
                  >
                    {submitting === a.email ? "..." : (a.followers?.includes(currentUser?.email) ? "Abonné" : "Suivre")}
                  </button>
                  <Link 
                    href={`/author/${encodeURIComponent(a.email)}`} 
                    className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"
                  >
                    Profil <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < authors.length && (
        <div className="mt-20 text-center">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="group flex flex-col items-center mx-auto gap-4"
          >
            <div className="p-5 bg-white rounded-full shadow-lg border border-slate-100 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <ChevronDown size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Voir plus de plumes</span>
          </button>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, ChevronDown, TrendingUp, Star, Settings, 
  Briefcase, HeartHandshake, Feather
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Head from 'next/head';

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
      // Récupération croisée : Bibliothèque globale + Index des utilisateurs
      const [libRes, usersRes] = await Promise.all([
        fetch(`/api/github-db?type=library`),
        fetch(`/api/github-db?type=all_users`) // Route pour lister tous les profils réels
      ]);
      
      const libJson = await libRes.json();
      const usersJson = await usersRes.json();
      
      const publications = Array.isArray(libJson.content) ? libJson.content : [];
      const userProfiles = Array.isArray(usersJson.content) ? usersJson.content : [];

      // 1. On crée une map des statistiques basées sur les publications réelles
      const statsMap = publications.reduce((acc, pub) => {
        const email = pub.authorEmail?.toLowerCase().trim();
        if (!email) return acc;
        if (!acc[email]) {
          acc[email] = {
            certified: 0, likes: 0, views: 0, worksCount: 0
          };
        }
        acc[email].worksCount += 1;
        acc[email].certified += Number(pub.certified || 0);
        acc[email].likes += Number(pub.likes || 0);
        acc[email].views += Number(pub.views || 0);
        return acc;
      }, {});

      // 2. On fusionne avec les vraies données utilisateurs (data/users)
      const consolidatedAuthors = userProfiles.map(u => {
        const stats = statsMap[u.email?.toLowerCase().trim()] || { certified: 0, likes: 0, views: 0, worksCount: 0 };
        return {
          ...u,
          name: u.penName || u.name || "Plume Anonyme",
          email: u.email?.toLowerCase().trim(),
          image: u.profilePic || u.image || null,
          followers: u.followers || [],
          ...stats
        };
      });

      // 3. Tri par influence réelle (Sceaux + J'aime + Lectures)
      const sortedAuthors = consolidatedAuthors.sort((a, b) => 
        (b.certified * 10 + b.likes + b.views) - (a.certified * 10 + a.likes + a.views)
      );
      
      setAuthors(sortedAuthors);
    } catch (e) { 
      console.error(e);
      toast.error("Le Cercle est inaccessible."); 
    }
    finally { setLoading(false); }
  }

  const maxViews = useMemo(() => {
    return authors.length > 0 ? Math.max(...authors.map(a => a.views)) : 0;
  }, [authors]);

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase();

    if (mail === "adm.lablitteraire7@gmail.com") b.push({ icon: <Settings size={10} />, label: "Admin", color: "bg-rose-600 text-white" });
    if (mail === "jb7management@gmail.com") b.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400" });
    
    // BADGE ÉLITE (Record de lectures ou certifié)
    if (author.views === maxViews && maxViews > 0) {
      b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    } else if (author.certified > 5) {
      b.push({ icon: <Star size={10} />, label: "Plume d'Élite", color: "bg-teal-500 text-white" });
    }
    return b;
  };

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    setSubmitting(targetEmail);
    try {
      const target = authors.find(a => a.email === targetEmail);
      const isFollowing = target?.followers?.includes(currentUser.email);
      
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
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
    } catch (err) { toast.error("Erreur de liaison."); }
    finally { setSubmitting(null); }
  };

  if (!mounted || loading) return <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  const filteredAuthors = authors.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8">
        <div>
          <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 mt-6">Écosystème des auteurs réels</p>
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            className="w-full lg:w-96 bg-white border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all font-bold" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a) => {
          const isFollowing = a.followers?.includes(currentUser?.email);
          return (
            <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:-translate-y-2">
              <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
                {getBadges(a).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm`}>{b.icon} {b.label}</div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 flex-shrink-0">
                  <img 
                    src={a.image || `https://api.dicebear.com/7.x/initials/svg?seed=${a.name}`} 
                    className="w-full h-full object-cover" 
                    alt={a.name}
                  />
                </div>
                <div className="grow space-y-4 text-center sm:text-left">
                  <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                    {a.name} <ShieldCheck size={20} className="text-teal-500" />
                  </h2>
                  <div className="flex justify-center sm:justify-start gap-3">
                      <div className="bg-rose-50/50 px-3 py-1.5 rounded-xl text-center border border-rose-100/50">
                        <span className="block text-[8px] font-black text-rose-600 uppercase">Lectures</span>
                        <span className="text-sm font-black text-rose-700">{a.views}</span>
                      </div>
                      <div className="bg-teal-50/50 px-3 py-1.5 rounded-xl text-center border border-teal-100/50">
                        <span className="block text-[8px] font-black text-teal-600 uppercase">Œuvres</span>
                        <span className="text-sm font-black text-teal-700">{a.worksCount}</span>
                      </div>
                      <div className="bg-slate-50/50 px-3 py-1.5 rounded-xl text-center border border-slate-100/50">
                        <span className="block text-[8px] font-black text-slate-600 uppercase">Fans</span>
                        <span className="text-sm font-black text-slate-700">{a.followers?.length || 0}</span>
                      </div>
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                    <button 
                      onClick={() => handleFollow(a.email)} 
                      disabled={submitting === a.email}
                      className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${isFollowing ? "bg-slate-100 text-slate-500" : "bg-slate-950 text-white hover:bg-teal-600 shadow-lg shadow-slate-900/10"}`}
                    >
                      {submitting === a.email ? "..." : (isFollowing ? "Suivi" : "Suivre")}
                    </button>
                    <Link href={`/author/${encodeURIComponent(a.email)}`} className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/10">
                      Profil <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredAuthors.length > visibleCount && (
        <div className="mt-20 text-center">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-10 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            Découvrir d'autres plumes
          </button>
        </div>
      )}
    </div>
  );
}

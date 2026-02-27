"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, ChevronDown, TrendingUp, Star, Settings, 
  Briefcase, HeartHandshake, Feather, Sparkles, Sun
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Head from 'next/head';

// Cache global hors du composant pour persister durant la session
let authorsCache = null;

export default function CommunautePage() {
  const [authors, setAuthors] = useState(authorsCache || []);
  const [loading, setLoading] = useState(!authorsCache);
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
      // 1. Récupération parallèle pour gagner du temps
      const [resLib, resUsers] = await Promise.all([
        fetch(`/api/github-db?type=data&file=library`),
        fetch(`/api/github-db?type=data&file=users`)
      ]);

      const jsonLib = await resLib.json();
      const jsonUsers = await resUsers.json();
      
      if (jsonLib && Array.isArray(jsonLib.content)) {
        const statsMap = jsonLib.content.reduce((acc, pub) => {
          const email = pub.authorEmail?.toLowerCase().trim();
          if (!email) return acc;
          
          if (!acc[email]) {
            acc[email] = {
              name: pub.author || "Plume Anonyme",
              email: email,
              image: pub.authorImage || null,
              followers: pub.followers || [], 
              certified: 0, 
              likes: 0, 
              views: 0, 
              worksCount: 0,
              li: 0
            };
          }
          acc[email].worksCount += 1;
          acc[email].certified += Number(pub.certified || 0);
          acc[email].likes += Number(pub.likes || 0);
          acc[email].views += Number(pub.views || 0);
          return acc;
        }, {});

        let authorEntries = Object.values(statsMap);

        // 2. Enrichissement via le fichier users
        if (jsonUsers && Array.isArray(jsonUsers.content)) {
          authorEntries = authorEntries.map(auth => {
            const userProfile = jsonUsers.content.find(u => u.email?.toLowerCase().trim() === auth.email);
            return userProfile ? {
              ...auth,
              li: userProfile.li || 0,
              image: userProfile.profilePic || userProfile.image || auth.image
            } : auth;
          });
        }

        const sortedAuthors = authorEntries.sort((a, b) => 
          (b.certified + b.likes + b.views) - (a.certified + a.likes + a.views)
        );

        // Mise à jour du cache et de l'état
        authorsCache = sortedAuthors;
        setAuthors(sortedAuthors);
      }
    } catch (e) { 
      console.error("Erreur générale:", e);
      if (!authorsCache) toast.error("Le Cercle est inaccessible."); 
    } finally { 
      setLoading(false); 
    }
  }

  // Mémos pour les statistiques globales
  const stats = useMemo(() => {
    if (authors.length === 0) return { maxViews: 0, maxWorks: 0, maxLi: 0 };
    return {
      maxViews: Math.max(...authors.map(a => a.views)),
      maxWorks: Math.max(...authors.map(a => a.worksCount)),
      maxLi: Math.max(...authors.map(a => a.li))
    };
  }, [authors]);

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase();

    if (mail === "adm.lablitteraire7@gmail.com") b.push({ icon: <Settings size={10} />, label: "Label", color: "bg-rose-600 text-white" });
    if (mail === "woolsleypierre01@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Artistique", color: "bg-yellow-600 text-white" });
    if (mail === "jeanpierreborlhaïniedarha@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Marketing", color: "bg-blue-600 text-white" });
    if (mail === "robergeaurodley97@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Général", color: "bg-green-600 text-white" });
    if (mail === "jb7management@gmail.com") b.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400" });
    if (mail === "cmo.lablitteraire7@gmail.com") b.push({ icon: <Crown size={10} />, label: "Support Team", color: "bg-gold-900 text-red-400" });
    
    if (author.views === stats.maxViews && stats.maxViews > 0) {
      b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    }
    if (author.worksCount === stats.maxWorks && stats.maxWorks > 5) {
      b.push({ icon: <Sparkles size={10} />, label: "Pépite", color: "bg-teal-600 text-white shadow-lg shadow-teal-500/20" });
    }
    if (author.li === stats.maxLi && stats.maxLi > 0) {
      b.push({ icon: <Sun size={10} />, label: "Auréole", color: "bg-amber-400 text-slate-900 font-bold shadow-lg" });
    }
    if (author.certified > 3 && b.length < 3) {
      b.push({ icon: <Star size={10} />, label: "Certifiée", color: "bg-amber-100 text-amber-700" });
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
        const update = prev => prev.map(auth => auth.email === targetEmail ? { ...auth, followers: isFollowing ? auth.followers.filter(e => e !== currentUser.email) : [...auth.followers, currentUser.email] } : auth);
        setAuthors(update);
        authorsCache = update(authorsCache);
        toast.success(isFollowing ? "Désabonné" : "Abonné !");
      }
    } catch (err) { toast.error("Erreur de liaison."); }
    finally { setSubmitting(null); }
  };

  if (!mounted) return null;
  if (loading && authors.length === 0) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <Head><title>Cercle | Lisible</title></Head>
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8">
        <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            className="w-full bg-white border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {authors
          .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, visibleCount)
          .map((a) => (
          <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl hover:border-teal-500/10">
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
              {getBadges(a).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                  {b.icon} {b.label}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 flex-shrink-0">
                <img 
                  src={a.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${a.email}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={a.name}
                />
              </div>
              <div className="grow space-y-4 text-center sm:text-left">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                  {a.name} 
                  {a.certified > 0 && <ShieldCheck size={20} className="text-teal-500" fill="currentColor" />}
                </h2>
                <div className="flex justify-center sm:justify-start gap-3">
                    <StatBadge label="Lectures" val={a.views} color="rose" />
                    <StatBadge label="Textes" val={a.worksCount} color="teal" />
                    <StatBadge label="Li" val={a.li} color="amber" />
                </div>
                <div className="flex gap-2 justify-center sm:justify-start">
                  <button 
                    onClick={() => handleFollow(a.email)} 
                    disabled={submitting === a.email}
                    className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${a.followers?.includes(currentUser?.email) ? "bg-slate-100 text-slate-400" : "bg-slate-950 text-white hover:bg-teal-600 shadow-lg"}`}
                  >
                    {submitting === a.email ? <Loader2 size={12} className="animate-spin" /> : (a.followers?.includes(currentUser?.email) ? "Désabonner" : "Suivre")}
                  </button>
                  <Link href={`/author/${encodeURIComponent(a.email)}`} className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2">
                    Profil <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {authors.length > visibleCount && (
        <div className="mt-20 text-center">
          <button onClick={() => setVisibleCount(v => v + 10)} className="px-12 py-6 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl">
            Découvrir plus de plumes
          </button>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, val, color }) {
  const styles = {
    rose: "bg-rose-50/50 text-rose-600 border-rose-100",
    teal: "bg-teal-50/50 text-teal-600 border-teal-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100"
  };
  return (
    <div className={`px-3 py-1.5 rounded-xl text-center border ${styles[color]}`}>
      <span className="block text-[8px] font-black uppercase opacity-70">{label}</span>
      <span className="text-sm font-black">{val.toLocaleString()}</span>
    </div>
  );
}

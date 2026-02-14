"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, ChevronDown, TrendingUp, Star, Settings, Coins, Briefcase, HeartHandshake
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Head from 'next/head';

export default function CerclePage() {
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
    loadAuthorsFromLibrary();
  }, []);

  // On utilise ta route API GET type=library
  async function loadAuthorsFromLibrary() {
    try {
      const res = await fetch(`/api/github?type=library`); 
      const json = await res.json();
      
      if (json && Array.isArray(json.content)) {
        const authorStats = json.content.reduce((acc, pub) => {
          const email = pub.authorEmail?.toLowerCase().trim();
          if (!email) return acc;

          if (!acc[email]) {
            acc[email] = {
              name: pub.author || "Plume Anonyme",
              email: email,
              followers: pub.followers || [], // Si l'index contient déjà les followers
              certified: 0,
              likes: 0,
              views: 0,
              worksCount: 0
            };
          }
          acc[email].worksCount += 1;
          acc[email].certified += Number(pub.certified || 0);
          acc[email].likes += Number(pub.likes || 0);
          acc[email].views += Number(pub.views || 0);
          return acc;
        }, {});

        // Tri par prestige (Certifications + Likes)
        const sorted = Object.values(authorStats).sort((a, b) => 
          (b.certified + b.likes) - (a.certified + a.likes)
        );
        
        setAuthors(sorted);
      }
    } catch (e) { 
      console.error("Load users error:", e);
      toast.error("Connexion au Cercle interrompue."); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Veuillez vous connecter");
    if (currentUser.email === targetEmail) return toast.error("Votre propre plume ne peut vous suivre");
    
    setSubmitting(targetEmail);
    try {
      const isFollowing = authors.find(a => a.email === targetEmail)?.followers?.includes(currentUser.email);
      
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: isFollowing ? "unfollow" : "follow", 
          userEmail: currentUser.email, 
          targetEmail: targetEmail 
        })
      });

      if (res.ok) {
        toast.success(isFollowing ? "Abonnement retiré" : "Nouvelle plume suivie");
        // Update local state
        setAuthors(prev => prev.map(auth => {
          if (auth.email === targetEmail) {
            const newFollowers = isFollowing 
              ? auth.followers.filter(e => e !== currentUser.email)
              : [...(auth.followers || []), currentUser.email];
            return { ...auth, followers: newFollowers };
          }
          return auth;
        }));
      }
    } catch (err) { 
      toast.error("Erreur lors de la liaison."); 
    } finally { 
      setSubmitting(null); 
    }
  };

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase();

    // --- Administration Lisible ---
    if (mail === "adm.lablitteraire7@gmail.com") b.push({ icon: <Settings size={10} />, label: "Admin", color: "bg-rose-600 text-white" });
    if (mail === "jb7management@gmail.com") b.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400" });
    if (mail === "robergeaurodley97@gmail.com") b.push({ icon: <Briefcase size={10} />, label: "DG", color: "bg-indigo-600 text-white" });
    if (mail === "woolsleypierre01@gmail.com") b.push({ icon: <Feather size={10} />, label: "Dir. Éditoriale", color: "bg-teal-600 text-white" });
    if (mail === "jeanpierreborlhaïniedarha@gmail.com") b.push({ icon: <TrendingUp size={10} />, label: "Dir. Marketing", color: "bg-orange-500 text-white" });
    if (mail === "cmo.lablitteraire7@gmail.com") b.push({ icon: <HeartHandshake size={10} />, label: "Support Team", color: "bg-slate-500 text-white" });
    
    // --- Statuts Auteur ---
    if (author.certified > 5) b.push({ icon: <Star size={10} />, label: "Élite", color: "bg-amber-100 text-amber-700" });
    if (author.worksCount > 10) b.push({ icon: <ShieldCheck size={10} />, label: "Prolifique", color: "bg-teal-100 text-teal-700" });
    
    return b;
  };

  const filteredAuthors = useMemo(() => {
    return authors.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [authors, searchTerm]);

  if (!mounted) return null;
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#FCFBF9]">
      <div className="text-center">
        <Loader2 className="animate-spin text-teal-600 mx-auto mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture des Archives...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-24 bg-[#FCFBF9] min-h-screen">
      <Head><title>Cercle | Lisible</title></Head>

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-8">
        <div>
          <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75] mb-6">Cercle.</h1>
          <div className="flex items-center gap-3 bg-white border border-slate-200 w-fit px-4 py-2 rounded-full shadow-sm">
             <TrendingUp size={14} className="text-teal-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{authors.length} Plumes Répertoriées</span>
          </div>
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Chercher une plume..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold shadow-sm focus:border-teal-500 transition-all outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a, index) => {
          const isFollowing = a.followers?.includes(currentUser?.email);
          return (
            <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-teal-500/30 transition-all relative overflow-hidden">
              {/* Rang visuel */}
              <div className="absolute -left-4 -top-4 w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 font-black text-4xl -z-0 opacity-50 italic">
                {index + 1}
              </div>

              <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
                {getBadges(a).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm`}>
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 flex-shrink-0">
                  <img 
                    src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${a.email}`} 
                    alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                <div className="flex-grow text-center sm:text-left">
                  <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter mb-2 flex items-center justify-center sm:justify-start gap-2">
                    {a.name}
                    {a.certified > 0 && <ShieldCheck size={20} className="text-teal-500" fill="currentColor" />}
                  </h2>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      {a.followers?.length || 0} Abonnés
                    </div>
                    <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest bg-teal-50/50 px-3 py-1 rounded-full border border-teal-100">
                      {a.worksCount} Textes
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center sm:justify-start">
                    <button 
                      onClick={() => handleFollow(a.email)}
                      disabled={submitting === a.email}
                      className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                        isFollowing 
                        ? "bg-slate-100 text-slate-400 hover:text-rose-600" 
                        : "bg-slate-950 text-white hover:bg-teal-600 shadow-xl shadow-slate-950/20"
                      }`}
                    >
                      {submitting === a.email ? <Loader2 size={12} className="animate-spin"/> : (isFollowing ? "Désabonner" : "Suivre")}
                    </button>
                    <Link 
                      href={`/author/${encodeURIComponent(a.email)}`}
                      className="px-8 py-3 bg-white border-2 border-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all flex items-center gap-2"
                    >
                      Profil <ArrowRight size={14} />
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-teal-600 transition-colors">Plus de plumes</span>
            <div className="p-6 bg-white rounded-full shadow-2xl border border-slate-100 group-hover:bg-slate-950 group-hover:text-white transition-all transform group-hover:translate-y-2">
              <ChevronDown size={32} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

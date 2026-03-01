"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, Settings, Sparkles, Sun
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
      // 1. Récupérer l'index global des publications pour calculer les stats réelles
      const resIndex = await fetch(`/api/github-db?type=publications`);
      const indexData = await resIndex.json();
      
      if (!indexData || !Array.isArray(indexData.content)) {
        throw new Error("Impossible de charger l'index");
      }

      // 2. Extraire la liste unique des auteurs ayant publié
      const uniqueEmails = [...new Set(indexData.content.map(p => p.authorEmail))].filter(Boolean);

      // 3. Récupérer chaque profil utilisateur et fusionner avec les stats de l'index
      const authorProfiles = await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            const resUser = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
            const userData = await resUser.json();
            
            if (userData && userData.content) {
              // Calcul des statistiques à partir de l'index
              const stats = indexData.content.reduce((acc, pub) => {
                if (pub.authorEmail?.toLowerCase() === email.toLowerCase()) {
                  acc.works += 1;
                  acc.views += (Number(pub.views) || 0);
                  acc.likes += (Number(pub.likes) || 0);
                  acc.certified += (Number(pub.certified) || 0);
                }
                return acc;
              }, { works: 0, views: 0, likes: 0, certified: 0 });

              return {
                ...userData.content,
                worksCount: stats.works,
                views: stats.views,
                likes: stats.likes,
                totalCertified: stats.certified
              };
            }
          } catch (err) {
            console.error(`Erreur pour ${email}:`, err);
          }
          return null;
        })
      );

      // Filtrer les profils valides et non supprimés
      const finalAuthors = authorProfiles.filter(a => a !== null && a.status !== "deleted");

      // Tri par influence (Vues + Li + Publications)
      const sortedAuthors = finalAuthors.sort((a, b) => 
        ((b.li || 0) + (b.views || 0) + (b.worksCount || 0)) - ((a.li || 0) + (a.views || 0) + (a.worksCount || 0))
      );

      authorsCache = sortedAuthors;
      setAuthors(sortedAuthors);
    } catch (e) { 
      console.error("Erreur de chargement du Cercle:", e);
      if (!authorsCache) toast.error("Le Cercle est momentanément inaccessible."); 
    } finally { 
      setLoading(false); 
    }
  }

  const stats = useMemo(() => {
    if (authors.length === 0) return { maxViews: 0, maxWorks: 0, maxLi: 0 };
    return {
      maxViews: Math.max(...authors.map(a => a.views || 0)),
      maxWorks: Math.max(...authors.map(a => a.worksCount || 0)),
      maxLi: Math.max(...authors.map(a => a.li || 0))
    };
  }, [authors]);

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase().trim();

    // Badges de rôle (Statiques par email)
    if (mail === "adm.lablitteraire7@gmail.com") b.push({ icon: <Settings size={10} />, label: "Label", color: "bg-rose-600 text-white" });
    if (mail === "woolsleypierre01@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Artistique", color: "bg-yellow-600 text-white" });
    if (mail === "jeanpierreborlhaïniedarha@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Marketing", color: "bg-blue-600 text-white" });
    if (mail === "robergeaurodley97@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Général", color: "bg-green-600 text-white" });
    if (mail === "jb7management@gmail.com") b.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400" });
    if (mail === "cmo.lablitteraire7@gmail.com") b.push({ icon: <Crown size={10} />, label: "Support Team", color: "bg-red-900 text-white" });
    
    // Badges de performance (Dynamiques)
    if (author.views === stats.maxViews && stats.maxViews > 0) {
      b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    }
    if (author.worksCount === stats.maxWorks && stats.maxWorks >= 5) {
      b.push({ icon: <Sparkles size={10} />, label: "Pépite", color: "bg-teal-600 text-white shadow-lg shadow-teal-500/20" });
    }
    if (author.li === stats.maxLi && stats.maxLi > 0) {
      b.push({ icon: <Sun size={10} />, label: "Auréole", color: "bg-amber-400 text-slate-900 font-bold shadow-lg" });
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
        body: JSON.stringify({ 
          action: isFollowing ? "unfollow" : "follow", 
          userEmail: currentUser.email, 
          targetEmail: targetEmail 
        })
      });
      if (res.ok) {
        const update = prev => prev.map(auth => 
          auth.email === targetEmail 
          ? { ...auth, followers: isFollowing ? auth.followers.filter(e => e !== currentUser.email) : [...(auth.followers || []), currentUser.email] } 
          : auth
        );
        setAuthors(update);
        authorsCache = update(authorsCache || []);
        toast.success(isFollowing ? "Désabonné" : "Abonné !");
      }
    } catch (err) { toast.error("Erreur de liaison."); }
    finally { setSubmitting(null); }
  };

  if (!mounted) return null;

  if (loading && authors.length === 0) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Rassemblement du Cercle...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8">
        <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            className="w-full bg-white border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all font-sans" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {authors
          .filter(a => (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, visibleCount)
          .map((a) => (
          <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl hover:border-teal-500/10">
            {/* Badges */}
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
              {getBadges(a).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                  {b.icon} {b.label}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              {/* Photo */}
              <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 flex-shrink-0">
                <img 
                  src={a.profilePic || a.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${a.email}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={a.name}
                />
              </div>

              {/* Infos */}
              <div className="grow space-y-4 text-center sm:text-left">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                  {a.penName || a.name || "Auteur"} 
                  {a.totalCertified > 0 && <ShieldCheck size={20} className="text-teal-500" fill="currentColor" />}
                </h2>

                <div className="flex justify-center sm:justify-start gap-3">
                    <StatBadge label="Lectures" val={a.views || 0} color="rose" />
                    <StatBadge label="Textes" val={a.worksCount || 0} color="teal" />
                    <StatBadge label="Li" val={a.li || 0} color="amber" />
                </div>

                <div className="flex gap-2 justify-center sm:justify-start pt-2">
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
          <button onClick={() => setVisibleCount(v => v + 10)} className="px-12 py-6 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl font-sans">
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

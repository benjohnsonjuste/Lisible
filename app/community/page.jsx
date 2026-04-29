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
    loadAuthorsData();
  }, []);

  async function loadAuthorsData() {
    try {
      // 1. Récupérer TOUS les utilisateurs via l'API folder=users (Temps Réel)
      const usersRes = await fetch(`/api/realtime-data?folder=users`);
      const usersJson = await usersRes.json();
      const allUsers = Array.isArray(usersJson.content) ? usersJson.content : [];

      // 2. Récupérer l'index des publications pour calculer les statistiques
      const libRes = await fetch(`/api/realtime-data?folder=publications`);
      const libJson = await libRes.json();
      // On cherche le contenu de index.json qui est dans le dossier publications
      const publications = Array.isArray(libJson.content[0]) ? libJson.content[0] : (libJson.content || []);

      // 3. Fusionner les profils avec les stats de l'index
      const community = allUsers.map(user => {
        const email = (user.email || "").toLowerCase().trim();
        // Filtrer les textes écrits par cet utilisateur dans l'index
        const userPubs = Array.isArray(publications) 
          ? publications.filter(p => (p.authorEmail || "").toLowerCase().trim() === email)
          : [];
        
        return {
          ...user,
          name: user.name || user.fullName || "Plume Anonyme",
          email: email,
          image: user.profilePic || user.image || null,
          followers: Array.isArray(user.followers) ? user.followers : [],
          worksCount: userPubs.length,
          certified: userPubs.reduce((acc, p) => acc + Number(p.certified || 0), 0),
          likes: userPubs.reduce((acc, p) => acc + Number(p.likes || 0), 0),
          views: userPubs.reduce((acc, p) => acc + Number(p.views || 0), 0)
        };
      });

      // Tri par influence (Certifications + Likes)
      setAuthors(community.sort((a, b) => (b.certified + b.likes) - (a.certified + a.likes)));
      
    } catch (e) { 
      console.error("Erreur de chargement:", e);
      toast.error("Le Cercle est inaccessible en ce moment."); 
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
    const ADMINS = ["adm.lablitteraire7@gmail.com", "jb7management@gmail.com", "robergeaurodley97@gmail.com"];

    if (ADMINS.includes(mail)) {
      b.push({ icon: <Settings size={10} />, label: "Staff", color: "bg-rose-600 text-white" });
    }
    
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
        body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow", userEmail: currentUser.email, targetEmail })
      });
      if (res.ok) {
        setAuthors(prev => prev.map(auth => auth.email === targetEmail ? { ...auth, followers: isFollowing ? auth.followers.filter(e => e !== currentUser.email) : [...auth.followers, currentUser.email] } : auth));
        toast.success(isFollowing ? "Désabonné" : "Abonné !");
      }
    } catch (err) { toast.error("Erreur de liaison."); }
    finally { setSubmitting(null); }
  };

  if (!mounted || loading) return <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  const filteredAuthors = authors.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8 items-end">
        <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un auteur..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a) => (
          <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden transition-hover hover:border-teal-200">
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
              {getBadges(a).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5`}>{b.icon} {b.label}</div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                <img 
                  src={a.image || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${a.email}`} 
                  className="w-full h-full object-cover" 
                  alt={a.name}
                />
              </div>
              <div className="grow space-y-4 text-center sm:text-left">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                  {a.name} <ShieldCheck size={20} className="text-teal-500" />
                </h2>
                <div className="flex gap-3 justify-center sm:justify-start">
                    <div className="bg-rose-50 px-3 py-1.5 rounded-xl text-center border border-rose-100">
                      <span className="block text-[8px] font-black text-rose-600 uppercase">Lectures</span>
                      <span className="text-sm font-black text-rose-700">{a.views.toLocaleString()}</span>
                    </div>
                    <div className="bg-teal-50 px-3 py-1.5 rounded-xl text-center border border-teal-100">
                      <span className="block text-[8px] font-black text-teal-600 uppercase">Textes</span>
                      <span className="text-sm font-black text-teal-700">{a.worksCount}</span>
                    </div>
                </div>
                <div className="flex gap-2 justify-center sm:justify-start">
                  <button 
                    onClick={() => handleFollow(a.email)} 
                    className="px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-slate-950 text-white hover:bg-teal-600 transition-all min-w-[100px]"
                  >
                    {submitting === a.email ? <Loader2 className="animate-spin mx-auto" size={14} /> : (a.followers?.includes(currentUser?.email) ? "Abonné" : "Suivre")}
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

      {filteredAuthors.length > visibleCount && (
        <button 
          onClick={() => setVisibleCount(v => v + 10)} 
          className="mt-20 mx-auto block px-12 py-5 bg-white border-2 border-slate-100 rounded-full font-black text-slate-900 shadow-xl hover:shadow-2xl hover:border-teal-500 transition-all uppercase text-[10px] tracking-widest"
        >
          Découvrir plus de plumes
        </button>
      )}
      
      {filteredAuthors.length === 0 && !loading && (
        <div className="text-center py-40">
          <p className="text-slate-400 font-medium italic">Aucun auteur ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}

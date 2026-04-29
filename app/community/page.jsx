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
      // 1. Récupération de l'index des publications (data/publications/index.json)
      const libRes = await fetch(`/api/github-db?type=library`); 
      const libJson = await libRes.json();
      const publications = Array.isArray(libJson.content) ? libJson.content : [];
      
      // 2. Récupération de la liste des fichiers dans data/users
      const usersListRes = await fetch(`/api/github-db?type=users_list`); 
      const usersListJson = await usersListRes.json();

      if (usersListJson && Array.isArray(usersListJson.content)) {
        // 3. Charger chaque fichier utilisateur individuellement
        const userPromises = usersListJson.content.map(async (file) => {
          try {
            const res = await fetch(`/api/github-db?type=user_file&path=${file.path}`);
            const data = await res.json();
            return data.content;
          } catch (e) { return null; }
        });

        const allUsersRaw = await Promise.all(userPromises);
        const allUsers = allUsersRaw.filter(u => u !== null);

        // 4. Agrégation des données
        const community = allUsers.map(user => {
          const email = (user.email || "").toLowerCase().trim();
          const userPubs = publications.filter(p => (p.authorEmail || "").toLowerCase().trim() === email);
          
          return {
            ...user,
            name: user.penName || user.name || "Plume Anonyme",
            email: email,
            image: user.profilePic || user.image || null,
            followers: Array.isArray(user.followers) ? user.followers : [],
            worksCount: userPubs.length,
            certified: userPubs.reduce((acc, p) => acc + Number(p.certified || 0), 0),
            likes: userPubs.reduce((acc, p) => acc + Number(p.likes || 0), 0),
            views: userPubs.reduce((acc, p) => acc + Number(p.views || 0), 0)
          };
        });

        // Tri par influence
        setAuthors(community.sort((a, b) => (b.certified + b.likes) - (a.certified + a.likes)));
      }
    } catch (e) { 
      console.error("Erreur de chargement:", e);
      toast.error("Impossible de charger les membres."); 
    } finally { 
      setLoading(false); 
    }
  }

  // ... (Le reste du code getBadges, handleFollow et le return reste identique à votre version)
  // Assurez-vous simplement que le rendu utilise 'authors' comme avant.

  const maxViews = useMemo(() => {
    return authors.length > 0 ? Math.max(...authors.map(a => a.views)) : 0;
  }, [authors]);

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase();
    const ADMIN_LIST = ["adm.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com"];
    if (ADMIN_LIST.includes(mail)) b.push({ icon: <Settings size={10} />, label: "Staff", color: "bg-rose-600 text-white" });
    if (author.views === maxViews && maxViews > 0) b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    return b;
  };

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous");
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
        toast.success("Mis à jour");
      }
    } catch (err) { toast.error("Erreur"); }
    finally { setSubmitting(null); }
  };

  if (!mounted || loading) return <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  const filteredAuthors = authors.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen pb-40">
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8 items-end">
        <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Rechercher..." className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a) => (
          <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden">
             {/* Badges */}
             <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
                {getBadges(a).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5`}>{b.icon} {b.label}</div>
                ))}
              </div>
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <img src={a.image || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${a.email}`} className="w-32 h-32 rounded-[2.8rem] object-cover border-4 border-white shadow-2xl" />
              <div className="grow space-y-4">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter">{a.name}</h2>
                <div className="flex gap-3">
                  <div className="bg-rose-50 px-3 py-1 rounded-xl text-[10px] font-black text-rose-600 uppercase">{a.views} Vues</div>
                  <div className="bg-teal-50 px-3 py-1 rounded-xl text-[10px] font-black text-teal-600 uppercase">{a.worksCount} Textes</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleFollow(a.email)} className="px-6 py-3 rounded-2xl text-[9px] font-black uppercase bg-slate-950 text-white">
                    {submitting === a.email ? "..." : a.followers?.includes(currentUser?.email) ? "Abonné" : "Suivre"}
                  </button>
                  <Link href={`/author/${encodeURIComponent(a.email)}`} className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[9px] font-black uppercase flex items-center gap-2">Profil <ArrowRight size={14} /></Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

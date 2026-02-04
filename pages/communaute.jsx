"use client";
import React, { useEffect, useState } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Award, Coins, Sparkles, Edit3,
  TrendingUp, Crown, Medal, Briefcase, Star
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UsersPage({ initialAuthors = [] }) {
  const [authors, setAuthors] = useState(initialAuthors);
  const [loading, setLoading] = useState(initialAuthors.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com",
    "cmo.lablitteraire7@gmail.com" 
  ];

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setCurrentUser(JSON.parse(loggedUser));
    
    // Si ISR n'a pas chargé de données (rare), on force un fetch
    if (initialAuthors.length === 0) {
      loadUsers();
    }
  }, [initialAuthors]);

  async function loadUsers() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      const files = await res.json();
      if (!Array.isArray(files)) return;
      const dataPromises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
      const allUsers = await Promise.all(dataPromises);
      setAuthors(allUsers.sort((a, b) => (Number(b.wallet?.balance) || 0) - (Number(a.wallet?.balance) || 0)));
    } catch (e) { 
      toast.error("Erreur de synchronisation"); 
    } finally { setLoading(false); }
  }

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === targetEmail) return toast.error("Vous ne pouvez pas vous suivre vous-même");
    
    setSubmitting(targetEmail);
    try {
      const res = await fetch("/api/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerEmail: currentUser.email,
          targetEmail: targetEmail
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      
      toast.success(data.isSubscribed ? "Abonnement réussi" : "Désabonnement réussi");
      
      setAuthors(prevAuthors => prevAuthors.map(author => {
        if (author.email === targetEmail) {
          const newSubs = data.isSubscribed 
            ? [...(author.subscribers || []), currentUser.email]
            : (author.subscribers || []).filter(e => e !== currentUser.email);
          return { ...author, subscribers: newSubs };
        }
        return author;
      }));
    } catch (err) {
      toast.error("Action impossible");
    } finally {
      setSubmitting(null);
    }
  };

  const getBadges = (author, allUsers) => {
    const badges = [];
    const email = author.email?.toLowerCase().trim();
    const today = new Date();
    const lastSunday = new Date();
    lastSunday.setDate(today.getDate() - today.getDay());
    lastSunday.setHours(0, 0, 0, 0);

    // Badges Staff Fixes
    if (email === "jb7management@gmail.com") badges.push({ icon: <Crown size={10} />, label: "Fondateur & PDG", color: "bg-slate-950 text-amber-400 border border-amber-500/30" });
    if (email === "robergeaurodley97@gmail.com") badges.push({ icon: <Briefcase size={10} />, label: "DG", color: "bg-blue-600 text-white shadow-lg" });
    if (email === "woolsleypierre01@gmail.com") badges.push({ icon: <ShieldCheck size={10} />, label: "Directrice Éditoriale", color: "bg-purple-700 text-white" });
    if (email === "cmo.lablitteraire7@gmail.com") badges.push({ icon: <ShieldCheck size={10} />, label: "Staff Admin", color: "bg-teal-700 text-white shadow-md border border-teal-400/20" });
    if (email === "jeanpierreborlhaïniedarha@gmail.com") badges.push({ icon: <Sparkles size={10} />, label: "Directrice Marketing", color: "bg-pink-600 text-white shadow-lg border border-pink-300/20" });

    // Badges Dynamiques
    const eligible = allUsers.filter(u => !ADMIN_EMAILS.includes(u.email?.toLowerCase().trim()));
    
    const topPlume = [...eligible].sort((a, b) => {
      const countA = a.wallet?.history?.filter(h => h.type === "text_published" && !h.isConcours && new Date(h.date) >= lastSunday).length || 0;
      const countB = b.wallet?.history?.filter(h => h.type === "text_published" && !h.isConcours && new Date(h.date) >= lastSunday).length || 0;
      return countB - countA;
    })[0];
    
    if (topPlume && email === topPlume.email) {
      badges.push({ icon: <Edit3 size={10} />, label: "Plume Spéciale", color: "bg-teal-600 text-white animate-pulse" });
    }

    if (author.wallet?.history?.some(h => h.isConcours === true)) {
      badges.push({ icon: <Star size={10} />, label: "Guerrier Battle", color: "bg-indigo-500 text-white" });
    }

    return badges;
  };

  const filtered = authors.filter(a => 
    (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white gap-4 font-sans">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rassemblement du Cercle...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-16 animate-in fade-in duration-1000 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
        <div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black italic text-slate-900 tracking-tighter leading-tight md:leading-[0.8] font-sans">
            Communauté
          </h1>
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-teal-600 mt-4 flex items-center gap-2">
            <TrendingUp size={14} /> Cercle d'or de la littérature
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Chercher une plume..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl md:rounded-3xl pl-12 md:pl-14 pr-6 py-4 md:py-5 text-sm font-bold outline-none focus:border-teal-500/20 transition-all shadow-sm" 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {filtered.map((a) => {
          const isStaff = ADMIN_EMAILS.includes(a.email?.toLowerCase().trim());
          const isFollowing = a.subscribers?.includes(currentUser?.email);

          return (
            <div key={a.email} className="relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-teal-200 transition-all flex flex-col justify-between">
              
              <div className="absolute -top-4 left-4 md:left-8 flex flex-wrap gap-2 max-w-[95%] z-20">
                {getBadges(a, authors).map((b, i) => (
                  <div key={i} className={`${b.color} px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-2 shadow-lg text-[7px] md:text-[8px] font-black uppercase tracking-tighter whitespace-nowrap`}>
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 mt-6 sm:mt-4 text-center sm:text-left">
                <div className="relative flex-shrink-0">
                  <div className="aspect-square p-1 bg-gradient-to-tr from-teal-400 via-slate-200 to-amber-400 rounded-full shadow-lg">
                    <div className="p-1 bg-white rounded-full h-full w-full overflow-hidden">
                      <img 
                        src={a.profilePic || `https://api.dicebear.com/7.x/shapes/svg?seed=${a.email}`} 
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover bg-slate-50" 
                        alt={a.penName}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 flex-grow overflow-hidden">
                  <h2 className="text-2xl md:text-3xl font-black italic text-slate-900 tracking-tighter truncate leading-tight">
                    {a.penName || "Plume"}
                  </h2>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
                      <UsersIcon size={12}/> {a.subscribers?.length || 0} Abonnés
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                      <Coins size={12}/> {a.wallet?.balance || 0} Li
                    </div>
                  </div>

                  {currentUser?.email !== a.email && (
                    <button
                      onClick={() => handleFollow(a.email)}
                      disabled={submitting === a.email}
                      className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                        isFollowing 
                        ? "bg-slate-100 text-slate-500 hover:text-rose-500 border-slate-200" 
                        : "bg-teal-600 text-white hover:bg-slate-900 shadow-md"
                      }`}
                    >
                      {submitting === a.email ? <Loader2 size={12} className="animate-spin" /> : (isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />)}
                      {isFollowing ? "Désabonner" : "Suivre la plume"}
                    </button>
                  )}
                </div>
              </div>
              
              <Link 
                href={`/auteur/${encodeURIComponent(a.email)}`} 
                className="mt-8 md:mt-10 flex items-center justify-center gap-3 w-full py-4 md:py-5 bg-slate-950 text-white rounded-2xl md:rounded-[1.8rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg"
              >
                Voir le catalogue <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LOGIQUE SERVEUR : ISR
export async function getStaticProps() {
  try {
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users`);
    const files = await res.json();
    if (Array.isArray(files)) {
      const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(f.download_url).then(r => r.json()));
      const allUsers = await Promise.all(promises);
      const sorted = allUsers.sort((a, b) => (Number(b.wallet?.balance) || 0) - (Number(a.wallet?.balance) || 0));
      return { props: { initialAuthors: sorted }, revalidate: 60 };
    }
  } catch (e) {
    console.error("ISR Community Error:", e);
  }
  return { props: { initialAuthors: [] }, revalidate: 10 };
}

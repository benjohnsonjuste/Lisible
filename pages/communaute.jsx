"use client";
import React, { useEffect, useState } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, ArrowRight, 
  Search, Loader2, ShieldCheck, Gem, Award, Coins, Sparkles, Edit3,
  TrendingUp, Cake, Crown 
} from "lucide-react"; // Note: Assurez-vous d'utiliser lucide-react
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setCurrentUser(JSON.parse(logged));
      await loadUsers();
    };
    loadData();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      const files = await res.json();
      
      if (!Array.isArray(files)) return;

      const dataPromises = files
        .filter(f => f.name.endsWith('.json'))
        .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
      
      const allUsers = await Promise.all(dataPromises);
      
      // Tri de prestige : Solde Li décroissant
      setAuthors(allUsers.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0)));
    } catch (e) { 
      toast.error("Erreur de synchronisation de la communauté"); 
    } finally { 
      setLoading(false); 
    }
  }

  const getBadges = (author, allUsers) => {
    const badges = [];
    const email = author.email?.toLowerCase();
    const subs = author.stats?.subscribers || 0;
    const texts = author.stats?.totalTexts || 0;
    const today = new Date();

    // 1. BADGE PGD
    if (email === "jb7management@gmail.com") {
      badges.push({ 
        icon: <Crown size={10} />, 
        label: "PGD", 
        color: "bg-slate-950 text-amber-400 border border-amber-500/30" 
      });
    }

    // 2. STAFF
    const staffEmails = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"];
    if (staffEmails.includes(email)) {
      badges.push({ icon: <ShieldCheck size={10} />, label: "Staff", color: "bg-indigo-600 text-white" });
    }

    // 3. ANNIVERSAIRE (Optimisé)
    if (author.birthday) {
      const bDay = new Date(author.birthday);
      if (bDay.getDate() === today.getDate() && bDay.getMonth() === today.getMonth()) {
        badges.push({ 
          icon: <Cake size={10} />, 
          label: "C'est mon jour !", 
          color: "bg-rose-500 text-white animate-pulse" 
        });
      }
    }

    // 4. PLUME DE LA SEMAINE (Calcul temps réel)
    const excludedEmails = ["jb7management@gmail.com", "adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"];
    if (!excludedEmails.includes(email) && today.getDay() === 6) { // Samedi
      const eligible = allUsers.filter(u => !excludedEmails.includes(u.email?.toLowerCase()));
      const topWriter = [...eligible].sort((a, b) => (b.stats?.totalTexts || 0) - (a.stats?.totalTexts || 0))[0];
      
      if (topWriter && email === topWriter.email && texts > 0) {
        badges.push({ 
          icon: <TrendingUp size={10} />, 
          label: "Plume de la semaine", 
          color: "bg-teal-500 text-white" 
        });
      }
    }

    // 5. RANGS DE PRESTIGE
    if (subs >= 2000) badges.push({ icon: <Sparkles size={10} />, label: "Diamant", color: "bg-cyan-500 text-white" });
    else if (subs >= 750) badges.push({ icon: <Award size={10} />, label: "Or", color: "bg-amber-400 text-slate-900" });
    else if (subs >= 250) badges.push({ icon: <Award size={10} />, label: "Bronze", color: "bg-orange-700 text-white" });
    else if (texts >= 1) badges.push({ icon: <Edit3 size={10} />, label: "Plume", color: "bg-slate-900 text-white" });

    return badges;
  };

  const filtered = authors.filter(a => 
    (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture de l'Arène...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <h1 className="text-6xl md:text-8xl font-black italic text-slate-900 tracking-tighter leading-[0.8]">Communauté</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 mt-4 flex items-center gap-2">
            <Sparkles size={14} /> L'Élite de la littérature certifiée
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Chercher un auteur ou un email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl pl-14 pr-6 py-5 text-sm font-bold outline-none focus:border-teal-500/20 focus:bg-white transition-all shadow-inner" 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filtered.length > 0 ? filtered.map((a) => {
          const authorBadges = getBadges(a, authors);
          const isPGD = a.email?.toLowerCase() === "jb7management@gmail.com";
          
          return (
            <div key={a.email} className={`relative bg-white rounded-[3.5rem] p-10 border transition-all duration-500 group ${
              isPGD ? "border-amber-100 shadow-amber-900/5 shadow-2xl" : "border-slate-100 shadow-xl shadow-slate-200/50 hover:border-teal-100"
            }`}>
              
              {/* Conteneur de Badges */}
              <div className="absolute -top-4 left-8 flex flex-wrap gap-2 max-w-[90%] z-20">
                {authorBadges.map((b, i) => (
                  <div key={i} className={`${b.color} px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg text-[9px] font-black uppercase tracking-tighter transition-transform group-hover:-translate-y-1`}>
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-8 mt-4">
                <div className="relative">
                  <img 
                    src={a.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.email}`} 
                    className="w-24 h-24 rounded-[2.5rem] object-cover bg-slate-100 border-4 border-white shadow-2xl transition-transform duration-700 group-hover:rotate-3 group-hover:scale-110" 
                    alt={a.penName}
                  />
                  {isPGD && <Crown className="absolute -top-3 -right-3 text-amber-500 drop-shadow-lg" size={24} />}
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-3xl font-black italic text-slate-900 leading-none tracking-tighter group-hover:text-teal-600 transition-colors">
                    {a.penName || a.name || "Anonyme"}
                  </h2>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        <UsersIcon size={14} className="text-slate-300" />
                        {a.stats?.subscribers || 0}
                      </div>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        <Edit3 size={14} className="text-slate-300" />
                        {a.stats?.totalTexts || 0} textes
                      </div>
                    </div>
                    {/* Badge de Fortune (Li) */}
                    <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 w-fit px-3 py-1 rounded-xl">
                      <Coins size={12} className="text-teal-500" />
                      <span className="text-[11px] font-black">{ (a.wallet?.balance || 0).toLocaleString() } Li</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link 
                href={`/auteur/${encodeURIComponent(a.email)}`} 
                className="mt-10 flex items-center justify-center gap-3 w-full py-5 bg-slate-950 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl active:scale-95 group"
              >
                Explorer son univers <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucune plume ne correspond à votre recherche</p>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-10 border-t border-slate-100 flex justify-center">
         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.8em]">Lisible.biz • La Communauté de l'Excellence</p>
      </footer>
    </div>
  );
}

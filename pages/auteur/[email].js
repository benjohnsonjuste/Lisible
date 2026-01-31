"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeft, BookOpen, Eye, Heart, 
  User, Loader2, Sparkles, TrendingUp, 
  ShieldCheck, Award, Gem, Coins 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorCataloguePage() {
  const router = useRouter();
  const { email } = router.query; 

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Nécessaire pour le calcul des badges
  const [loading, setLoading] = useState(true);

  const decodeGitHubContent = (base64) => {
    try {
      return decodeURIComponent(
        atob(base64.replace(/\s/g, ""))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (e) {
      return null;
    }
  };

  // LOGIQUE DES BADGES (Identique à communaute.js pour la cohérence)
  const getBadges = (currentAuthor, usersList) => {
    const badges = [];
    const mail = currentAuthor.email?.toLowerCase();

    if (mail === "cmo.lablitteraire7@gmail.com") {
      badges.push({ icon: <ShieldCheck size={12} />, label: "Staff Officiel", color: "bg-indigo-600 text-white" });
    }

    if (usersList.length > 0) {
      const topEarner = [...usersList].sort((a, b) => (b.wallet?.totalEarned || 0) - (a.wallet?.totalEarned || 0))[0];
      if (topEarner && mail === topEarner.email && (currentAuthor.wallet?.totalEarned > 0)) {
        badges.push({ icon: <Award size={12} />, label: "Plume de la Semaine", color: "bg-amber-400 text-slate-900" });
      }

      const topGiver = [...usersList].sort((a, b) => {
        const countA = a.wallet?.history?.filter(h => h.type === "gift_sent").length || 0;
        const countB = b.wallet?.history?.filter(h => h.type === "gift_sent").length || 0;
        return countB - countA;
      })[0];
      if (topGiver && mail === topGiver.email && (currentAuthor.wallet?.history?.length > 5)) {
        badges.push({ icon: <Gem size={12} />, label: "Mécène VIP", color: "bg-rose-500 text-white" });
      }
    }
    return badges;
  };

  const fetchAuthorData = useCallback(async (targetEmail) => {
    setLoading(true);
    try {
      const cleanEmail = decodeURIComponent(targetEmail).toLowerCase().trim();
      const cacheBuster = `t=${Date.now()}`; 

      // 1. RÉCUPÉRATION DE TOUS LES UTILISATEURS (pour le contexte des badges)
      const usersListRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?${cacheBuster}`);
      if (usersListRes.ok) {
        const userFiles = await usersListRes.json();
        const userPromises = userFiles.filter(f => f.name.endsWith('.json')).map(f => 
          fetch(`${f.download_url}?${cacheBuster}`).then(r => r.json()).catch(() => null)
        );
        const resolvedUsers = (await Promise.all(userPromises)).filter(u => u !== null);
        setAllUsers(resolvedUsers);
        
        // Trouver l'auteur spécifique dans cette liste
        const found = resolvedUsers.find(u => u.email?.toLowerCase().trim() === cleanEmail);
        if (found) setAuthor(found);
      }

      // 2. RÉCUPÉRATION DES PUBLICATIONS
      const textsRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?${cacheBuster}`);
      if (textsRes.ok) {
        const files = await textsRes.json();
        const textPromises = files.filter(f => f.name.endsWith('.json')).map(file => 
          fetch(`${file.download_url}?${cacheBuster}`).then(r => r.json()).catch(() => null)
        );
        const allTexts = (await Promise.all(textPromises)).filter(t => t !== null);
        const filteredTexts = allTexts.filter(t => t.authorEmail?.toLowerCase().trim() === cleanEmail);
        setTexts(filteredTexts.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }

    } catch (e) {
      toast.error("Erreur de synchronisation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (router.isReady && email) {
      fetchAuthorData(email);
    }
  }, [router.isReady, email, fetchAuthorData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverture de la galerie...</p>
    </div>
  );

  const authorBadges = author ? getBadges(author, allUsers) : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-1000">
      
      {/* HEADER PROFIL */}
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20">
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-all">
          <ArrowLeft size={20} />
        </button>

        <div className="relative shrink-0 mt-8 md:mt-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-slate-900 border-8 border-white shadow-2xl overflow-hidden">
            <img src={author?.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="" />
          </div>
          {authorBadges.length > 0 && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-1 w-max">
               {authorBadges.map((b, i) => (
                 <div key={i} className={`${b.color} px-3 py-1 rounded-lg shadow-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter`}>
                   {b.icon} {b.label}
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="text-center md:text-left space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
            {author?.penName || author?.name || "Plume Anonyme"}
          </h1>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-3">
              <BookOpen size={14} className="text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{texts.length} Manuscrits</span>
            </div>
            <div className="bg-amber-50 text-amber-600 border border-amber-100 px-5 py-2.5 rounded-xl flex items-center gap-3">
              <Coins size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{author?.wallet?.balance || 0} Li</span>
            </div>
            <div className="bg-slate-50 px-5 py-2.5 rounded-xl flex items-center gap-3 border border-slate-100 text-slate-500">
              <TrendingUp size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{author?.subscribers?.length || 0} Abonnés</span>
            </div>
          </div>
        </div>
      </header>

      {/* CATALOGUE */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Galerie Publique</h2>
          <div className="h-px bg-slate-100 grow" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {texts.map((txt) => (
            <Link 
              href={`/texts/${txt.id}`} 
              key={txt.id} 
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:border-teal-500/30 transition-all duration-300"
            >
              <div className="space-y-2">
                <span className="text-[8px] font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md uppercase tracking-widest">
                  {txt.category || "Littérature"}
                </span>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tight">
                  {txt.title}
                </h3>
                <p className="text-[9px] font-bold text-slate-300 uppercase">
                  Parution : {new Date(txt.date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-8 mt-6 md:mt-0">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-slate-200" />
                  <span className="font-black text-xs">{txt.views || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-slate-200" />
                  <span className="font-black text-xs">{txt.likes?.length || 0}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <ArrowLeft size={18} className="rotate-180" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

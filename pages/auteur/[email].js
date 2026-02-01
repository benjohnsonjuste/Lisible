"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeft, BookOpen, Eye, Heart, 
  User, Loader2, Sparkles, TrendingUp, 
  ShieldCheck, Award, Gem, Coins, HeartHandshake
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorCataloguePage() {
  const router = useRouter();
  const { email } = router.query; 

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // LOGIQUE DES BADGES
  const getBadges = (currentAuthor, usersList) => {
    const badges = [];
    const mail = currentAuthor.email?.toLowerCase();
    if (mail === "cmo.lablitteraire7@gmail.com") {
      badges.push({ icon: <ShieldCheck size={12} />, label: "Staff Officiel", color: "bg-indigo-600 text-white" });
    }
    if (usersList.length > 0) {
      const topEarner = [...usersList].sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0))[0];
      if (topEarner && mail === topEarner.email) {
        badges.push({ icon: <Award size={12} />, label: "Plume d'Or", color: "bg-amber-400 text-slate-900" });
      }
    }
    return badges;
  };

  const fetchAuthorData = useCallback(async (targetEmail) => {
    setLoading(true);
    try {
      const cleanEmail = decodeURIComponent(targetEmail).toLowerCase().trim();
      const t = Date.now(); 

      // 1. RÉCUPÉRATION DES UTILISATEURS
      const usersRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${t}`);
      if (usersRes.ok) {
        const files = await usersRes.json();
        const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${t}`).then(r => r.json()));
        const users = await Promise.all(promises);
        setAllUsers(users);
        const found = users.find(u => u.email?.toLowerCase() === cleanEmail);
        if (found) setAuthor(found);
      }

      // 2. RÉCUPÉRATION DES PUBLICATIONS
      const textsRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${t}`);
      if (textsRes.ok) {
        const files = await textsRes.json();
        const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${t}`).then(r => r.json()));
        const allTexts = await Promise.all(promises);
        const filtered = allTexts.filter(t => t.authorEmail?.toLowerCase() === cleanEmail);
        setTexts(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (e) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (router.isReady && email) fetchAuthorData(email);
  }, [router.isReady, email, fetchAuthorData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverture de la galerie...</p>
    </div>
  );

  const totalCertifications = texts.reduce((acc, curr) => acc + (curr.totalCertified || 0), 0);
  const authorBadges = author ? getBadges(author, allUsers) : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-1000">
      
      {/* HEADER PROFIL */}
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl">
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-all">
          <ArrowLeft size={20} />
        </button>

        <div className="relative shrink-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-slate-900 border-8 border-white shadow-2xl overflow-hidden">
            <img src={author?.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-1 w-max">
             {authorBadges.map((b, i) => (
               <div key={i} className={`${b.color} px-3 py-1 rounded-lg shadow-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter`}>
                 {b.icon} {b.label}
               </div>
             ))}
          </div>
        </div>

        <div className="text-center md:text-left space-y-6 grow">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
              {author?.penName || author?.firstName || "Plume Anonyme"}
            </h1>
            <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mt-2">Auteur Lisible</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
              <BookOpen size={14} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase">{texts.length} Textes</span>
            </div>
            <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-teal-100">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase">{totalCertifications} Certifs</span>
            </div>
            <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-amber-100">
              <Coins size={14} />
              <span className="text-[10px] font-black uppercase">{author?.wallet?.balance || 0} Li</span>
            </div>
          </div>
        </div>

        {/* BOUTON SOUTENIR (Achat de Li pour l'auteur) */}
        <Link 
          href={`/shop?for=${encodeURIComponent(author?.email)}`}
          className="bg-slate-900 text-white px-8 py-6 rounded-[2rem] flex flex-col items-center gap-2 hover:bg-teal-600 transition-all group shadow-xl"
        >
          <HeartHandshake className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Soutenir l'auteur</span>
        </Link>
      </header>

      {/* CATALOGUE */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Galerie de l'auteur</h2>
          <div className="h-px bg-slate-100 grow" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {texts.map((txt) => (
            <Link 
              href={`/texts/${txt.id}`} 
              key={txt.id} 
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-50 hover:border-teal-500/30 transition-all shadow-sm hover:shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">{txt.category || "Œuvre"}</span>
                  {txt.totalCertified > 0 && <span className="text-[8px] font-black bg-teal-500 text-white px-2 py-0.5 rounded uppercase">Certifié</span>}
                </div>
                <h3 className="text-3xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tight">
                  {txt.title}
                </h3>
              </div>

              <div className="flex items-center gap-8 mt-6 md:mt-0">
                <div className="text-center">
                  <p className="text-xl font-black text-slate-900">{txt.views || 0}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Lectures</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-teal-500">{txt.totalCertified || 0}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Sceaux</p>
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

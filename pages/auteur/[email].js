"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeft, BookOpen, User, Loader2, Sparkles, 
  ShieldCheck, Award, HeartHandshake, UserPlus, UserMinus, Coins
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
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com", "cmo.lablitteraire7@gmail.com"];

  const getRank = (sc) => {
    if (sc >= 1000) return { name: "Maître de Plume", color: "text-purple-600", bg: "bg-purple-50", icon: "👑" };
    if (sc >= 200) return { name: "Plume d'Argent", color: "text-slate-500", bg: "bg-slate-50", icon: "✨" };
    if (sc >= 50) return { name: "Plume de Bronze", color: "text-orange-600", bg: "bg-orange-50", icon: "📜" };
    return { name: "Plume de Plomb", color: "text-slate-400", bg: "bg-slate-100", icon: "🖋️" };
  };

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setCurrentUser(JSON.parse(loggedUser));
  }, []);

  const fetchAuthorData = useCallback(async (targetEmail) => {
    setLoading(true);
    try {
      const cleanEmail = decodeURIComponent(targetEmail).toLowerCase().trim();
      const t = Date.now(); 
      const usersRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${t}`);
      if (usersRes.ok) {
        const files = await usersRes.json();
        const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${t}`).then(r => r.json()));
        const users = await Promise.all(promises);
        setAllUsers(users);
        const found = users.find(u => u.email?.toLowerCase() === cleanEmail);
        if (found) setAuthor(found);
      }
      const textsRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${t}`);
      if (textsRes.ok) {
        const files = await textsRes.json();
        const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${t}`).then(r => r.json()));
        const allTexts = await Promise.all(promises);
        setTexts(allTexts.filter(t => t.authorEmail?.toLowerCase() === cleanEmail).sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (e) { toast.error("Erreur de chargement"); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (router.isReady && email) fetchAuthorData(email);
  }, [router.isReady, email, fetchAuthorData]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    setSubmitting(true);
    try {
      const res = await fetch("/api/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerEmail: currentUser.email, targetEmail: author.email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.isSubscribed ? "Abonnement réussi" : "Désabonnement réussi");
        setAuthor(prev => ({ ...prev, subscribers: data.isSubscribed ? [...(prev.subscribers || []), currentUser.email] : (prev.subscribers || []).filter(e => e !== currentUser.email) }));
      }
    } catch (err) { toast.error("Action impossible"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  const rank = getRank(author?.wallet?.balance || 0);
  const isFollowing = author?.subscribers?.includes(currentUser?.email);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-1000">
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl">
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-all"><ArrowLeft size={20} /></button>
        <div className="w-40 h-40 rounded-[2.5rem] bg-slate-900 border-8 border-white shadow-2xl overflow-hidden shrink-0">
          <img src={author?.profilePic || `https://api.dicebear.com/7.x/shapes/svg?seed=${author?.email}`} className="w-full h-full object-cover" />
        </div>
        <div className="text-center md:text-left grow space-y-4">
          <div>
            <div className={`inline-flex items-center gap-2 ${rank.bg} ${rank.color} px-3 py-1 rounded-xl mb-2 text-[8px] font-black uppercase tracking-widest`}>
              <span>{rank.icon}</span> {rank.name}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">{author?.penName || "Plume"}</h1>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
              <BookOpen size={14} className="text-slate-400" /> <span className="text-[10px] font-black uppercase">{texts.length} Textes</span>
            </div>
            <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-teal-100">
               <ShieldCheck size={14} /> <span className="text-[10px] font-black uppercase">{texts.reduce((acc, curr) => acc + (curr.totalCertified || 0), 0)} Sceaux</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
            <button disabled={submitting} onClick={handleFollow} className={`px-8 py-4 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-sm border active:scale-95 transition-all ${isFollowing ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-teal-600 text-white border-transparent shadow-md"}`}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />)} {isFollowing ? "Désabonner" : "Suivre"}
            </button>
            <Link href={`/shop?for=${encodeURIComponent(author?.email)}`} className="bg-slate-900 text-white px-8 py-6 rounded-[2rem] flex flex-col items-center gap-2 hover:bg-teal-600 transition-all shadow-xl">
              <HeartHandshake /> <span className="text-[10px] font-black uppercase tracking-widest">Soutenir l'auteur</span>
            </Link>
        </div>
      </header>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Galerie de l'auteur</h2>
          <div className="h-px bg-slate-100 grow" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          {texts.map((txt) => (
            <Link href={`/texts/${txt.id}`} key={txt.id} className="group flex flex-col md:flex-row items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-50 hover:border-teal-500/30 transition-all shadow-sm hover:shadow-xl">
              <div className="space-y-3">
                <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">{txt.category || "Œuvre"}</span>
                <h3 className="text-3xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tight">{txt.title}</h3>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                   <p className="text-xl font-black text-teal-500">{txt.totalCertified || 0}</p>
                   <p className="text-[8px] font-black text-slate-400 uppercase">Sceaux</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all"><ArrowLeft size={18} className="rotate-180" /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

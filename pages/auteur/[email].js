"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, BookOpen, User, Loader2, Sparkles, 
  ShieldCheck, Award, HeartHandshake, UserPlus, UserMinus, Coins, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorCataloguePage({ params }) {
  const router = useRouter();
  const authorEmail = params?.email; 

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Système de rangs basé sur le solde Li
  const getRank = (balance) => {
    const sc = Number(balance || 0);
    if (sc >= 25000) return { name: "Légende de Plume", color: "text-amber-600", bg: "bg-amber-50", icon: "🏆" };
    if (sc >= 5000) return { name: "Maître Poète", color: "text-purple-600", bg: "bg-purple-50", icon: "👑" };
    if (sc >= 1000) return { name: "Plume d'Argent", color: "text-slate-500", bg: "bg-slate-50", icon: "✨" };
    return { name: "Jeune Plume", color: "text-teal-600", bg: "bg-teal-50", icon: "🖋️" };
  };

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setCurrentUser(JSON.parse(loggedUser));
  }, []);

  const fetchAuthorFullData = useCallback(async (targetEmail) => {
    setLoading(true);
    try {
      const cleanEmail = decodeURIComponent(targetEmail).toLowerCase().trim();
      
      // 1. Récupération du profil et stats via l'API consolidée
      const statsRes = await fetch(`/api/user-stats?email=${cleanEmail}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAuthor({
          email: cleanEmail,
          penName: statsData.penName,
          profilePic: statsData.profilePic,
          subscribers: statsData.subscribersList || [],
          wallet: { balance: statsData.liBalance }
        });
      }

      // 2. Récupération des textes de l'auteur (Index global pour performance)
      const textsRes = await fetch(`/api/texts?limit=1000`);
      if (textsRes.ok) {
        const json = await textsRes.json();
        const filtered = (json.data || [])
          .filter(t => t.authorEmail?.toLowerCase().trim() === cleanEmail)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTexts(filtered);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Profil introuvable"); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (authorEmail) fetchAuthorFullData(authorEmail);
  }, [authorEmail, fetchAuthorFullData]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === author?.email) return toast.error("Vous ne pouvez pas vous suivre");
    
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
        setAuthor(prev => ({ 
          ...prev, 
          subscribers: data.isSubscribed 
            ? [...(prev.subscribers || []), currentUser.email] 
            : (prev.subscribers || []).filter(e => e !== currentUser.email) 
        }));
      }
    } catch (err) { 
      toast.error("Action impossible"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading && !author) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4 font-sans">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Appel de la Plume...</p>
    </div>
  );

  const rank = getRank(author?.wallet?.balance || 0);
  const isFollowing = author?.subscribers?.includes(currentUser?.email);
  const totalLiGained = texts.reduce((acc, curr) => acc + (Number(curr.totalCertified || 0) * 50), 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-1000 font-sans bg-[#FCFBF9]">
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl">
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-40 h-40 rounded-[2.5rem] bg-slate-900 border-8 border-white shadow-2xl overflow-hidden shrink-0">
          <img 
            src={author?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${author?.penName || 'P'}&backgroundColor=0f172a`} 
            className="w-full h-full object-cover" 
            alt="Profile" 
          />
        </div>

        <div className="text-center md:text-left grow space-y-4">
          <div>
            <div className={`inline-flex items-center gap-2 ${rank.bg} ${rank.color} px-3 py-1 rounded-xl mb-2 text-[8px] font-black uppercase tracking-widest`}>
              <span>{rank.icon}</span> {rank.name}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
              {author?.penName || "Plume de Lisible"}
            </h1>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
              <BookOpen size={14} className="text-slate-400" /> 
              <span className="text-[10px] font-black uppercase">{texts.length} Œuvres</span>
            </div>
            <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-teal-100">
               <Coins size={14} /> 
               <span className="text-[10px] font-black uppercase">{totalLiGained} Li Collectés</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
            <button 
              disabled={submitting} 
              onClick={handleFollow} 
              className={`px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-sm border active:scale-95 transition-all ${
                isFollowing 
                ? "bg-slate-100 text-slate-500 border-slate-200" 
                : "bg-teal-600 text-white border-transparent shadow-md hover:bg-slate-900"
              }`}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />)} 
              {isFollowing ? "Désabonner" : "Suivre"}
            </button>
            <Link 
              href={`/shop?for=${encodeURIComponent(author?.email || "")}`} 
              className="bg-slate-900 text-white px-8 py-6 rounded-[2rem] flex flex-col items-center gap-2 hover:bg-teal-600 transition-all shadow-xl"
            >
              <HeartHandshake /> 
              <span className="text-[10px] font-black uppercase tracking-widest">Soutenir l'auteur</span>
            </Link>
        </div>
      </header>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Galerie de l'auteur</h2>
          <div className="h-px bg-slate-100 grow" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {texts.map((txt) => {
            const certs = Number(txt.totalCertified || 0);
            return (
              <Link 
                href={`/texts/${txt.id}`} 
                key={txt.id} 
                className="group flex flex-col md:flex-row items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-50 hover:border-teal-500/30 transition-all shadow-sm hover:shadow-xl"
              >
                <div className="space-y-3">
                  <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">
                    {txt.isConcours ? "Battle Poétique" : (txt.genre || "Œuvre")}
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tight leading-tight">
                    {txt.title}
                  </h3>
                </div>
                <div className="flex items-center gap-8 mt-4 md:mt-0">
                  <div className="text-center">
                     <p className={`text-xl font-black ${certs > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {certs}
                     </p>
                     <p className="text-[8px] font-black text-slate-400 uppercase">Sceaux Li</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            );
          })}

          {texts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                 Cette plume n'a pas encore laissé de trace.
               </p>
            </div>
          )}
        </div>
      </div>

      <footer className="pt-20 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
           Lisible.biz • Profil Certifié • 2026
         </p>
      </footer>
    </div>
  );
}

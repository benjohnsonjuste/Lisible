"use client";
import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, BookOpen, Loader2, UserPlus, UserMinus, Coins, ChevronRight, HeartHandshake, ShieldCheck 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorCataloguePage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const authorEmailId = resolvedParams.email; // Email encodé ou brut

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const fetchAuthorData = useCallback(async (id) => {
    setLoading(true);
    try {
      // 1. Récupération du profil via le nouveau système (Décode l'email si nécessaire)
      const authorEmail = id.includes('=') ? atob(id) : id;
      const userRes = await fetch(`/api/github-db?type=user&id=${authorEmail}`);
      const userData = await userRes.json();
      
      if (!userData || !userData.content) throw new Error("Auteur introuvable");
      setAuthor(userData.content);

      // 2. Récupération des textes filtrés via l'index central
      const indexRes = await fetch(`/api/github-db?type=library`);
      const indexData = await indexRes.json();
      
      if (indexData && indexData.content) {
        const filtered = indexData.content
          .filter(t => t.authorEmail?.toLowerCase() === authorEmail.toLowerCase())
          .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setTexts(filtered);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Impossible de charger le profil"); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (authorEmailId) fetchAuthorData(authorEmailId);
  }, [authorEmailId, fetchAuthorData]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    setSubmitting(true);
    
    try {
      // Utilisation de l'action centralisée 'toggle_follow'
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "toggle_follow", 
          userEmail: currentUser.email, 
          targetEmail: author.email 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.following ? "Vous suivez cette plume" : "Abonnement retiré");
        
        // Mise à jour locale pour éviter un rechargement complet
        setAuthor(prev => ({
          ...prev,
          followers: data.following 
            ? [...(prev.followers || []), currentUser.email] 
            : (prev.followers || []).filter(e => e !== currentUser.email)
        }));
      }
    } catch (err) { 
      toast.error("Action impossible"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Lecture du manuscrit...</p>
    </div>
  );

  const rank = getRank(author?.li || 0);
  const isFollowing = author?.followers?.includes(currentUser?.email);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-1000 bg-[#FCFBF9]">
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl">
        <button onClick={() => router.back()} className="absolute top-10 left-10 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 transition-all hover:rotate-12">
          <ArrowLeft size={20} />
        </button>

        <div className="w-44 h-44 rounded-[3rem] bg-slate-100 border-8 border-white shadow-2xl overflow-hidden group">
          <img 
            src={author?.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${author?.email}`} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            alt="Profile" 
          />
        </div>

        <div className="text-center md:text-left grow space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
              {author?.penName || author?.name || "Plume"}
            </h1>
            {author?.role === 'verified' && <ShieldCheck className="text-teal-500 mx-auto md:mx-0" size={32} fill="currentColor" fillOpacity={0.1} />}
          </div>
          
          <div className={`inline-flex items-center gap-2 ${rank.bg} ${rank.color} px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current/10`}>
            <span>{rank.icon}</span> {rank.name}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            <div className="bg-slate-50 px-5 py-2.5 rounded-2xl flex items-center gap-2">
              <BookOpen size={14} className="text-slate-400" /> 
              <span className="text-[10px] font-black uppercase tracking-tighter">{texts.length} Manuscrits</span>
            </div>
            <div className="bg-teal-50 text-teal-600 px-5 py-2.5 rounded-2xl flex items-center gap-2">
               <Coins size={14} /> 
               <span className="text-[10px] font-black uppercase tracking-tighter">{author?.li || 0} Li en poche</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[220px] w-full md:w-auto">
            <button 
              disabled={submitting} 
              onClick={handleFollow} 
              className={`px-8 py-5 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all ${
                isFollowing 
                ? "bg-slate-100 text-slate-400" 
                : "bg-slate-900 text-white hover:bg-teal-600 hover:scale-105 active:scale-95 shadow-xl"
              }`}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />)} 
              {isFollowing ? "Se désabonner" : "S'abonner à la plume"}
            </button>
            
            <Link 
              href={`/donate?to=${authorEmailId}`} 
              className="bg-white border-2 border-slate-100 text-slate-900 px-8 py-5 rounded-[2rem] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
            >
              <HeartHandshake size={18} className="group-hover:animate-bounce" /> 
              <span className="text-[10px] font-black uppercase tracking-widest">Soutenir</span>
            </Link>
        </div>
      </header>

      <div className="space-y-10">
        <div className="flex items-center gap-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-300 italic">Catalogue des œuvres</h2>
          <div className="h-px bg-slate-100 grow" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {texts.map((txt) => (
            <Link 
              href={`/texts/${txt.id}`} 
              key={txt.id} 
              className="group p-10 bg-white rounded-[3.5rem] border border-slate-100 hover:border-teal-500/20 hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-xl uppercase tracking-widest">
                    {txt.category}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tighter leading-tight">
                  {txt.title}
                </h3>
              </div>
              
              <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-teal-500" />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     {new Date(txt.date || txt.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                   </span>
                </div>
                <ChevronRight className="text-slate-200 group-hover:text-teal-600 group-hover:translate-x-2 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {texts.length === 0 && (
          <div className="text-center py-32 bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-100">
             <BookOpen className="text-slate-200 mx-auto mb-4" size={48} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               Aucun manuscrit publié pour le moment.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

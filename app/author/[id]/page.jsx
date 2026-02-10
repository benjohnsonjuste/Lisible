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
  const authorEmailId = resolvedParams.id || resolvedParams.email; // Supporte les deux variantes de slugs

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Système de rang basé sur la richesse en Li
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
      // 1. Décodage de l'email si nécessaire (Base64 -> Plain text)
      let authorEmail;
      try {
        authorEmail = (id.includes('=') || id.length > 20) ? atob(id) : id;
      } catch (e) {
        authorEmail = id;
      }

      // 2. Récupération du profil via l'API fusionnée
      const userRes = await fetch(`/api/github-db?type=user&id=${authorEmail}`);
      const userData = await userRes.json();
      
      // On accède à userData.content car l'API renvoie { content, sha }
      if (!userData || !userData.content) throw new Error("Auteur introuvable");
      setAuthor(userData.content);

      // 3. Récupération des œuvres via l'index global
      const indexRes = await fetch(`/api/github-db?type=library`);
      const indexData = await indexRes.json();
      
      if (indexData && indexData.content) {
        const filtered = indexData.content
          .filter(t => t.authorEmail?.toLowerCase() === authorEmail.toLowerCase() || t.author === userData.content.name)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTexts(filtered);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Profil introuvable dans le Grand Livre"); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (authorEmailId) fetchAuthorData(authorEmailId);
  }, [authorEmailId, fetchAuthorData]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === author.email) return toast.error("Vous ne pouvez pas vous suivre vous-même");
    
    setSubmitting(true);
    try {
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
        toast.success(data.isFollowing ? "Vous suivez désormais cette plume" : "Abonnement retiré");
        
        // Mise à jour locale de l'UI
        setAuthor(prev => ({
          ...prev,
          followers: data.isFollowing 
            ? [...(prev.followers || []), currentUser.email] 
            : (prev.followers || []).filter(e => e !== currentUser.email)
        }));
      }
    } catch (err) { 
      toast.error("Action impossible pour le moment"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Lecture du registre...</p>
    </div>
  );

  const rank = getRank(author?.li || 0);
  const isFollowing = author?.followers?.includes(currentUser?.email);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-1000 bg-[#FCFBF9] min-h-screen">
      {/* Header Profile Card */}
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 transition-all hover:bg-white hover:shadow-md">
          <ArrowLeft size={20} />
        </button>

        <div className="w-40 h-40 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden flex-shrink-0">
          <img 
            src={author?.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${author?.email}`} 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
            alt="Profile" 
          />
        </div>

        <div className="text-center md:text-left grow space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic">
              {author?.penName || author?.name || "Plume Mystère"}
            </h1>
            {author?.certified > 0 && <ShieldCheck className="text-teal-500 mx-auto md:mx-0" size={28} />}
          </div>
          
          <div className={`inline-flex items-center gap-2 ${rank.bg} ${rank.color} px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current/10`}>
            <span>{rank.icon}</span> {rank.name}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
              <BookOpen size={14} /> {texts.length} Œuvres
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-4 py-2 rounded-xl">
               <Coins size={14} /> {author?.li || 0} Li
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
            <button 
              disabled={submitting} 
              onClick={handleFollow} 
              className={`w-full px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${
                isFollowing 
                ? "bg-slate-100 text-slate-400" 
                : "bg-slate-950 text-white hover:bg-teal-600 shadow-lg shadow-teal-900/10"
              }`}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />)} 
              {isFollowing ? "Se désabonner" : "S'abonner"}
            </button>
            
            <Link 
              href={`/donate?to=${btoa(author?.email || "")}`} 
              className="w-full bg-white border-2 border-slate-50 text-slate-900 px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <HeartHandshake size={18} className="text-rose-500" /> Soutenir
            </Link>
        </div>
      </header>

      {/* Catalogue Grid */}
      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Manuscrits de l'auteur</h2>
          <div className="h-px bg-slate-100 grow" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {texts.map((txt) => (
            <Link 
              href={`/texts/${txt.id}`} 
              key={txt.id} 
              className="group p-8 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:border-teal-500/10 transition-all"
            >
              <div className="space-y-4">
                <span className="text-[8px] font-black bg-teal-50 text-teal-700 px-3 py-1 rounded-lg uppercase tracking-[0.2em]">
                  {txt.category || "Littérature"}
                </span>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors tracking-tighter italic leading-tight">
                  {txt.title}
                </h3>
                <div className="pt-6 flex items-center justify-between border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Posté le {new Date(txt.date).toLocaleDateString('fr-FR')}
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {texts.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200/50">
             <BookOpen className="text-slate-200 mx-auto mb-4" size={40} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               Aucun écrit n'a été versé au catalogue.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

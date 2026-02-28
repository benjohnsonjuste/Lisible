"use client";
import React, { useEffect, useState, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, BookOpen, Loader2, UserPlus, UserMinus, Coins, ChevronRight, HeartHandshake, ShieldCheck, Crown, Star, Share2, Info, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Cache global partagé avec la page Cercle
let authorDataCache = {};

export default function AuthorCataloguePage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const authorEmailId = resolvedParams.id || resolvedParams.email;

  const [author, setAuthor] = useState(authorDataCache[authorEmailId]?.author || null);
  const [texts, setTexts] = useState(authorDataCache[authorEmailId]?.texts || []);
  const [loading, setLoading] = useState(!authorDataCache[authorEmailId]);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalMaxViews, setGlobalMaxViews] = useState(0);
  const [showBio, setShowBio] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) { try { setCurrentUser(JSON.parse(loggedUser)); } catch (e) {} }
  }, []);

  const fetchAuthorData = useCallback(async (id) => {
    // Si on n'a pas de cache, on affiche le loader
    if (!authorDataCache[id]) setLoading(true);
    
    try {
      const authorEmail = decodeURIComponent(id).toLowerCase().trim();
      
      // Récupération parallèle des données
      const [userRes, indexRes] = await Promise.all([
        fetch(`/api/github-db?type=data&file=users`),
        fetch(`/api/github-db?type=data&file=library`)
      ]);
      
      const userData = await userRes.json();
      const indexData = await indexRes.json();
      
      let foundAuthor = null;
      let authorTexts = [];
      let maxViews = 0;

      if (userData?.content && Array.isArray(userData.content)) {
        foundAuthor = userData.content.find(u => 
          u.email?.toLowerCase().trim() === authorEmail
        );
      }

      if (indexData?.content && Array.isArray(indexData.content)) {
        const viewsMap = indexData.content.reduce((acc, pub) => {
          const email = pub.authorEmail?.toLowerCase().trim();
          if (email) acc[email] = (acc[email] || 0) + Number(pub.views || 0);
          return acc;
        }, {});
        
        maxViews = Math.max(...Object.values(viewsMap), 0);
        setGlobalMaxViews(maxViews);
        
        authorTexts = indexData.content.filter(t => 
          t.authorEmail?.toLowerCase().trim() === authorEmail
        );
      }

      // Mise à jour de l'état et du cache
      const freshData = { author: foundAuthor, texts: authorTexts, maxViews };
      authorDataCache[id] = freshData;
      
      setAuthor(foundAuthor);
      setTexts(authorTexts);
      
    } catch (e) { 
      console.error(e);
      if (!authorDataCache[id]) toast.error("Auteur introuvable"); 
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authorEmailId) fetchAuthorData(authorEmailId); }, [authorEmailId, fetchAuthorData]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === author?.email) return toast.error("Vous ne pouvez pas vous suivre vous-même");
    
    setSubmitting(true);
    const isFollowing = author?.followers?.includes(currentUser.email);
    
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: isFollowing ? "unfollow" : "follow", 
          userEmail: currentUser.email, 
          targetEmail: author.email 
        })
      });

      if (res.ok) {
        const updatedFollowers = isFollowing 
          ? author.followers.filter(e => e !== currentUser.email) 
          : [...(author.followers || []), currentUser.email];
        
        const updatedAuthor = { ...author, followers: updatedFollowers };
        setAuthor(updatedAuthor);
        
        // Mettre à jour le cache
        if (authorDataCache[authorEmailId]) {
          authorDataCache[authorEmailId].author = updatedAuthor;
        }
        
        toast.success(isFollowing ? "Abonnement retiré" : "Vous suivez cette plume !");
      }
    } catch (err) {
      toast.error("Erreur de liaison au serveur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareData = { 
      title: author?.penName || author?.name, 
      text: `Découvrez les œuvres de ${author?.penName || author?.name} sur Lisible ✨`, 
      url: window.location.href 
    };
    if (navigator.share) { try { await navigator.share(shareData); } catch (e) {} }
    else { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }
  };

  if (loading && !author) return <div className="h-screen flex items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" /></div>;

  const totalViews = texts.reduce((s, t) => s + Number(t.views || 0), 0);
  const isElite = totalViews === globalMaxViews && globalMaxViews > 0;
  const isFollowing = author?.followers?.includes(currentUser?.email);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 bg-[#FCFBF9] min-h-screen space-y-10">
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-2xl transition-transform hover:scale-105 active:scale-95 z-10"><ArrowLeft size={20} /></button>
        
        <div className="flex flex-col items-center gap-6">
          <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-100 flex-shrink-0">
            <img 
              src={author?.image || author?.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${author?.email}`} 
              className="w-full h-full object-cover" 
              alt={author?.penName || "Auteur"}
            />
            {isElite && <div className="absolute inset-0 border-4 border-amber-400 rounded-[2.5rem] animate-pulse" />}
          </div>
          
          <div className="w-full flex flex-col items-center">
            <button 
              onClick={() => setShowBio(!showBio)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors"
            >
              {showBio ? <ChevronUp size={14} /> : <Info size={14} />} 
              {showBio ? "Fermer la bio" : "Lire sa biographie"}
            </button>
            
            {showBio && (
              <div className="mt-4 p-6 bg-slate-50 rounded-3xl w-64 md:w-80 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs leading-relaxed text-slate-600 font-medium italic text-center">
                  {author?.bio ? author.bio : "Biographie non partagée."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center md:text-left grow space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic flex items-center gap-3 justify-center md:justify-start">
            {author?.penName || author?.name || "Plume Anonyme"} 
            {(author?.certified > 0 || author?.isCertified) && <ShieldCheck className="text-teal-500" size={28} fill="currentColor" />}
          </h1>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {isElite && <div className="bg-slate-950 text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Crown size={12}/> Élite</div>}
            <div className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"><Coins size={12} className="inline mr-1"/> {author?.li || 0} Li</div>
            <div className="bg-slate-50 text-slate-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{texts.length} Textes</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <button 
            onClick={handleFollow}
            disabled={submitting}
            className={`px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${
              isFollowing 
              ? "bg-slate-100 text-slate-400" 
              : "bg-slate-950 text-white hover:bg-teal-600 shadow-lg"
            }`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
            {isFollowing ? "Désabonner" : "Suivre"}
          </button>
          
          <Link href={`/donate?to=${btoa(author?.email || "")}`} className="bg-rose-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-slate-900 transition-all"><HeartHandshake size={18} /> Soutenir</Link>
          <button onClick={handleShare} className="bg-white border-2 border-slate-100 p-4 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"><Share2 size={18}/></button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {texts.length > 0 ? (
          texts.map(txt => (
            <Link href={`/texts/${txt.id}`} key={txt.id} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all">
              <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic mb-4">{txt.title}</h3>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{txt.views || 0} Lectures</span>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-teal-600 transition-all" />
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-[3.5rem] border border-dashed border-slate-200">
            <BookOpen className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-medium italic">Aucune œuvre publiée pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

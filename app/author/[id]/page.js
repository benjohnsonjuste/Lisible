"use client";
import React, { useEffect, useState, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, BookOpen, Loader2, UserPlus, UserMinus, Coins, ChevronRight, HeartHandshake, ShieldCheck, Crown, Star, Share2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorCataloguePage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const authorEmailId = resolvedParams.id || resolvedParams.email;

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalMaxViews, setGlobalMaxViews] = useState(0);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) { try { setCurrentUser(JSON.parse(loggedUser)); } catch (e) {} }
  }, []);

  const fetchAuthorData = useCallback(async (id) => {
    setLoading(true);
    try {
      const authorEmail = decodeURIComponent(id).toLowerCase().trim();
      
      // 1. Récupération du profil réel (data/users)
      const userRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(authorEmail)}`);
      const userData = await userRes.json();
      if (!userData?.content) throw new Error();
      setAuthor(userData.content);

      // 2. Récupération des œuvres et calcul des stats globales (data/publications)
      const indexRes = await fetch(`/api/github-db?type=library`);
      const indexData = await indexRes.json();
      
      if (indexData?.content) {
        const publications = indexData.content;
        
        // Calcul du record de lectures global pour le badge Élite
        const viewsMap = publications.reduce((acc, pub) => {
          const email = pub.authorEmail?.toLowerCase().trim();
          if (email) acc[email] = (acc[email] || 0) + Number(pub.views || 0);
          return acc;
        }, {});
        
        setGlobalMaxViews(Math.max(...Object.values(viewsMap), 0));
        
        // Filtrage des textes de cet auteur spécifique
        const authorTexts = publications
          .filter(t => t.authorEmail?.toLowerCase().trim() === authorEmail)
          .sort((a, b) => (b.id || 0) - (a.id || 0));
          
        setTexts(authorTexts);
      }
    } catch (e) { 
      toast.error("Profil introuvable dans les archives."); 
      router.push("/communaute");
    }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { if (authorEmailId) fetchAuthorData(authorEmailId); }, [authorEmailId, fetchAuthorData]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume.");
    setSubmitting(true);
    try {
      const isFollowing = author?.followers?.includes(currentUser.email);
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ 
          action: isFollowing ? "unfollow" : "follow", 
          userEmail: currentUser.email, 
          targetEmail: author.email 
        })
      });

      if (res.ok) {
        setAuthor(prev => ({
          ...prev,
          followers: isFollowing 
            ? prev.followers.filter(e => e !== currentUser.email) 
            : [...(prev.followers || []), currentUser.email]
        }));
        toast.success(isFollowing ? "Désabonné." : "Abonnement réussi !");
      }
    } catch (err) {
      toast.error("Erreur de synchronisation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const name = author?.penName || author?.name || "Auteur";
    const shareData = { 
      title: `Profil de ${name} | Lisible`, 
      text: `Découvrez l'univers littéraire de ${name} sur Lisible ✨`, 
      url: window.location.href 
    };
    if (navigator.share) { try { await navigator.share(shareData); } catch (e) {} }
    else { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  const totalViews = texts.reduce((s, t) => s + Number(t.views || 0), 0);
  const isElite = totalViews >= globalMaxViews && globalMaxViews > 0;
  const isFollowing = author?.followers?.includes(currentUser?.email);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 bg-[#FCFBF9] min-h-screen space-y-16">
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"><ArrowLeft size={20} /></button>
        
        <div className="w-44 h-44 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-50">
          <img 
            src={author?.profilePic || author?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${author?.penName || "Plume"}`} 
            className="w-full h-full object-cover" 
            alt="Avatar"
          />
          {isElite && <div className="absolute inset-0 border-4 border-amber-400 rounded-[3rem] animate-pulse pointer-events-none" />}
        </div>

        <div className="text-center md:text-left grow space-y-4">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-teal-600">Plume Certifiée</p>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic flex items-center gap-3 justify-center md:justify-start">
              {author?.penName || author?.name} {(author?.certified > 0 || author?.isCertified) && <ShieldCheck className="text-teal-500" size={28} />}
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {isElite && <div className="bg-slate-950 text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Crown size={12}/> Élite du Cercle</div>}
            <div className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Coins size={12}/> {author?.li || 0} Li</div>
            <div className="bg-slate-50 text-slate-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{author?.followers?.length || 0} Abonnés</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <button 
            onClick={handleFollow}
            disabled={submitting}
            className={`px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${isFollowing ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-teal-600 shadow-lg shadow-slate-900/10"}`}
          >
            {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
            {isFollowing ? "Se désabonner" : "Suivre la plume"}
          </button>
          
          <div className="flex gap-2">
            <Link href={`/donate?to=${btoa(author?.email || "")}`} className="grow bg-rose-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all">
              <HeartHandshake size={18} /> Soutenir
            </Link>
            <button onClick={handleShare} className="bg-white border-2 border-slate-100 px-5 py-4 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all">
              <Share2 size={18}/>
            </button>
          </div>
        </div>
      </header>
      
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">Manuscrits & Œuvres.</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{texts.length} publications</span>
        </div>

        {texts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {texts.map(txt => (
              <Link href={`/texts/${txt.id}`} key={txt.id} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-teal-100 transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-slate-50 group-hover:bg-teal-500 transition-colors" />
                <p className="text-[8px] font-black uppercase tracking-widest text-teal-600 mb-2">{txt.category || "Littérature"}</p>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic mb-6 leading-tight">{txt.title}</h3>
                <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen size={12} className="text-slate-300" /> {txt.views || 0} Lectures
                    </span>
                    {(txt.certified > 0 || txt.totalCertified > 0) && (
                      <span className="bg-teal-50 text-teal-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase">Certifié</span>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-[3.5rem] border border-dashed border-slate-200">
            <Star className="mx-auto text-slate-200 mb-4" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">L'encrier est encore plein... aucune œuvre publiée.</p>
          </div>
        )}
      </section>
    </div>
  );
}

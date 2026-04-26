"use client";
import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, HeartHandshake, ShieldCheck, Crown, Star, Share2, ChevronRight, Coins 
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
  const [globalMaxViews, setGlobalMaxViews] = useState(0);

  const GITHUB_CONFIG = { owner: "benjohnsonjuste", repo: "Lisible" };

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) { 
      try { setCurrentUser(JSON.parse(loggedUser)); } catch (e) {} 
    }
  }, []);

  const fetchAuthorData = useCallback(async (id) => {
    setLoading(true);
    try {
      const authorEmail = decodeURIComponent(id).toLowerCase().trim();
      
      // 1. Récupérer le profil de l'auteur
      const userRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/data/users/${authorEmail}.json`);
      if (!userRes.ok) throw new Error("Auteur introuvable");
      const userData = await userRes.json();
      setAuthor(userData);

      // 2. Récupérer toutes les publications pour les stats en temps réel
      const indexRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/data/publications/index.json`);
      const indexData = await indexRes.json();
      
      if (Array.isArray(indexData)) {
        // Calcul du record de vues global pour le badge Élite
        const viewsMap = indexData.reduce((acc, pub) => {
          const email = pub.authorEmail?.toLowerCase().trim();
          if (email) acc[email] = (acc[email] || 0) + Number(pub.views || 0);
          return acc;
        }, {});
        
        setGlobalMaxViews(Math.max(...Object.values(viewsMap), 0));
        
        // Filtrer les textes de cet auteur précis
        const authorWorks = indexData.filter(t => t.authorEmail?.toLowerCase().trim() === authorEmail);
        setTexts(authorWorks);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Profil inaccessible"); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    if (authorEmailId) fetchAuthorData(authorEmailId); 
  }, [authorEmailId, fetchAuthorData]);

  const handleShare = async () => {
    const shareData = { 
      title: author?.penName || author?.name, 
      text: `Découvrez l'univers littéraire de ${author?.penName || author?.name} sur Lisible ✨`, 
      url: window.location.href 
    };
    if (navigator.share) { 
      try { await navigator.share(shareData); } catch (e) {} 
    } else { 
      navigator.clipboard.writeText(window.location.href); 
      toast.success("Lien du profil copié !"); 
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  const totalViews = texts.reduce((s, t) => s + Number(t.views || 0), 0);
  const isElite = totalViews === globalMaxViews && globalMaxViews > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 bg-[#FCFBF9] min-h-screen space-y-16">
      {/* Header Profil */}
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-40 h-40 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative flex-shrink-0">
          <img 
            src={author?.image || author?.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${author?.email}`} 
            className="w-full h-full object-cover" 
            alt="Profil"
          />
          {isElite && (
            <div className="absolute inset-0 border-4 border-amber-400 rounded-[3rem] animate-pulse pointer-events-none" />
          )}
        </div>

        <div className="text-center md:text-left grow space-y-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic flex items-center gap-3 justify-center md:justify-start leading-none">
              {author?.penName || author?.name} 
              {author?.certified > 0 && <ShieldCheck className="text-teal-500" size={28} fill="currentColor" />}
            </h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-1">Membre du Cercle</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {isElite && (
              <div className="bg-slate-950 text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-400/20">
                <Crown size={12}/> Élite
              </div>
            )}
            <div className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100">
              <Coins size={12} className="inline mr-1"/> {author?.li || 0} Li cumulés
            </div>
          </div>
          
          <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed italic">
            {author?.bio || "Cette plume n'a pas encore partagé son histoire."}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <Link 
            href={`/donate?to=${btoa(author?.email || "")}`} 
            className="bg-rose-600 text-white px-8 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-slate-950 transition-all active:scale-95"
          >
            <HeartHandshake size={20} /> Soutenir l'Auteur
          </Link>
          <button 
            onClick={handleShare} 
            className="bg-white border-2 border-slate-50 p-5 rounded-[1.5rem] flex items-center justify-center hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900"
          >
            <Share2 size={20}/>
          </button>
        </div>
      </header>
      
      {/* Liste des Œuvres */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-2">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Manuscrits publiés</h2>
          <div className="h-px bg-slate-100 grow" />
        </div>

        {texts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {texts.map(txt => (
              <Link 
                href={`/texts/${txt.id}`} 
                key={txt.id} 
                className="group p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-teal-500/10 transition-all duration-500"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-lg">
                      {txt.category || "Littérature"}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold">
                      <Star size={12} className={Number(txt.likes) > 0 ? "text-amber-400 fill-amber-400" : ""} />
                      {txt.likes || 0}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tighter leading-tight">
                    {txt.title}
                  </h3>
                  
                  <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {txt.views || 0} Lectures
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold italic">Aucun manuscrit n'a encore été déposé dans ce catalogue.</p>
          </div>
        )}
      </div>
    </div>
  );
}

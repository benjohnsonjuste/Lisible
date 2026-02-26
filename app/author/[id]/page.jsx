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
      
      // 1. Récupérer l'utilisateur depuis /data/users.json
      const userRes = await fetch(`/api/github-db?type=data&file=users`);
      const userData = await userRes.json();
      
      if (userData?.content && Array.isArray(userData.content)) {
        const found = userData.content.find(u => 
          u.email?.toLowerCase().trim() === authorEmail
        );
        if (found) setAuthor(found);
      }

      // 2. Récupérer les textes depuis /data/library.json
      const indexRes = await fetch(`/api/github-db?type=data&file=library`);
      const indexData = await indexRes.json();
      
      if (indexData?.content && Array.isArray(indexData.content)) {
        // Calcul du record de vues global pour le badge Élite
        const viewsMap = indexData.content.reduce((acc, pub) => {
          const email = pub.authorEmail?.toLowerCase().trim();
          if (email) acc[email] = (acc[email] || 0) + Number(pub.views || 0);
          return acc;
        }, {});
        
        setGlobalMaxViews(Math.max(...Object.values(viewsMap), 0));
        
        // Filtrer les textes de cet auteur
        const authorTexts = indexData.content.filter(t => 
          t.authorEmail?.toLowerCase().trim() === authorEmail
        );
        setTexts(authorTexts);
      }
      
    } catch (e) { 
      console.error(e);
      toast.error("Auteur introuvable"); 
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authorEmailId) fetchAuthorData(authorEmailId); }, [authorEmailId, fetchAuthorData]);

  const handleShare = async () => {
    const shareData = { 
      title: author?.penName || author?.name, 
      text: `Découvrez les œuvres de ${author?.penName || author?.name} sur Lisible ✨`, 
      url: window.location.href 
    };
    if (navigator.share) { try { await navigator.share(shareData); } catch (e) {} }
    else { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" /></div>;

  const totalViews = texts.reduce((s, t) => s + Number(t.views || 0), 0);
  const isElite = totalViews === globalMaxViews && globalMaxViews > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 bg-[#FCFBF9] min-h-screen space-y-16">
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-2xl transition-transform hover:scale-105 active:scale-95"><ArrowLeft size={20} /></button>
        <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-100">
          <img 
            src={author?.image || author?.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${author?.email}`} 
            className="w-full h-full object-cover" 
            alt={author?.penName || "Auteur"}
          />
          {isElite && <div className="absolute inset-0 border-4 border-amber-400 rounded-[2.5rem] animate-pulse" />}
        </div>
        <div className="text-center md:text-left grow space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic flex items-center gap-3 justify-center md:justify-start">
            {author?.penName || author?.name || "Plume Anonyme"} 
            {(author?.certified > 0 || author?.isCertified) && <ShieldCheck className="text-teal-500" size={28} fill="currentColor" />}
          </h1>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {isElite && <div className="bg-slate-950 text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Crown size={12}/> Élite</div>}
            <div className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"><Coins size={12} className="inline mr-1"/> {author?.li || 0} Li</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
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

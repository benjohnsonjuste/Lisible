"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeft, BookOpen, Eye, Heart, 
  User, Loader2, Sparkles, TrendingUp, ShieldCheck 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorCataloguePage() {
  const router = useRouter();
  const { email } = router.query; 

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fonction de décodage UTF-8 sécurisée pour GitHub Base64
  const decodeGitHubContent = (base64) => {
    try {
      return decodeURIComponent(
        atob(base64.replace(/\s/g, ""))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (e) {
      console.error("Decoding error:", e);
      return null;
    }
  };

  const fetchAuthorData = useCallback(async (targetEmail) => {
    setLoading(true);
    try {
      // Nettoyage strict de l'email
      const cleanEmail = decodeURIComponent(targetEmail).toLowerCase().trim();
      const cacheBuster = `nocache=${Date.now()}`; 

      // 1. RÉCUPÉRATION DU PROFIL
      // On teste d'abord l'email tel quel, puis l'email encodé si nécessaire
      const userRes = await fetch(
        `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${cleanEmail}.json?${cacheBuster}`,
        { cache: 'no-store' }
      );
      
      if (!userRes.ok) throw new Error("Profil introuvable");

      const userData = await userRes.json();
      const decodedString = decodeGitHubContent(userData.content);
      
      if (!decodedString) throw new Error("Erreur de lecture du profil");
      
      const decodedUser = JSON.parse(decodedString);
      setAuthor(decodedUser);

      // 2. RÉCUPÉRATION DES PUBLICATIONS (SYNCHRO RÉELLE)
      const textsRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?${cacheBuster}`);
      
      if (textsRes.ok) {
        const files = await textsRes.json();
        // Filtrage des fichiers JSON uniquement
        const jsonFiles = files.filter(f => f.name.endsWith('.json'));
        
        // Récupération du contenu de chaque fichier
        const textPromises = jsonFiles.map(file => 
          fetch(`${file.download_url}?${cacheBuster}`).then(r => r.json()).catch(() => null)
        );
        
        const allTexts = (await Promise.all(textPromises)).filter(t => t !== null);
        
        // Filtrage par email (insensible à la casse)
        const filteredTexts = allTexts.filter(t => 
          t.authorEmail?.toLowerCase().trim() === cleanEmail
        );
        
        setTexts(filteredTexts.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }

    } catch (e) {
      console.error("Catalogue Sync Error:", e);
      toast.error("Données du profil partiellement introuvables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (router.isReady && email) {
      fetchAuthorData(email);
    }
  }, [router.isReady, email, fetchAuthorData]);

  if (loading || !router.isReady) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Synchronisation du catalogue...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-1000">
      
      {/* HEADER AUTEUR */}
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
        <button 
          onClick={() => router.push('/')} 
          className="absolute top-8 left-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-all hover:scale-110 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative shrink-0 mt-8 md:mt-0">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-[3.5rem] bg-slate-900 border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center text-5xl font-black text-teal-400 italic">
            {author?.profilePic ? (
              <img src={author.profilePic} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="uppercase">{author?.penName?.charAt(0) || author?.name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white p-3 rounded-2xl shadow-xl">
             <Sparkles size={20} />
          </div>
        </div>

        <div className="text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
              {author?.penName || author?.name || "Plume Anonyme"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-teal-600 font-black text-[10px] uppercase tracking-[0.4em]">
              <ShieldCheck size={14} /> Membre Certifié Lisible
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3">
              <BookOpen size={16} className="text-teal-400" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {texts.length} Textes
              </span>
            </div>
            
            <div className="bg-slate-50 px-6 py-3 rounded-2xl flex items-center gap-3 border border-slate-100">
              <TrendingUp size={16} className="text-slate-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                {author?.subscribers?.length || 0} Lecteurs
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* LISTE DES PUBLICATIONS */}
      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400 italic shrink-0">Collection Publique</h2>
          <div className="h-px bg-slate-100 w-full" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {texts.length > 0 ? (
            texts.map((txt) => (
              <Link 
                href={`/texts/${txt.id}`} 
                key={txt.id} 
                className="group flex flex-col md:flex-row items-start md:items-center justify-between p-10 bg-white rounded-[3rem] border border-slate-100 hover:border-teal-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black bg-teal-50 text-teal-600 px-3 py-1 rounded-full uppercase tracking-widest">
                      {txt.category || "Littérature"}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tight leading-none">
                    {txt.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Publié le {new Date(txt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-10 mt-8 md:mt-0">
                  <div className="flex flex-col items-center gap-1">
                    <Eye size={20} className="text-slate-200 group-hover:text-teal-500 transition-colors" />
                    <span className="font-black text-[11px] text-slate-900">{txt.views || 0}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Heart size={20} className="text-slate-200 group-hover:text-rose-500 transition-colors" />
                    <span className="font-black text-[11px] text-slate-900">{txt.likes?.length || 0}</span>
                  </div>
                  <div className="p-5 bg-slate-50 text-slate-900 rounded-[1.5rem] group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                    <ArrowLeft size={22} className="rotate-180" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Aucun manuscrit publié pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeft, BookOpen, Eye, Heart, 
  User, Loader2, Sparkles, TrendingUp 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AuthorCataloguePage() {
  const router = useRouter();
  const { email } = router.query; // Récupération via le router de pages/

  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuthorData = useCallback(async (targetEmail) => {
    try {
      // 1. Récupérer les infos de l'auteur
      const userRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${targetEmail}.json?t=${Date.now()}`);
      
      if (userRes.ok) {
        const userData = await userRes.json();
        // Décodage sécurisé Base64 pour les fichiers GitHub
        const decodedUser = JSON.parse(decodeURIComponent(escape(atob(userData.content))));
        setAuthor(decodedUser);
      }

      // 2. Récupérer tous les textes et filtrer
      const textsRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      if (!textsRes.ok) throw new Error("Impossible de charger les textes");
      
      const files = await textsRes.json();
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      
      const textPromises = jsonFiles.map(file => fetch(file.download_url).then(r => r.json()));
      const allTexts = await Promise.all(textPromises);
      
      // Filtre : on compare l'email de l'URL avec celui dans le JSON du texte
      const filteredTexts = allTexts.filter(t => 
        t.authorEmail?.toLowerCase() === targetEmail.toLowerCase()
      );
      
      setTexts(filteredTexts.sort((a, b) => new Date(b.date) - new Date(a.date)));

    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement du catalogue");
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
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture des archives...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-700">
      
      {/* HEADER : PROFIL AUTEUR */}
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative shrink-0 mt-8 md:mt-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-slate-50 border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center text-5xl font-black text-teal-600 italic">
            {author?.profilePic ? (
              <img src={author.profilePic} className="w-full h-full object-cover" alt="" />
            ) : (
              author?.penName?.charAt(0) || <User size={40} />
            )}
          </div>
          {texts.length >= 5 && (
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-2.5 rounded-xl shadow-lg border-4 border-white">
              <Sparkles size={18} fill="currentColor" />
            </div>
          )}
        </div>

        <div className="text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic">
              {author?.penName || author?.name || "Plume Anonyme"}
            </h1>
            <p className="text-teal-600 font-black text-[9px] uppercase tracking-[0.4em]">Membre du cercle Lisible</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
              <BookOpen size={14} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{texts.length} Œuvres</span>
            </div>
            <div className="bg-teal-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-teal-100">
              <TrendingUp size={14} className="text-teal-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-700">{author?.subscribers?.length || 0} Abonnés</span>
            </div>
          </div>
        </div>
      </header>

      {/* CATALOGUE */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="h-px bg-slate-100 flex-grow" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Manuscrits disponibles</h2>
          <div className="h-px bg-slate-100 flex-grow" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {texts.length > 0 ? texts.map((txt) => (
            <Link 
              href={`/texts/${txt.id}`} 
              key={txt.id} 
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:border-teal-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tight leading-none">
                  {txt.title}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Paru le {new Date(txt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-6 mt-6 md:mt-0">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Eye size={16} className="text-slate-300" />
                  <span className="font-black text-xs text-slate-500">{txt.views || 0}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Heart size={16} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                  <span className="font-black text-xs text-slate-500">{txt.likes?.length || 0}</span>
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:bg-teal-600 transition-all shadow-lg">
                  <BookOpen size={20} />
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">Cette plume n'a pas encore publié d'œuvre.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-10">
        <p className="text-[9px] font-black text-slate-200 uppercase tracking-[0.6em]">Lisible • Catalogue Officiel</p>
      </footer>
    </div>
  );
}

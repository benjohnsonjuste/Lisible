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

  const fetchAuthorData = useCallback(async (targetEmail) => {
    try {
      // Nettoyage de l'email pour correspondre exactement au nom du fichier GitHub
      const cleanEmail = decodeURIComponent(targetEmail).toLowerCase().trim();
      const timestamp = Date.now(); 

      // 1. RÉCUPÉRATION DU PROFIL DEPUIS /data/users/[email].json
      const userRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${cleanEmail}.json?t=${timestamp}`);
      
      if (userRes.ok) {
        const userData = await userRes.json();
        // Décodage UTF-8 robuste (Base64 -> String -> JSON)
        const content = atob(userData.content);
        const decodedUser = JSON.parse(decodeURIComponent(escape(content)));
        setAuthor(decodedUser);
      }

      // 2. RÉCUPÉRATION ET FILTRAGE DES PUBLICATIONS
      const textsRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${timestamp}`);
      if (!textsRes.ok) throw new Error("Erreur base de données");
      
      const files = await textsRes.json();
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      
      const textPromises = jsonFiles.map(file => fetch(`${file.download_url}?t=${timestamp}`).then(r => r.json()));
      const allTexts = await Promise.all(textPromises);
      
      // Filtrage strict par email
      const filteredTexts = allTexts.filter(t => 
        t.authorEmail?.toLowerCase().trim() === cleanEmail
      );
      
      setTexts(filteredTexts.sort((a, b) => new Date(b.date) - new Date(a.date)));

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
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Mise à jour du catalogue...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-700">
      
      {/* HEADER : PROFIL RÉCUPÉRÉ DU FICHIER JSON */}
      <header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative shrink-0 mt-8 md:mt-0">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-[3rem] bg-slate-50 border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center text-5xl font-black text-teal-600 italic">
            {author?.profilePic ? (
              <img src={author.profilePic} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="uppercase">{author?.penName?.charAt(0) || <User size={40} />}</span>
            )}
          </div>
          {texts.length >= 7 && (
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-3 rounded-2xl shadow-xl border-4 border-white animate-pulse">
              <Sparkles size={20} fill="currentColor" />
            </div>
          )}
        </div>

        <div className="text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic">
              {author?.penName || author?.name || "Plume de Lisible"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-teal-600 font-black text-[10px] uppercase tracking-[0.4em]">
              <ShieldCheck size={14} /> Membre Officiel
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center gap-2 border border-slate-100">
              <BookOpen size={16} className="text-slate-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                {texts.length} {texts.length > 1 ? 'Manuscrits' : 'Manuscrit'}
              </span>
            </div>
            
            {/* COMPTEUR D'ABONNÉS SÉCURISÉ */}
            <div className="bg-teal-50 px-5 py-3 rounded-2xl flex items-center gap-2 border border-teal-100">
              <TrendingUp size={16} className="text-teal-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-teal-700">
                {Array.isArray(author?.subscribers) ? author.subscribers.length : 0} Abonnés
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* LISTE DES MANUSCRITS */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="h-px bg-slate-100 flex-grow" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Bibliothèque Privée</h2>
          <div className="h-px bg-slate-100 flex-grow" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {texts.length > 0 ? texts.map((txt) => (
            <Link 
              href={`/texts/${txt.id}`} 
              key={txt.id} 
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:border-teal-200 hover:shadow-2xl transition-all duration-400"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic tracking-tight leading-none">
                  {txt.title}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Publié le {new Date(txt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-8 mt-6 md:mt-0">
                <div className="flex flex-col items-center">
                  <Eye size={18} className="text-slate-300" />
                  <span className="font-black text-[10px] text-slate-600 mt-1">{txt.views || 0}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Heart size={18} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                  <span className="font-black text-[10px] text-slate-600 mt-1">{txt.likes?.length || 0}</span>
                </div>
                <div className="ml-4 p-4 bg-slate-900 text-white rounded-2xl group-hover:bg-teal-600 transition-all shadow-lg">
                  <BookOpen size={20} />
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">Aucun manuscrit archivé.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-10 opacity-30 italic">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.6em]">Lisible • Registre Synchronisé</p>
      </footer>
    </div>
  );
}

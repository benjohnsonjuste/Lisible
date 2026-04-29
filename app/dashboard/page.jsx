"use client";
import React, { useEffect, useState } from 'react';
import { 
  Loader2, Sparkles, Plus, FileText, Trash2, Edit3, ExternalLink,
  ShieldCheck, Bookmark, Heart, Swords, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorStats, setAuthorStats] = useState({ 
    totalViews: 0, 
    totalLikes: 0, 
    totalCertified: 0,
    textCount: 0 
  });

  useEffect(() => {
    async function loadStudio() {
      try {
        const loggedUser = localStorage.getItem("lisible_user");
        if (!loggedUser) return router.replace("/login");

        const parsedUser = JSON.parse(loggedUser);
        const email = parsedUser.email.toLowerCase().trim();
        
        // Récupération des favoris (bookmarks) enregistrés localement
        const savedBookmarks = localStorage.getItem("lisible_bookmarks");
        if (savedBookmarks) {
          try { setBookmarks(JSON.parse(savedBookmarks)); } catch(e) {}
        }
        
        const [userRes, statsRes, libraryRes] = await Promise.all([
          fetch(`/api/realtime-data?folder=users`),
          fetch(`/api/stats/author?email=${encodeURIComponent(email)}`),
          fetch(`/api/realtime-data?folder=publications`)
        ]);

        const userData = await userRes.json();
        const statsData = await statsRes.json();
        const libraryData = await libraryRes.json();

        const currentUserFile = userData.content?.find(u => u.email?.toLowerCase().trim() === email);
        if (currentUserFile) {
          setUser(currentUserFile);
          localStorage.setItem("lisible_user", JSON.stringify(currentUserFile));
        } else {
          setUser(parsedUser);
        }

        if (statsData.success) {
          setAuthorStats(statsData.stats);
        }

        const allPubs = Array.isArray(libraryData.content[0]) ? libraryData.content[0] : (libraryData.content || []);
        if (Array.isArray(allPubs)) {
          const authorWorks = allPubs
            .filter(w => w.authorEmail?.toLowerCase().trim() === email)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setWorks(authorWorks);
        }

      } catch (e) {
        console.error(e);
        toast.error("Erreur de synchronisation du Studio.");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, [router]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous supprimer définitivement "${title}" ?`)) return;
    const tId = toast.loading("Suppression en cours...");
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_text', textId: id })
      });
      if (res.ok) {
        setWorks(works.filter(w => w.id !== id));
        toast.success("Manuscrit supprimé.", { id: tId });
      } else {
        throw new Error();
      }
    } catch (e) { 
      toast.error("Échec de la suppression.", { id: tId }); 
    }
  };

  const removeBookmark = (id) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("lisible_bookmarks", JSON.stringify(updated));
    toast.success("Retiré de vos préférés.");
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accès au Studio...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pt-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Tableau de bord auteur</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>
          <Link href="/publish" className="flex items-center gap-3 bg-teal-600 text-white px-8 py-4 rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 font-bold italic">
            <Plus size={20} /> Nouveau Texte
          </Link>
        </header>

        {/* Section Duel des Nouvelles */}
        <Link href="/novel/publier" className="block group">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.01]">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Swords size={32} className="text-slate-900" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic text-white tracking-tight">Duel Des Nouvelles</h3>
                  <p className="text-slate-400 text-sm font-medium">Relevez le défi, publiez votre nouvelle et scellez votre destin.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 text-white font-black text-[10px] uppercase tracking-widest group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">
                Participer au concours <ArrowRight size={14} />
              </div>
            </div>
            <Swords className="absolute -right-8 -bottom-8 text-white/5 rotate-12" size={200} />
          </div>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bourse Li</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black italic text-slate-900">{user.li || 0}</h2>
              <span className="text-teal-600 font-bold mb-1 uppercase text-xs">Li</span>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-2">Mes Préférés</p>
              <div className="flex items-center gap-3 text-white">
                <Bookmark size={20} className="text-teal-400" />
                <h2 className="text-3xl font-black italic">{bookmarks.length} Enregistrés</h2>
              </div>
            </div>
            <Bookmark className="absolute -right-4 -bottom-4 text-white/5 rotate-12 group-hover:scale-110 transition-transform" size={120} />
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Mes Manuscrits.</h2>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-4 py-2 rounded-full">
              {works.length} Publications
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {works.length > 0 ? works.map((work) => (
              <div key={work.id} className="group bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-teal-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                    <FileText size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{work.title}</h3>
                      {Number(work.certified) > 0 && <ShieldCheck size={16} className="text-teal-500" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="text-teal-600 italic">Sceaux : {work.certified || 0}</span>
                      <span>•</span>
                      <span>{work.views || 0} Vues</span>
                      <span>•</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{work.category || "Général"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/texts/${work.id}`} target="_blank" className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all" title="Voir l'œuvre">
                    <ExternalLink size={18} />
                  </Link>
                  <Link href={`/edit/${work.id}`} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all" title="Modifier">
                    <Edit3 size={18} />
                  </Link>
                  <button onClick={() => handleDelete(work.id, work.title)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all" title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Aucun manuscrit publié pour le moment.</p>
                <Link href="/publish" className="mt-4 inline-block text-[10px] font-black uppercase text-teal-600 underline underline-offset-4">Commencer l'écriture</Link>
              </div>
            )}
          </div>
        </section>

        {/* Section Mes Préférés */}
        <section className="space-y-6 pt-12">
          <div className="flex items-center gap-3 px-2">
            <Heart className="text-rose-500 fill-rose-500" size={20} />
            <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Mes Préférés.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.length > 0 ? bookmarks.map((fav) => (
              <div key={fav.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <Bookmark size={18} />
                  </div>
                  <div className="max-w-[200px]">
                    <h4 className="font-bold text-slate-900 truncate">{fav.title}</h4>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest truncate">Par {fav.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/texts/${fav.id}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                    <ExternalLink size={16} />
                  </Link>
                  <button onClick={() => removeBookmark(fav.id)} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="md:col-span-2 py-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic text-sm">Votre bibliothèque de coups de cœur est vide.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

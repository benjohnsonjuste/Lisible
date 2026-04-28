"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  Coins, BookOpen, TrendingUp, Settings as SettingsIcon, 
  Loader2, Sparkles, Plus, User, FileText, Trash2, Edit3, ExternalLink,
  ShieldCheck, AlertCircle, Download, Award, Link as LinkIcon, Share2, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({ totalViews: 0, totalLikes: 0 });
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadStudio() {
      try {
        const loggedUser = localStorage.getItem("lisible_user");
        if (!loggedUser) return router.replace("/login");

        const parsedUser = JSON.parse(loggedUser);
        const email = parsedUser.email.toLowerCase().trim();
        
        // 1. Récupération Profil (data/users)
        const userRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData?.content) {
            setUser(userData.content);
            localStorage.setItem("lisible_user", JSON.stringify(userData.content));
          }
        }

        // 2. Récupération Bibliothèque & Stats (data/publications)
        const libraryRes = await fetch(`/api/github-db?type=library`);
        if (libraryRes.ok) {
          const libraryData = await libraryRes.json();
          if (libraryData?.content) {
            // Filtrage des textes de l'auteur dans data/texts via les métadonnées de la bibliothèque
            const authorWorks = libraryData.content
              .filter(w => w.authorEmail?.toLowerCase().trim() === email)
              .sort((a, b) => (b.certified || 0) - (a.certified || 0));

            setWorks(authorWorks);
            
            // Calcul des stats réelles cumulées
            const views = authorWorks.reduce((acc, curr) => acc + Number(curr.views || 0), 0);
            const likes = authorWorks.reduce((acc, curr) => acc + Number(curr.likes || 0), 0);
            setGlobalStats({ totalViews: views, totalLikes: likes });
          }
        }
      } catch (e) {
        toast.error("Erreur de synchronisation des données.");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, [router]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous supprimer définitivement "${title}" ?`)) return;
    const tId = toast.loading("Suppression du texte...");
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_text', textId: id })
      });
      if (res.ok) {
        setWorks(works.filter(w => w.id !== id));
        toast.success("Manuscrit retiré.", { id: tId });
      }
    } catch (e) { toast.error("Échec de l'opération.", { id: tId }); }
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
        
        {/* Header Dynamique */}
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

        {/* Stats Réelles (data/publications) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bourse Li</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black italic text-slate-900">{user.li || 0}</h2>
              <span className="text-teal-600 font-bold mb-1">Li</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Vues Réelles</p>
            <div className="flex items-center gap-3 text-slate-900">
              <BarChart3 size={20} className="text-blue-500" />
              <h2 className="text-3xl font-black italic">{globalStats.totalViews.toLocaleString()}</h2>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Abonnés</p>
            <div className="flex items-center gap-3 text-slate-900">
              <User size={20} className="text-teal-500" />
              <h2 className="text-3xl font-black italic">{user.followers?.length || 0}</h2>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Certifications</p>
            <div className="flex items-center gap-3 text-slate-900">
              <Award size={20} className="text-amber-500" />
              <h2 className="text-3xl font-black italic">{works.reduce((a,c) => a+(c.certified||0),0)}</h2>
            </div>
          </div>
        </div>

        {/* Liste des Textes (data/texts) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Mes Textes Publiés.</h2>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {works.length} Manuscrits
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
                      <h3 className="text-xl font-bold text-slate-900">{work.title}</h3>
                      {work.certified > 0 && <ShieldCheck size={16} className="text-teal-500" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="text-teal-600 italic">Sceau de Qualité : {work.certified || 0}</span>
                      <span>•</span>
                      <span>{work.views || 0} Lectures</span>
                      <span>•</span>
                      <span>{work.category || "Littérature"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/texts/${work.id}`} target="_blank" className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all" title="Voir en ligne">
                    <ExternalLink size={18} />
                  </Link>
                  {/* MODIFICATION : Redirige vers la page d'édition dédiée */}
                  <Link href={`/edit/${work.id}`} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all" title="Modifier le texte">
                    <Edit3 size={18} />
                  </Link>
                  <button onClick={() => handleDelete(work.id, work.title)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all" title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Votre plume attend son premier texte...</p>
                <Link href="/publish" className="mt-4 inline-block text-[10px] font-black uppercase text-teal-600 underline">Commencer ici</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

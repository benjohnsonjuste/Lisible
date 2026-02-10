"use client";
import React, { useEffect, useState } from 'react';
import { 
  Coins, BookOpen, TrendingUp, Settings as SettingsIcon, 
  Loader2, Sparkles, Plus, User, FileText, Trash2, Edit3, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudio() {
      try {
        const loggedUser = localStorage.getItem("lisible_user");
        if (!loggedUser) {
          window.location.href = "/login";
          return;
        }
        
        const { email } = JSON.parse(loggedUser);

        // 1. Charger Profil
        const userRes = await fetch(`/api/github-db?type=user&id=${email}`);
        const userData = await userRes.json();
        
        if (userData && userData.content) {
          setUser(userData.content);
          localStorage.setItem("lisible_user", JSON.stringify(userData.content));
        }

        // 2. Charger les œuvres de l'auteur depuis l'index
        const libraryRes = await fetch(`/api/github-db?type=library`);
        const libraryData = await libraryRes.json();
        if (libraryData && libraryData.content) {
          const authorWorks = libraryData.content.filter(w => 
            w.authorEmail?.toLowerCase() === email.toLowerCase()
          );
          setWorks(authorWorks);
        }

      } catch (e) {
        toast.error("Erreur de synchronisation avec le registre");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous vraiment retirer "${title}" des archives ?`)) return;
    
    toast.loading("Retrait du manuscrit...");
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_text', textId: id })
      });
      if (res.ok) {
        setWorks(works.filter(w => w.id !== id));
        toast.success("Manuscrit effacé des registres.");
      }
    } catch (e) {
      toast.error("Erreur lors de la suppression.");
    } finally {
      toast.dismiss();
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du Studio...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Espace Créatif</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>
          <Link href="/settings" className="p-4 bg-white rounded-[1.5rem] shadow-sm hover:text-teal-600 transition-all border border-slate-100">
            <SettingsIcon size={20} />
          </Link>
        </header>

        {/* --- SECTION QUICK ACTIONS --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/publish" className="group flex items-center justify-between p-8 bg-teal-600 text-white rounded-[2.5rem] shadow-xl shadow-teal-900/10 hover:bg-teal-700 transition-all">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Création</p>
              <h3 className="text-xl font-bold italic">Publier un texte</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
          </Link>

          <Link href="/account" className="group flex items-center justify-between p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl shadow-slate-900/10 hover:bg-black transition-all">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Profil</p>
              <h3 className="text-xl font-bold italic">Gérer mon compte</h3>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <User size={22} />
            </div>
          </Link>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <Coins className="absolute -right-4 -bottom-4 text-slate-50" size={120} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Bourse Li</p>
            <h2 className="text-5xl font-black italic tracking-tighter text-slate-900">
              {user.li || 0} <span className="text-teal-600 text-xl not-italic ml-1">Li</span>
            </h2>
            <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-tighter">Val. estimée: {(user.li * 0.0002).toFixed(2)} USD</p>
          </div>
          
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6"><BookOpen size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Abonnés</p>
              <h2 className="text-4xl font-black italic text-slate-900">{user.followers?.length || 0}</h2>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Influences</p>
              <h2 className="text-4xl font-black italic text-slate-900">{user.following?.length || 0}</h2>
            </div>
          </div>
        </div>

        {/* --- GESTION DES TEXTES --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Mes Manuscrits.</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{works.length} Œuvres</span>
          </div>

          {works.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {works.map((work) => (
                <div key={work.id} className="group bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{work.title}</h3>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{work.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><ExternalLink size={10}/> {new Date(work.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/texts/${work.id}`} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                      <ExternalLink size={18} />
                    </Link>
                    <Link href={`/edit/${work.id}`} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all">
                      <Edit3 size={18} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(work.id, work.title)}
                      className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">Aucun manuscrit n'a encore été scellé...</p>
              <Link href="/publish" className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-teal-600 underline">Commencer à écrire</Link>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

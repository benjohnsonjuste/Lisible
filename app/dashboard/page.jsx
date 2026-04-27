"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  Coins, TrendingUp, Settings as SettingsIcon, 
  Loader2, Sparkles, Plus, User, AlertCircle, 
  Download, Award, Link as LinkIcon, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Import du composant que nous venons de créer
import MesManuscrits from '@/components/MesManuscrits'; 

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadStudio() {
      try {
        const loggedUser = localStorage.getItem("lisible_user");
        
        if (!loggedUser) {
          router.replace("/login");
          return;
        }

        const parsedUser = JSON.parse(loggedUser);
        const email = parsedUser.email;
        
        // 1. Synchronisation Profil
        const userRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
        if (userRes.ok) {
          const data = await userRes.json();
          if (data?.content) {
            setUser(data.content);
            localStorage.setItem("lisible_user", JSON.stringify(data.content));
          }
        }

        // 2. Récupération des publications
        const libraryRes = await fetch(`/api/github-db?type=library`);
        if (libraryRes.ok) {
          const data = await libraryRes.json();
          if (data.content) {
            const authorWorks = data.content
              .filter(w => w.authorEmail?.toLowerCase().trim() === email.toLowerCase().trim())
              .sort((a, b) => (b.id || 0) - (a.id || 0));
            setWorks(authorWorks);
          }
        }
        
      } catch (e) {
        toast.error("Erreur de synchronisation.");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, [router]);

  // Générateur de Badge (conservé dans la page pour l'accès au canvasRef)
  const generateBadge = (download = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    const ctx = canvas.getContext('2d');
    const name = user.penName || user.name || "Auteur Lisible";
    canvas.width = 600; canvas.height = 600;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 600, 600);
    ctx.strokeStyle = '#14b8a6'; ctx.lineWidth = 20; ctx.strokeRect(10, 10, 580, 580);
    ctx.fillStyle = '#14b8a6'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center';
    ctx.fillText('COMPTE OFFICIEL', 300, 80);
    ctx.fillStyle = '#ffffff'; ctx.font = 'italic bold 45px serif'; ctx.fillText(name, 300, 300);
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 25px Arial'; ctx.fillText('lisible.art', 300, 540);

    if (download) {
      const link = document.createElement('a');
      link.download = `badge-${name}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      toast.success("Badge exporté !");
    }
  };

  const handleProfileShare = async () => {
    const profileUrl = `${window.location.origin}/author/${encodeURIComponent(user.email)}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mon Profil Lisible', url: profileUrl }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success("Lien copié !");
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du Studio...</p>
    </div>
  );

  if (!user) return null;

  const followerCount = user.followers?.length || 0;
  const realLi = user.li || 0;
  const canWithdraw = (realLi >= 25000) && (followerCount >= 250);
  const totalViews = works.reduce((acc, w) => acc + Number(w.views || 0), 0);

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12 pb-32">
      <canvas ref={canvasRef} className="hidden" />
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pt-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Tableau de Bord</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={handleProfileShare} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600 font-black text-[10px] uppercase tracking-widest">
              <LinkIcon size={14} /> Partager Profil
            </button>

            <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg"><Award size={20} /></div>
              <button onClick={() => generateBadge(true)} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-colors"><Download size={16} /></button>
            </div>
          </div>
        </header>

        {!canWithdraw && (
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] flex items-center gap-5 text-amber-800">
            <div className="p-3 bg-amber-100 rounded-2xl"><AlertCircle size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Monétisation</p>
              <p className="text-xs font-bold">Retraits bloqués : 25k Li et 250 abonnés requis.</p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/publish" className="group flex items-center justify-between p-8 bg-teal-600 text-white rounded-[2.5rem] shadow-xl hover:bg-teal-700 transition-all">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Écriture</p><h3 className="text-xl font-bold italic">Nouveau Manuscrit</h3></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-90 transition-transform"><Plus size={24} /></div>
          </Link>
          <Link href="/account" className="group flex items-center justify-between p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl hover:bg-black transition-all">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Configuration</p><h3 className="text-xl font-bold italic">Mon Compte</h3></div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><SettingsIcon size={22} /></div>
          </Link>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <Coins className="absolute -right-4 -bottom-4 text-slate-50 opacity-50" size={140} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Coffre Li</p>
            <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 relative z-10">{realLi.toLocaleString()} <span className="text-teal-600 text-xl not-italic">Li</span></h2>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6"><BarChart3 size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Impact Global</p>
              <h2 className="text-4xl font-black italic text-slate-900">{totalViews.toLocaleString()} <span className="text-sm not-italic text-slate-300">vues</span></h2>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Audience</p>
              <h2 className="text-4xl font-black italic text-slate-900">{followerCount} <span className="text-sm not-italic text-slate-300">abonnés</span></h2>
            </div>
          </div>
        </div>

        {/* APPEL DU COMPOSANT MES MANUSCRITS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Mes Œuvres.</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{works.length} Manuscrit(s)</span>
          </div>

          <MesManuscrits works={works} setWorks={setWorks} />
          
        </section>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  Loader2, Sparkles, Plus, Settings as SettingsIcon, 
  Download, Award, Link as LinkIcon, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Import de vos nouveaux composants
import StatistiquesPersonnelles from '@/components/StatistiquesPersonnelles';
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
        
        // On utilise votre nouvelle API agrégée pour tout récupérer d'un coup
        const res = await fetch(`/api/user-stats?email=${encodeURIComponent(email)}`);
        
        if (res.ok) {
          const data = await res.json();
          // L'API renvoie { profile: {...}, works: [...], publications: {...} }
          setUser(data.profile);
          setWorks(data.works);
          
          // Mise à jour discrète du localStorage avec le dernier solde Li
          localStorage.setItem("lisible_user", JSON.stringify({
            ...parsedUser,
            li: data.profile.liBalance
          }));
        } else {
          throw new Error("Erreur de récupération");
        }
      } catch (e) {
        console.error("Sync error:", e);
        toast.error("Échec de la synchronisation du Studio.");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, [router]);

  const generateBadge = (download = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    const ctx = canvas.getContext('2d');
    const name = user.name || "Auteur Lisible";
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
      toast.success("Badge enregistré !");
    }
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
      <canvas ref={canvasRef} className="hidden" />
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pt-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Tableau de Bord</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600 font-black text-[10px] uppercase tracking-widest">
              <LinkIcon size={14} /> Partager Profil
            </button>

            <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg">
                <Award size={20} />
              </div>
              <button onClick={() => generateBadge(true)} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-colors">
                <Download size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Actions Rapides */}
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

        {/* ANALYTIQUES : Utilisation du nouveau composant */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <BarChart3 size={18} className="text-slate-900" />
            <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Analyses Globales.</h2>
          </div>
          <StatistiquesPersonnelles user={user} works={works} />
        </section>

        {/* LISTE DES ŒUVRES : Utilisation du composant MesManuscrits */}
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

"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  Coins, BookOpen, TrendingUp, Settings as SettingsIcon, 
  Loader2, Sparkles, Plus, User, FileText, Trash2, Edit3, ExternalLink,
  ShieldCheck, AlertCircle, Share2, Download, Award, Link as LinkIcon,
  ChevronRight, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
        
        // 1. Synchronisation Profil (data/users)
        const userRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
        let currentUserData = null;

        if (userRes.ok) {
          const data = await userRes.json();
          if (data && data.content) {
            currentUserData = data.content;
            setUser(currentUserData);
            localStorage.setItem("lisible_user", JSON.stringify(currentUserData));
          }
        }

        // 2. Récupération des publications (data/publications)
        const libraryRes = await fetch(`/api/github-db?type=library`);
        let allWorks = [];

        if (libraryRes.ok) {
          const data = await libraryRes.json();
          if (data.content) allWorks = data.content;
        }

        // 3. Filtrage et calcul des statistiques réelles
        const authorWorks = allWorks
          .filter(w => w.authorEmail?.toLowerCase().trim() === email.toLowerCase().trim())
          .sort((a, b) => (b.id || 0) - (a.id || 0));

        setWorks(authorWorks);
        
      } catch (e) {
        console.error("Sync error:", e);
        toast.error("Échec de la synchronisation des données.");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, [router]);

  // Générateur de Badge Officiel
  const generateBadge = (download = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    const ctx = canvas.getContext('2d');
    const name = user.penName || user.name || "Auteur Lisible";

    canvas.width = 600;
    canvas.height = 600;

    // Fond
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bordure
    ctx.strokeStyle = '#14b8a6'; 
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#14b8a6';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COMPTE OFFICIEL', canvas.width / 2, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 45px serif';
    ctx.fillText(name, canvas.width / 2, 300);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 25px Arial';
    ctx.fillText('lisible.art', canvas.width / 2, 540);

    if (download) {
      const link = document.createElement('a');
      link.download = `badge-officiel-${name}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      toast.success("Badge enregistré !");
    }
  };

  const handleProfileShare = async () => {
    const profileUrl = `${window.location.origin}/author/${encodeURIComponent(user.email)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Profil de ${user.penName || user.name}`,
          text: `Découvrez mes œuvres sur Lisible !`,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Lien copié !");
      }
    } catch (err) { /* Annulé */ }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous supprimer définitivement "${title}" ?`)) return;
    const t = toast.loading("Suppression...");
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_text', textId: id })
      });
      if (res.ok) {
        setWorks(works.filter(w => w.id !== id));
        toast.success("Archive supprimée.", { id: t });
      }
    } catch (e) { toast.error("Erreur.", { id: t }); }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accès au Studio...</p>
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
            <button 
              onClick={handleProfileShare}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600 font-black text-[10px] uppercase tracking-widest"
            >
              <LinkIcon size={14} /> Partager Profil
            </button>

            <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg">
                <Award size={20} />
              </div>
              <div className="pr-4 hidden sm:block">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Statut</p>
                <p className="text-[11px] font-bold text-slate-900">Certifié</p>
              </div>
              <button onClick={() => generateBadge(true)} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-colors">
                <Download size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Alerte Monétisation */}
        {!canWithdraw && (
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] flex items-center gap-5 text-amber-800 shadow-sm">
            <div className="p-3 bg-amber-100 rounded-2xl"><AlertCircle size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Monétisation en attente</p>
              <p className="text-xs font-bold">Il vous faut 25 000 Li et 250 abonnés pour débloquer les retraits. Continuez à écrire !</p>
            </div>
          </div>
        )}

        {/* Actions Rapides */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/publish" className="group flex items-center justify-between p-8 bg-teal-600 text-white rounded-[2.5rem] shadow-xl shadow-teal-900/10 hover:bg-teal-700 transition-all">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Écriture</p><h3 className="text-xl font-bold italic">Nouveau Manuscrit</h3></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-90 transition-transform"><Plus size={24} /></div>
          </Link>
          <Link href="/account" className="group flex items-center justify-between p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl shadow-slate-900/10 hover:bg-black transition-all">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Configuration</p><h3 className="text-xl font-bold italic">Mon Compte</h3></div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><SettingsIcon size={22} /></div>
          </Link>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <Coins className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-teal-50 group-hover:rotate-12 transition-all" size={140} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Coffre Li</p>
            <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 relative z-10">
              {realLi.toLocaleString()} <span className="text-teal-600 text-xl not-italic">Li</span>
            </h2>
            <div className="flex items-center gap-2 mt-4 relative z-10">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Équivalent: {(realLi * 0.0002).toFixed(2)} USD</p>
               {canWithdraw && <ShieldCheck size={14} className="text-teal-500" />}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-teal-100 transition-colors">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6"><BarChart3 size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Impact Global</p>
              <h2 className="text-4xl font-black italic text-slate-900">{totalViews.toLocaleString()} <span className="text-sm not-italic text-slate-300">vues</span></h2>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-amber-100 transition-colors">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Audience</p>
              <h2 className="text-4xl font-black italic text-slate-900">{followerCount} <span className="text-sm not-italic text-slate-300">abonnés</span></h2>
            </div>
          </div>
        </div>

        {/* Liste des œuvres */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Mes Œuvres.</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{works.length} Manuscrit(s)</span>
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{work.title}</h3>
                        {(work.certified > 0) && <ShieldCheck size={16} className="text-teal-500" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="bg-slate-50 px-2 py-1 rounded-lg">{work.category || "Littérature"}</span>
                        <div className="flex items-center gap-1.5"><BookOpen size={12}/> {work.views || 0} vues</div>
                        <div className="text-teal-600 italic">{work.certified || 0} Sceaux</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/texts/${work.id}`} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-950 hover:text-white transition-all"><ExternalLink size={18} /></Link>
                    <Link href={`/edit/${work.id}`} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all"><Edit3 size={18} /></Link>
                    <button onClick={() => handleDelete(work.id, work.title)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <BookOpen size={32} />
              </div>
              <p className="text-slate-400 font-medium italic mb-4">Aucune œuvre n'est encore enregistrée.</p>
              <Link href="/publish" className="text-[10px] font-black uppercase tracking-widest bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-all">Lancer une publication</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

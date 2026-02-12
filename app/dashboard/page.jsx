"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  Coins, BookOpen, TrendingUp, Settings as SettingsIcon, 
  Loader2, Sparkles, Plus, User, FileText, Trash2, Edit3, ExternalLink,
  ShieldCheck, AlertCircle, Share2, Download, Award
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadStudio() {
      try {
        const loggedUser = localStorage.getItem("lisible_user");
        if (!loggedUser) {
          window.location.replace("/login");
          return;
        }
        const { email } = JSON.parse(loggedUser);
        
        // Synchro profil
        const userRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
        const userData = await userRes.json();
        if (userData && userData.content) {
          setUser(userData.content);
          localStorage.setItem("lisible_user", JSON.stringify(userData.content));
        }

        // Synchro œuvres avec Tri Universel (Certifications > Likes > Date)
        const libraryRes = await fetch(`/api/github-db?type=library`);
        const libraryData = await libraryRes.json();
        if (libraryData && libraryData.content) {
          const authorWorks = libraryData.content
            .filter(w => w.authorEmail?.toLowerCase() === email.toLowerCase())
            .sort((a, b) => {
              const certA = Number(a.certified || a.totalCertified || 0);
              const certB = Number(b.certified || b.totalCertified || 0);
              if (certB !== certA) return certB - certA;

              const likesA = Number(a.likes || a.totalLikes || 0);
              const likesB = Number(b.likes || b.totalLikes || 0);
              if (likesB !== likesA) return likesB - likesA;

              return new Date(b.date) - new Date(a.date);
            });
          setWorks(authorWorks);
        }
      } catch (e) {
        toast.error("Erreur de synchronisation.");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, []);

  // Générateur de Badge JPG via Canvas
  const generateBadge = (download = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    const ctx = canvas.getContext('2d');
    const name = user.penName || user.name || "Auteur.e Lisible";

    canvas.width = 600;
    canvas.height = 600;

    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#14b8a6'; 
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#14b8a6';
    ctx.font = 'black 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COMPTE OFFICIEL', canvas.width / 2, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 50px serif';
    const words = name.split(' ');
    let line = '';
    let y = 280;
    const maxWidth = 500;
    const lineHeight = 60;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 25px Arial';
    ctx.fillText('lisible.biz', canvas.width / 2, 540);

    if (download) {
      const link = document.createElement('a');
      link.download = `badge-officiel-${name}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      toast.success("Badge téléchargé !");
    }
  };

  const handleUniversalShare = async () => {
    generateBadge();
    const canvas = canvasRef.current;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    const file = new File([blob], 'badge-officiel.jpg', { type: 'image/jpeg' });
    const shareData = {
      title: 'Compte Officiel Lisible',
      text: "J'ai un Compte Officiel sur Lisible. Visitez-moi sur lisible.biz",
      files: [file],
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        toast.error("Partage annulé");
      }
    } else {
      const shareUrl = `https://twitter.com/intent/tweet?text=J'ai un Compte Officiel sur Lisible. Visitez-moi sur lisible.biz`;
      window.open(shareUrl, '_blank');
      toast.info("Lien de partage généré !");
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous vraiment retirer "${title}" des archives ?`)) return;
    const toastId = toast.loading("Retrait...");
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_text', textId: id })
      });
      if (res.ok) {
        setWorks(works.filter(w => w.id !== id));
        toast.success("Effacé.", { id: toastId });
      }
    } catch (e) { toast.error("Erreur.", { id: toastId }); }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du Studio...</p>
    </div>
  );

  if (!user) return null;
  const canWithdraw = (user.li >= 25000) && (user.followers?.length >= 250);

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12 pb-32">
      <canvas ref={canvasRef} className="hidden" />
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pt-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Espace Créatif</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>

          <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Award size={20} />
            </div>
            <div className="pr-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Badge</p>
              <p className="text-[11px] font-bold text-slate-900">Compte Officiel</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleUniversalShare} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-colors" title="Partager mon badge"><Share2 size={16} /></button>
              <button onClick={() => generateBadge(true)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors" title="Télécharger"><Download size={16} /></button>
            </div>
          </div>
        </header>

        {!canWithdraw && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-center gap-4 text-amber-800">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-[11px] font-bold uppercase tracking-tight">
              Monétisation inactive : 25 000 Li et 250 abonnés requis. 
              ({user.li || 0}/25000 Li • {user.followers?.length || 0}/250 abonnés)
            </p>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/publish" className="group flex items-center justify-between p-8 bg-teal-600 text-white rounded-[2.5rem] shadow-xl shadow-teal-900/10 hover:bg-teal-700 transition-all">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Création</p><h3 className="text-xl font-bold italic">Publier un texte</h3></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={24} /></div>
          </Link>
          <Link href="/settings" className="group flex items-center justify-between p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl shadow-slate-900/10 hover:bg-black transition-all">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Profil</p><h3 className="text-xl font-bold italic">Gérer mon compte</h3></div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><User size={22} /></div>
          </Link>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <Coins className="absolute -right-4 -bottom-4 text-slate-50" size={120} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Bourse Li</p>
            <h2 className="text-5xl font-black italic tracking-tighter text-slate-900">
              {user.li || 0} <span className="text-teal-600 text-xl not-italic ml-1">Li</span>
            </h2>
            <div className="flex items-center gap-2 mt-2">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Val. estimée: {(user.li * 0.0002).toFixed(2)} USD</p>
               {canWithdraw && <ShieldCheck size={12} className="text-teal-500" />}
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6"><BookOpen size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Abonnés</p><h2 className="text-4xl font-black italic text-slate-900">{user.followers?.length || 0}</h2></div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6"><TrendingUp size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Suivis</p><h2 className="text-4xl font-black italic text-slate-900">{user.following?.length || 0}</h2></div>
          </div>
        </div>

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
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors"><FileText size={28} /></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{work.title}</h3>
                        {(work.certified > 0 || work.totalCertified > 0) && <ShieldCheck size={16} className="text-teal-500" />}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{work.category}</span>
                        <span>•</span>
                        <span className="text-teal-600">{work.certified || work.totalCertified || 0} Sceaux</span>
                        <span>•</span>
                        <span>{new Date(work.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/texts/${work.id}`} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors"><ExternalLink size={18} /></Link>
                    <Link href={`/edit/${work.id}`} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all"><Edit3 size={18} /></Link>
                    <button onClick={() => handleDelete(work.id, work.title)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">Aucun manuscrit n'a encore été publié...</p>
              <Link href="/publish" className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-teal-600 underline">Commencer à écrire</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

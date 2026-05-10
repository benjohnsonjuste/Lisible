"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  Loader2, Sparkles, Plus, FileText, Trash2, Edit3, ExternalLink,
  ShieldCheck, Swords, ArrowRight, Award, Share2, Download, Link as LinkIcon, Settings as SettingsIcon,
  ShoppingBag, Gift, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import CadeauLi from '@/components/CadeauLi'; // Import du composant cadeau

export default function AuthorDashboard() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false); // État pour la modale cadeau
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
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COMPTE OFFICIEL', canvas.width / 2, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 45px serif';
    
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

  const handleProfileShare = async () => {
    const profileUrl = `${window.location.origin}/author/${encodeURIComponent(user.email)}`;
    const shareData = {
      title: `Profil de ${user.penName || user.name} | Lisible`,
      text: `Découvrez mes œuvres et suivez ma plume sur Lisible !`,
      url: profileUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Lien du profil copié !");
      }
    } catch (err) {
      console.log("Erreur de partage");
    }
  };

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
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pt-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Tableau de bord auteur</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={handleProfileShare}
              className="flex items-center gap-2 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600 font-bold italic text-sm"
            >
              <LinkIcon size={18} className="text-teal-600" /> Partager mon Profil
            </button>

            <Link href="/publish" className="flex items-center gap-3 bg-teal-600 text-white px-8 py-4 rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 font-bold italic">
              <Plus size={20} /> Nouveau Texte
            </Link>
          </div>
        </header>

        <Link href="/settings" className="group flex items-center justify-between p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl shadow-slate-900/10 hover:bg-black transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Configuration</p>
            <h3 className="text-xl font-bold italic">Paramètres du compte</h3>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <SettingsIcon size={22} />
          </div>
        </Link>

        {/* SECTION FINANCES ET CADEAUX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bourse Li</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black italic text-slate-900">{user.li || 0}</h2>
              <span className="text-teal-600 font-bold mb-1 uppercase text-xs">Li</span>
            </div>
          </div>

          {/* Section Magasin Li */}
          <Link href="/shop" className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                <ShoppingBag size={24} />
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-amber-600 transition-all" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Services</p>
            <h3 className="text-xl font-bold italic text-slate-900">Magasin Li</h3>
          </Link>

          {/* Section Envoyer des Cadeaux */}
          <button 
            onClick={() => setShowGiftModal(true)}
            className="group bg-white p-8 text-left rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-teal-200 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                <Gift size={24} />
              </div>
              <Plus size={18} className="text-slate-300 group-hover:text-teal-600 transition-all" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Générosité</p>
            <h3 className="text-xl font-bold italic text-slate-900">Envoyer des cadeaux</h3>
          </button>
        </div>

        {/* MODALE POUR LE COMPOSANT CADEAULI */}
        {showGiftModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowGiftModal(false)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-teal-400 transition-colors"
              >
                <X size={32} />
              </button>
              <CadeauLi />
            </div>
          </div>
        )}

        <div className="block cursor-not-allowed opacity-40 grayscale">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden transition-all">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Swords size={32} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic text-white tracking-tight">Duel Des Nouvelles</h3>
                  <p className="text-slate-400 text-sm font-medium">Prochainement disponible.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-6 py-3 rounded-xl border border-white/10 text-white/50 font-black text-[10px] uppercase tracking-widest transition-all">
                Bientôt disponible <ArrowRight size={14} />
              </div>
            </div>
            <Swords className="absolute -right-8 -bottom-8 text-white/5 rotate-12" size={200} />
          </div>
        </div>

        {/* Badge Téléchargeable */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Award size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Badge Officiel</p>
              <p className="text-lg font-bold text-slate-900 italic">Certification Plume</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUniversalShare} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-colors" title="Partager mon badge">
              <Share2 size={20} />
            </button>
            <button onClick={() => generateBadge(true)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors" title="Télécharger">
              <Download size={20} />
            </button>
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
                      {(Number(work.certified) > 0 || Number(work.totalCertified) > 0) && <ShieldCheck size={16} className="text-teal-500" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="text-teal-600 italic">Sceaux : {work.certified || work.totalCertified || 0}</span>
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
      </div>
    </div>
  );
}

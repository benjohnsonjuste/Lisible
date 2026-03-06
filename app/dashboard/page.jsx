"use client";
import React, { useEffect, useState, useRef } from 'react';
import { 
  Coins, BookOpen, TrendingUp, Settings as SettingsIcon, 
  Loader2, Sparkles, Plus, User, FileText, Trash2, Edit3, ExternalLink,
  ShieldCheck, AlertCircle, Award, Link as LinkIcon, Sword, Bell, Bookmark, BookmarkX, 
  Radio, DoorOpen
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [activePodcastInvite, setActivePodcastInvite] = useState(null);

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
        
        const userRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData && userData.content) {
            setUser(userData.content);
            localStorage.setItem("lisible_user", JSON.stringify(userData.content));
            
            const notifs = userData.content.notifications || [];
            const unread = notifs.filter(n => !n.read).length;
            setUnreadNotifs(unread);

            // Détection d'une invitation podcast active
            const podcastInvite = notifs.find(n => n.type === 'PODCAST_INVITATION' && !n.read);
            if (podcastInvite) {
              setActivePodcastInvite(podcastInvite);
            }
          }
        }

        const libraryRes = await fetch(`/api/github-db?type=library`);
        if (libraryRes.ok) {
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
        }
      } catch (e) {
        console.error("Sync error:", e);
        toast.error("Erreur de synchronisation.");
      } finally {
        setLoading(false);
      }
    }
    loadStudio();
  }, [router]);

  const handleRemoveBookmark = async (e, textId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: "toggle_bookmark", 
          userEmail: user.email, 
          textId: textId 
        })
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, bookmarks: data.bookmarks };
        setUser(updatedUser);
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        toast.success("Retiré des favoris");
      }
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const handleProfileShare = async () => {
    const profileUrl = `${window.location.origin}/author/${encodeURIComponent(user.email)}`;
    const shareData = { title: `Profil de ${user.penName || user.name} | Lisible`, text: `Découvrez mes œuvres et suivez ma plume sur Lisible !`, url: profileUrl };
    try {
      if (navigator.share) { await navigator.share(shareData); } 
      else { await navigator.clipboard.writeText(profileUrl); toast.success("Lien du profil copié !"); }
    } catch (err) { console.log("Erreur de partage"); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous vraiment retirer "${title}" des archives ?`)) return;
    const toastId = toast.loading("Retrait définitif en cours...");
    try {
      const res = await fetch('/api/github-db', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action: 'delete_text', textId: id }) 
      });
      const data = await res.json();
      if (res.ok && data.success) { 
        setWorks(prevWorks => prevWorks.filter(w => w.id !== id)); 
        toast.success("L'œuvre a été supprimée.", { id: toastId }); 
      } else {
        throw new Error(data.error || "Erreur lors de la suppression");
      }
    } catch (e) { 
      toast.error("Échec du retrait.", { id: toastId }); 
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
  const canWithdraw = (user.li >= 25000) && (followerCount >= 250);
  const bookmarks = user.bookmarks || [];

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* BANDEAU LIVE PODCAST SI INVITATION */}
        {activePodcastInvite && (
          <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl shadow-indigo-900/20 animate-in slide-in-from-top duration-700 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-indigo-800">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                <Radio size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Invitation en direct</p>
                <h3 className="text-xl font-bold italic leading-tight">{activePodcastInvite.fromName} vous attend au Studio !</h3>
              </div>
            </div>
            <Link 
              href={activePodcastInvite.link || "#"}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-50 transition-all group"
            >
              <DoorOpen size={18} className="group-hover:translate-x-1 transition-transform" />
              Rejoindre le Live
            </Link>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pt-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Espace Créatif</span>
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Mon Studio.</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/notifications" className="relative p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600 group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#FCFBF9] animate-bounce">
                  {unreadNotifs}
                </span>
              )}
            </Link>
            <button onClick={handleProfileShare} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600 font-black text-[10px] uppercase tracking-widest"><LinkIcon size={14} /> Partager mon Profil</button>
            <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20"><Award size={20} /></div>
              <div className="pr-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Statut</p>
                <p className="text-[11px] font-bold text-slate-900">Compte Officiel</p>
              </div>
            </div>
          </div>
        </header>

        {!canWithdraw && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-center gap-4 text-amber-800">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-[11px] font-bold uppercase tracking-tight">Monétisation inactive : 25 000 Li et 250 abonnés requis. ({user.li || 0}/25000 Li • {followerCount}/250 abonnés)</p>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/publish" className="group flex items-center justify-between p-8 bg-teal-600 text-white rounded-[2.5rem] shadow-xl shadow-teal-900/10 hover:bg-teal-700 transition-all">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Création</p><h3 className="text-xl font-bold italic">Publier un texte</h3></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={24} /></div>
          </Link>
          <Link href="/battle/close" className="group flex items-center justify-between p-8 bg-rose-600 text-white rounded-[2.5rem] shadow-xl shadow-rose-900/10 hover:bg-rose-700 transition-all border-4 border-white/20">
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Événement</p><h3 className="text-xl font-bold italic">Battle Poétique</h3></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform"><Sword size={24} /></div>
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
            <h2 className="text-5xl font-black italic tracking-tighter text-slate-900">{user.li || 0} <span className="text-teal-600 text-xl not-italic ml-1">Li</span></h2>
            <div className="flex items-center gap-2 mt-2">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Val. estimée: {(user.li * 0.0002).toFixed(2)} USD</p>
               {canWithdraw && <ShieldCheck size={12} className="text-teal-500" />}
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6"><BookOpen size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Abonnés</p><h2 className="text-4xl font-black italic text-slate-900">{followerCount}</h2></div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6"><TrendingUp size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Suivis</p><h2 className="text-4xl font-black italic text-slate-900">{user.following?.length || 0}</h2></div>
          </div>
        </div>

        {/* SECTION FAVORIS */}
        <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Bookmark size={20} className="text-teal-600" />
              <h2 className="text-2xl font-black italic tracking-tight text-slate-900">Ma Bibliothèque.</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{bookmarks.length} Enregistrés</span>
          </div>
          
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((fav) => (
                <Link href={`/texts/${fav.id}`} key={fav.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-teal-200 transition-all flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="max-w-[150px]">
                        <h4 className="font-bold text-slate-900 truncate text-sm">{fav.title}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Par {fav.author}</p>
                      </div>
                   </div>
                   <button 
                    onClick={(e) => handleRemoveBookmark(e, fav.id)}
                    className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                   >
                     <BookmarkX size={18} />
                   </button>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <p className="text-slate-400 text-xs font-medium italic">Votre bibliothèque est vide pour le moment.</p>
            </div>
          )}
        </section>

        {/* SECTION MANUSCRITS */}
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
                        <span>{work.date ? new Date(work.date).toLocaleDateString() : 'Date inconnue'}</span>
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

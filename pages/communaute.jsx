"use client";
import React, { useEffect, useState, useCallback } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, 
  ArrowRight, TrendingUp, Crown, Loader2, ShieldCheck, BookOpen,
  Search, SlidersHorizontal
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function UsersPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [monthlyWinner, setMonthlyWinner] = useState(null);
  const [superReader, setSuperReader] = useState(null);

  // Initialisation des données
  useEffect(() => {
    const loadData = async () => {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setCurrentUser(JSON.parse(logged));
      
      await Promise.all([
        loadUsers(),
        loadAwards()
      ]);
    };

    if (router.isReady) {
      loadData();
    }
  }, [router.isReady]);

  // Chargement des trophées (Plume du mois & Super Reader)
  async function loadAwards() {
    const timestamp = Date.now();
    try {
      const [resWinner, resReader] = await Promise.all([
        fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/awards/winner.json?t=${timestamp}`),
        fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/awards/reader.json?t=${timestamp}`)
      ]);
      
      if (resWinner.ok) setMonthlyWinner(await resWinner.json());
      if (resReader.ok) setSuperReader(await resReader.json());
    } catch (e) {
      console.warn("Awards non encore configurés.");
    }
  }

  // Chargement de la liste des membres
  async function loadUsers() {
    try {
      const cacheBuster = `t=${Date.now()}`;
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?${cacheBuster}`);
      
      if (!res.ok) throw new Error("Erreur GitHub API");
      
      const files = await res.json();
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      
      // On limite à 30 utilisateurs max pour la performance initiale si nécessaire
      const dataPromises = jsonFiles.map(f => 
        fetch(`${f.download_url}?${cacheBuster}`).then(r => r.json()).catch(() => null)
      );

      const allUsers = (await Promise.all(dataPromises)).filter(u => u !== null);
      
      // Tri par nombre d'abonnés (Popularité)
      setAuthors(allUsers.sort((a, b) => (b.subscribers?.length || 0) - (a.subscribers?.length || 0)));
    } catch (e) { 
      toast.error("Impossible de synchroniser le cercle");
    } finally { 
      setLoading(false); 
    }
  }

  // Gestion de l'abonnement
  const handleSubscription = async (targetAuthor, isSubscribed) => {
    if (!currentUser) {
      toast.error("Connectez-vous pour suivre cette plume");
      return;
    }
    
    if (targetAuthor.email === currentUser.email) return;

    const toastId = toast.loading(isSubscribed ? "Départ du cercle..." : "Rejoint le cercle...");

    try {
      const res = await fetch('/api/handle-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: isSubscribed ? "unsubscribe" : "subscribe", 
          targetEmail: targetAuthor.email, 
          subscriberEmail: currentUser.email,
          subscriberName: currentUser.penName || currentUser.name 
        })
      });

      if (!res.ok) throw new Error();
      
      toast.success(isSubscribed ? "Abonnement retiré" : `Vous suivez désormais ${targetAuthor.penName || 'cet auteur'}`, { id: toastId });
      
      // Rafraîchissement local immédiat pour l'UI
      loadUsers();
    } catch (e) { 
      toast.error("Échec de l'action. Réessayez.", { id: toastId }); 
    }
  };

  // Filtrage pour la recherche
  const filteredAuthors = authors.filter(a => 
    (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-6 bg-white">
      <div className="relative">
        <Loader2 className="animate-spin text-teal-600" size={50} />
        <UsersIcon className="absolute inset-0 m-auto text-teal-900" size={18} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
        Le cercle des plumes se réunit...
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-16 animate-in fade-in duration-700">
      
      {/* HEADER AVEC RECHERCHE */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4 w-full">
          <div className="inline-flex p-4 bg-slate-900 text-teal-400 rounded-3xl shadow-2xl">
            <UsersIcon size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">
              Communauté
            </h1>
            <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.5em]">
              L'élite des plumes de lisible.biz
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une plume..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-bold focus:ring-4 ring-teal-50 outline-none transition-all"
          />
        </div>
      </header>

      {/* GRILLE DES MEMBRES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.length > 0 ? filteredAuthors.map((a) => {
          const subscribersCount = a.subscribers?.length || 0;
          const isSubscribed = a.subscribers?.includes(currentUser?.email);
          const isMe = a.email === currentUser?.email;
          
          const isWinner = monthlyWinner && a.email === monthlyWinner.email;
          const isSuperReader = superReader && a.email === superReader.email;
          const isStaff = a.penName?.includes("Support") || a.name?.includes("Support");
          
          // Calcul de l'influence (sur une base de 100 abonnés pour le 100%)
          const progress = Math.min((subscribersCount / 100) * 100, 100);

          return (
            <div 
              key={a.email} 
              className={`relative bg-white rounded-[4rem] p-10 border transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] group ${
                isWinner || isSuperReader 
                ? 'border-amber-100 shadow-[0_20px_40px_rgba(251,191,36,0.05)]' 
                : 'border-slate-100 shadow-xl shadow-slate-100/30'
              }`}
            >
              {/* BADGES D'HONNEUR */}
              <div className="absolute -top-4 left-10 flex gap-2">
                {isWinner && (
                  <div className="bg-amber-400 text-slate-900 px-5 py-2 rounded-2xl flex items-center gap-2 shadow-xl animate-bounce">
                    <Crown size={14} fill="currentColor" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Plume du Mois</span>
                  </div>
                )}
                {isSuperReader && (
                  <div className="bg-teal-600 text-white px-5 py-2 rounded-2xl flex items-center gap-2 shadow-xl animate-pulse">
                    <BookOpen size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Super Reader</span>
                  </div>
                )}
                {isStaff && !isWinner && (
                  <div className="bg-slate-900 text-teal-400 px-5 py-2 rounded-2xl flex items-center gap-2 shadow-xl">
                    <ShieldCheck size={14} fill="currentColor" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Vérifié</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-slate-900 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl flex items-center justify-center text-4xl font-black text-teal-400 italic transition-transform group-hover:scale-105 duration-500">
                      {a.profilePic ? (
                        <img src={a.profilePic} className="w-full h-full object-cover" alt="" />
                      ) : (
                        (a.penName || a.name || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    {isSubscribed && (
                      <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-full border-4 border-white animate-in zoom-in">
                        <HeartIcon size={12} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-black text-3xl text-slate-900 italic tracking-tight leading-none">
                      {a.penName || a.name || "Plume Inconnue"}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
                        <TrendingUp size={14} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {subscribersCount} {subscribersCount > 1 ? 'Lecteurs' : 'Lecteur'}
                      </p>
                    </div>
                  </div>
                </div>

                {!isMe && (
                  <button 
                    onClick={() => handleSubscription(a, isSubscribed)} 
                    className={`p-5 rounded-3xl transition-all duration-300 active:scale-90 ${
                      isSubscribed 
                      ? 'bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 hover:shadow-rose-100' 
                      : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl shadow-slate-200'
                    }`}
                  >
                    {isSubscribed ? <UserMinus size={22} /> : <UserPlus size={22} />}
                  </button>
                )}
              </div>

              {/* JAUGE D'INFLUENCE */}
              <div className="mt-10 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Énergie Créative</span>
                  <span className="text-[10px] font-black text-slate-900 italic">{Math.floor(progress)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isWinner ? 'bg-amber-400' : isSuperReader ? 'bg-teal-600' : 'bg-slate-900'
                    }`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

              <Link 
                href={`/auteur/${encodeURIComponent(a.email)}`} 
                className="mt-8 flex items-center justify-center gap-3 w-full py-6 bg-slate-50 rounded-[2rem] text-[10px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all duration-300 uppercase tracking-[0.3em] group/btn shadow-sm"
              >
                Explorer la Bibliothèque 
                <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform duration-300" />
              </Link>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <p className="text-2xl font-black text-slate-300 italic">Aucune plume ne correspond à votre recherche.</p>
            <button onClick={() => setSearchTerm("")} className="text-teal-600 font-black uppercase text-[10px] tracking-widest underline">Effacer la recherche</button>
          </div>
        )}
      </div>

      <footer className="text-center pt-20 pb-10 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">
          Lisible.biz • Le Cercle de la Littérature de Demain
        </p>
      </footer>
    </div>
  );
}

// Composant icône Heart simple
function HeartIcon({ size, fill }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fill || "none"} 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

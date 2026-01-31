"use client";
import React, { useEffect, useState, useCallback } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, 
  ArrowRight, TrendingUp, Crown, Loader2, ShieldCheck, BookOpen,
  Search, Star, Sparkles, Heart
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

  // Chargement des trophées
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
      console.warn("Awards non configurés.");
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
      
      const dataPromises = jsonFiles.map(f => 
        fetch(`${f.download_url}?${cacheBuster}`).then(r => r.json()).catch(() => null)
      );

      const allUsers = (await Promise.all(dataPromises)).filter(u => u !== null);
      
      // Tri par influence (Solde de Li ou Abonnés)
      setAuthors(allUsers.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0)));
    } catch (e) { 
      toast.error("Impossible de synchroniser le cercle");
    } finally { 
      setLoading(false); 
    }
  }

  // Gestion de l'abonnement
  const handleSubscription = async (targetAuthor, isSubscribed) => {
    if (!currentUser) {
      toast.error("Connectez-vous pour rejoindre ce cercle");
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
      
      toast.success(isSubscribed ? "Abonnement retiré" : `Vous suivez désormais ${targetAuthor.penName}`, { id: toastId });
      loadUsers();
    } catch (e) { 
      toast.error("Action impossible", { id: toastId }); 
    }
  };

  const filteredAuthors = authors.filter(a => 
    (a.penName || a.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ouverture du Cercle...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-16 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4">
          <div className="inline-flex p-4 bg-slate-900 text-teal-400 rounded-3xl shadow-xl">
            <UsersIcon size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">Communauté</h1>
            <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.5em]">L'économie de l'esprit par Lisible.biz</p>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une plume..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-5 text-sm font-bold focus:ring-4 ring-teal-50 outline-none transition-all"
          />
        </div>
      </header>

      {/* GRILLE DES MEMBRES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.map((a) => {
          const subscribersCount = a.subscribers?.length || 0;
          const isSubscribed = a.subscribers?.includes(currentUser?.email);
          const liBalance = a.wallet?.balance || 0;
          const isMe = a.email === currentUser?.email;
          
          const isWinner = monthlyWinner && a.email === monthlyWinner.email;
          
          // Influence basée sur les Li accumulés (Palier 10k pour 100%)
          const influenceProgress = Math.min((liBalance / 10000) * 100, 100);

          return (
            <div 
              key={a.email} 
              className="relative bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-100/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group"
            >
              {/* BADGE PLUME DU MOIS */}
              {isWinner && (
                <div className="absolute -top-4 left-10 bg-amber-400 text-slate-900 px-5 py-2 rounded-2xl flex items-center gap-2 shadow-lg animate-bounce z-10">
                  <Crown size={14} fill="currentColor" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Plume du Mois</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-slate-900 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-xl flex items-center justify-center text-4xl font-black text-teal-400 italic">
                    {a.profilePic ? (
                      <img src={a.profilePic} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (a.penName || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-black text-2xl text-slate-900 italic tracking-tight">{a.penName || "Plume Anonyme"}</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-teal-600">
                        <UsersIcon size={12} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{subscribersCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Sparkles size={12} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{liBalance} Li</span>
                      </div>
                    </div>
                  </div>
                </div>

                {!isMe && (
                  <button 
                    onClick={() => handleSubscription(a, isSubscribed)} 
                    className={`p-5 rounded-2xl transition-all ${
                      isSubscribed ? 'bg-slate-50 text-slate-300 hover:text-rose-500' : 'bg-slate-900 text-white hover:bg-teal-600'
                    }`}
                  >
                    {isSubscribed ? <UserMinus size={20} /> : <UserPlus size={20} />}
                  </button>
                )}
              </div>

              {/* BARRE D'INFLUENCE (LI) */}
              <div className="mt-10 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Rayonnement du Li</span>
                  <span className="text-[10px] font-black text-slate-900 italic">{Math.floor(influenceProgress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-amber-400 rounded-full transition-all duration-1000" 
                    style={{ width: `${influenceProgress}%` }} 
                  />
                </div>
              </div>

              <Link 
                href={`/auteur/${encodeURIComponent(a.email)}`} 
                className="mt-8 flex items-center justify-center gap-3 w-full py-5 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-[0.3em] group/btn"
              >
                Visiter la Galerie
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>

      <footer className="text-center pt-20 border-t border-slate-50">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Lisible.biz • Le Cercle des Écrivains</p>
      </footer>
    </div>
  );
}
